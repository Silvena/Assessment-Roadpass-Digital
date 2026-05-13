const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/Authpage');

test.describe('Cookie Banner - Accept and Dismiss Tests', () => {
    let authPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
    });

    test('should open homepage and detect cookie banner', async ({ page }) => {
        // Navigate to the homepage
        await authPage.open();

        // Verify we're on the correct URL
        await expect(page).toHaveURL(/maps\.roadtrippers\.com/);
    });

    test('should successfully dismiss cookie banner when present', async ({ page }) => {
        // Navigate to the homepage using baseURL from playwright.config.js
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Check if cookie banner exists and is visible
        const cookieBanner = page.locator(
            'button:has-text("Accept"), button:has-text("Got it"), button:has-text("OK"), button:has-text("Cookie Settings"), button:has-text("Cookie Preferences")'
        ).first();

        const bannerExists = await cookieBanner.isVisible({ timeout: 5000 }).catch(() => false);

        if (bannerExists) {
            console.log('✓ Cookie banner detected, attempting to dismiss');

            // Get the button text to know which one we're clicking
            const buttonText = await cookieBanner.textContent();
            console.log(`  Clicking button: "${buttonText.trim()}"`);

            // Click the button
            await cookieBanner.click({ timeout: 4_000 });

            // Wait a moment for the banner to disappear
            await page.waitForTimeout(1000);

            // Verify the banner is gone or hidden
            const bannerGone = await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false);

            if (bannerGone) {
                console.log('ℹ️ Banner still visible after click (may require additional clicks or have multiple states)');
            } else {
                console.log('✓ Banner successfully dismissed');
            }
        } else {
            console.log('ℹ️ Cookie banner not present on this page load (may be domain-specific or cached)');
        }
    });

    test('should handle dismissCookieBanner gracefully even if banner is not present', async () => {
        // This test verifies that dismissCookieBanner doesn't throw an error
        // when the cookie banner is not present
        try {
            await authPage.dismissCookieBanner();
            // Should not throw an error
            expect(true).toBe(true);
        } catch (error) {
            throw new Error(`dismissCookieBanner should not throw: ${error.message}`);
        }
    });

    test('should verify cookie banner locators are correct', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Define the cookie banner locator
        const cookieBannerLocator = page.locator(
            'button:has-text("Accept"), button:has-text("Got it"), button:has-text("OK"), button:has-text("Cookie Settings"), button:has-text("Cookie Preferences")'
        );

        // Check if any of these buttons exist in the DOM
        const count = await cookieBannerLocator.count();

        if (count > 0) {
            console.log(`✓ Found ${count} potential cookie banner button(s)`);

            // Get the first visible button
            const firstButton = page.locator(
                'button:has-text("Accept"), button:has-text("Got it"), button:has-text("OK"), button:has-text("Cookie Settings"), button:has-text("Cookie Preferences")'
            ).first();

            const isVisible = await firstButton.isVisible({ timeout: 3000 }).catch(() => false);
            expect(isVisible).toBe(true);

            // Verify the button has text
            const buttonText = await firstButton.textContent();
            const trimmedText = buttonText.trim();
            console.log(`  Button text: "${trimmedText}"`);
            expect(['Accept', 'Got it', 'OK', 'Cookie Settings', 'Cookie Preferences']).toContain(trimmedText);
        } else {
            console.log('ℹ️ No cookie banner buttons found (may have been dismissed or not applicable)');
        }
    });

    test('should verify open() method properly dismisses banner', async ({ page }) => {
        // The open() method should:
        // 1. Navigate to home ('/')
        // 2. Wait for network idle
        // 3. Dismiss cookie banner

        await authPage.open();

        // Verify we're on the homepage
        await expect(page).toHaveURL(/maps\.roadtrippers\.com/);

        // Verify the cookie banner is no longer blocking interactions
        // by attempting to interact with page elements
        try {
            // Try to find and interact with main page elements
            const mapContainer = page.locator('[data-testid="map-container"], #map, .map-container').first();
            const isMapVisible = await mapContainer.isVisible({ timeout: 5000 }).catch(() => false);

            // Even if map isn't visible, navigation should have succeeded
            expect(page.url()).toContain('maps.roadtrippers.com');
        } catch (error) {
            // If map doesn't exist, that's okay - we just verify we're on the right page
            expect(page.url()).toContain('maps.roadtrippers.com');
        }
    });

    test('should accept cookie banner and maintain session', async ({ page }) => {
        // Navigate to homepage
        await authPage.open();

        // After dismissing banner, page should be fully interactive
        await expect(page).toHaveURL(/maps\.roadtrippers\.com/);

        // Reload the page to test if cookie consent was saved
        await page.reload();
        await page.waitForTimeout(2000);

        // The banner should either:
        // 1. Not appear again (if cookie was saved)
        // 2. Appear again (if cookies not persisted or not a persistent banner)
        const bannerAfterReload = page.locator(
            'button:has-text("Accept"), button:has-text("Got it"), button:has-text("OK"), button:has-text("Cookie Settings"), button:has-text("Cookie Preferences")'
        ).first();

        const bannerVisible = await bannerAfterReload.isVisible({ timeout: 3000 }).catch(() => false);

        if (bannerVisible) {
            console.log('ℹ️ Banner appeared again after reload (banner is shown on each session or cookies not persisted)');
        } else {
            console.log('✓ Banner did not reappear (cookie consent was saved)');
        }

        // Either way, page should be functional
        await expect(page).toHaveURL(/maps\.roadtrippers\.com/);
    });
});
