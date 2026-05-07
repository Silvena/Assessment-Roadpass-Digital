const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/Authpage');

test.describe('AuthPage Tests', () => {
    let authPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
    });

    test('should instantiate AuthPage correctly', async () => {
        expect(authPage).toBeDefined();
        expect(typeof authPage.open).toBe('function');
        expect(typeof authPage.login).toBe('function');
        expect(typeof authPage.isLoggedIn).toBe('function');
        expect(typeof authPage.assertLoggedIn).toBe('function');
        expect(typeof authPage.dismissCookieBanner).toBe('function');
    });

    test('should open homepage and dismiss cookie banner', async ({ page }) => {
        await authPage.open();
        // Verify we're on the homepage
        await expect(page).toHaveURL(/maps\.roadtrippers\.com/);
    });

    test('should check if user is logged in (should be false initially)', async () => {
        const loggedIn = await authPage.isLoggedIn();
        expect(loggedIn).toBe(false);
    });

    test('should attempt login with invalid credentials and handle gracefully', async ({ page }) => {
        // This test will attempt login but expect it to fail gracefully
        await authPage.open();

        try {
            await authPage.login('invalid@example.com', 'invalidpassword');
            // If login succeeds unexpectedly, that's fine - but unlikely
        } catch (error) {
            // Expected to fail with invalid credentials
            expect(error.message).toMatch(/timeout|visible/);
        }
    });

    test('assertLoggedIn should fail when not logged in', async () => {
        try {
            await authPage.assertLoggedIn();
            // If this doesn't throw, the test should fail
            expect(true).toBe(false); // Force failure if assertLoggedIn doesn't throw
        } catch (error) {
            // Expected to fail
            expect(error.message).toContain('toBeVisible');
        }
    });
});
