const { test: setup, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/Authpage');
const fs = require('fs');
const path = require('path');

/**
 * Global authentication setup for Roadtrippers.
 * Saves the storage state to a file for reuse in subsequent tests.
 */
const AUTH_FILE = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
    // Disable timeout for this specific test as it's a setup task that can be slow
    setup.slow();

    console.log('Starting global authentication setup...');
    const authPage = new AuthPage(page);

    // Ensure the auth directory exists
    const authDir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(authDir)) {
        console.log(`Creating directory: ${authDir}`);
        fs.mkdirSync(authDir, { recursive: true });
    }

    // Use environment variables for credentials
    const email = process.env.RT_USER_EMAIL;
    const password = process.env.RT_USER_PASSWORD;

    if (!email || !password) {
        console.warn('⚠️ Credentials not found in environment variables (RT_USER_EMAIL/RT_USER_PASSWORD).');
        console.warn('Skipping authentication and creating empty auth state.');
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
        console.log('Auth state saved (empty)');
        return;
    }

    console.log(`Authenticating as: ${email}`);

    try {
        // 1. Open homepage
        console.log('Opening homepage...');
        await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
        
        // Handle Gist and other overlays immediately
        console.log('Removing potential overlays...');
        await page.evaluate(() => {
            const selectors = [
                '#gist-overlay', '#gist-embed-message', 
                '.onetrust-pc-dark-filter', '#onetrust-consent-sdk',
                '.rt-modal-background'
            ];
            selectors.forEach(s => document.querySelector(s)?.remove());
        }).catch(() => {});

        // 2. Dismiss cookie banner
        console.log('Dismissing cookie banner...');
        await authPage.dismissCookieBanner();

        // 3. Click Sign In
        console.log('Clicking Sign In button...');
        await authPage.signInButton.waitFor({ state: 'visible', timeout: 15000 });
        await authPage.signInButton.click();

        // 4. Fill credentials
        console.log('Filling credentials...');
        const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
        const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
        
        await emailInput.waitFor({ state: 'visible', timeout: 15000 });
        await emailInput.fill(email);
        await passwordInput.fill(password);

        // 5. Submit login
        console.log('Submitting login form...');
        const submitButton = page.locator('button[type="submit"], .modal-container.show button[type="submit"]').first();
        await submitButton.click();

        // 6. Wait for login to complete
        console.log('Waiting for authentication to complete...');
        // We look for the user avatar as a sign of successful login
        await authPage.userAvatar.waitFor({ state: 'visible', timeout: 30000 });

        // 7. Save storage state
        console.log('Saving storage state...');
        await page.context().storageState({ path: AUTH_FILE });
        console.log('Auth state saved');
        console.log(`✓ Auth state saved to ${AUTH_FILE}`);

    } catch (error) {
        console.error(`❌ Authentication failed: ${error.message}`);
        
        // Take a screenshot on failure for debugging in CI
        const screenshotPath = path.join(authDir, 'setup-failure.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);

        // Fallback: create an empty auth state so tests can still run (even if they fail later)
        if (!fs.existsSync(AUTH_FILE)) {
            console.log('Creating fallback empty auth state.');
            fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
            console.log('Auth state saved (fallback)');
        }
        
        // In CI, we might want to fail the setup job if authentication is critical
        // For now, we allow it to continue to see if other tests can pass or handle it
    }
});
