const { expect, chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = 'auth/.auth/user.json';
const BASE_URL = 'https://maps.roadtrippers.com';

/**
 * Global Setup — runs once before all tests.
 *
 * Authenticates with Roadtrippers using email/password credentials
 * from environment variables, then persists browser storage state
 * so all tests reuse the authenticated session without logging in each time.
 */
module.exports = async (config) => {
    const email = process.env.ROADTRIPPERS_EMAIL;
    const password = process.env.ROADTRIPPERS_PASSWORD;

    if (!email || !password) {
        console.warn(
            ' Missing ROADTRIPPERS_EMAIL or ROADTRIPPERS_PASSWORD env vars. Skipping authentication setup.');
        return;
    }

    const authDir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Attempting to authenticate with Roadtrippers...');

        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        console.log('✓ Navigated to Roadtrippers homepage');

        // Dismiss OneTrust cookie consent (bottom banner or Preference Center)
        try {
            const acceptBtn = page.locator(
                '#accept-recommended-btn-handler, #onetrust-accept-btn-handler'
            ).first();
            await acceptBtn.click({ timeout: 8_000 });
            await page.locator('#onetrust-consent-sdk').waitFor({ state: 'detached', timeout: 5_000 }).catch(() => {});
            console.log('✓ Dismissed cookie banner');
        } catch {
            console.log('  No cookie banner found, continuing...');
        }

        // Remove Gist promotional overlay (no close button — must remove from DOM)
        await page.evaluate(() => {
            document.getElementById('gist-overlay')?.remove();
            document.getElementById('gist-embed-message')?.remove();
        }).catch(() => {});

        // Click Sign In link
        const signInLink = page.locator('a[href*="login"], a:has-text("Sign in"), a:has-text("Log in")').first();
        await signInLink.waitFor({ state: 'visible', timeout: 10_000 });
        await signInLink.click({ force: true });
        console.log('✓ Clicked sign in link');

        // Wait for the login modal to appear
        await page.locator('.modal-container.show').waitFor({ state: 'visible', timeout: 10_000 });
        console.log('✓ Login modal appeared');

        // Fill email — the field is labeled "Username or Email Address"
        const emailField = page.locator('.modal-container.show').locator(
            'input[name="email"], input[name="login"], input[name="username"], input[placeholder*="email" i], input[placeholder*="username" i]'
        ).first();
        await emailField.waitFor({ state: 'visible', timeout: 8_000 });
        await emailField.fill(email);
        console.log('✓ Entered email');

        // Fill password
        const passwordField = page.locator('.modal-container.show').locator(
            'input[type="password"], input[name="password"]'
        ).first();
        await passwordField.waitFor({ state: 'visible', timeout: 5_000 });
        await passwordField.fill(password);
        console.log('✓ Entered password');

        // Click the submit button scoped to the login modal
        const submitBtn = page.locator('.modal-container.show button[type="submit"]');
        await submitBtn.click();
        console.log('✓ Clicked login button');

        // Wait for the modal to close — this is the reliable login success signal
        await page.locator('.modal-container.show').waitFor({ state: 'hidden', timeout: 30_000 });
        await page.waitForLoadState('domcontentloaded');
        console.log('✓ Successfully logged in (modal closed)');

        // Save authentication state
        await context.storageState({ path: AUTH_FILE });
        console.log(`✓ Auth state saved to ${AUTH_FILE}`);

    } catch (error) {
        console.error('Authentication failed:', error.message);
        // Take a screenshot for debugging
        await page.screenshot({ path: 'auth/.auth/setup-failure.png', fullPage: true }).catch(() => {});
        // Write an empty auth file so tests can start (they will re-authenticate inline)
        fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    } finally {
        await browser.close();
    }
};
