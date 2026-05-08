const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class AuthPage extends BasePage {
    constructor(page) {
        super(page);

        this.signInButton = page.locator(
            'a[href*="login"], button:has-text("Sign in"), a:has-text("Log in")'
        ).first();
        this.emailInput = page.locator(
            'input[name="email"], input[name="login"], input[name="username"], input[placeholder*="email" i], input[placeholder*="username" i]'
        ).first();
        this.passwordInput = page.locator('input[type="password"], input[name="password"]').first();
        // Scope to the login modal so the search-bar submit button is not picked first
        this.submitButton = page.locator('.modal-container.show button[type="submit"]');
        this.userAvatar = page.locator(
            '[data-testid="user-avatar"], [data-testid="user-menu-button"], ' +
            '.user-menu, .user-avatar, img[alt*="avatar"], img[alt*="profile"], ' +
            'button[aria-label*="profile" i], button[aria-label*="account" i], ' +
            'button[aria-label*="avatar" i]'
        ).first();
        // OneTrust shows either a bottom banner or a full Preference Center on first visit.
        // "#accept-recommended-btn-handler" = "Allow All" inside the Preference Center modal.
        // "#onetrust-accept-btn-handler"    = "Accept All Cookies" on the bottom banner.
        // Excludes "Cookie Settings" — that button opens the modal and makes things worse.
        this.cookieBanner = page.locator(
            '#accept-recommended-btn-handler, #onetrust-accept-btn-handler, button:has-text("Allow All"), button:has-text("Accept All Cookies"), button:has-text("Accept All")'
        ).first();
    }

    /**
     * Open the Roadtrippers homepage and dismiss any cookie banners.
     */
    async open() {
        await this.page.goto('/');
        await this.waitForNetworkIdle();
        await this.dismissCookieBanner();
    }
    /**
     * Dismiss the cookie/GDPR banner if present.
     * Two-stage approach:
     *   1. Try clicking the accept button (OneTrust banner or Preference Center).
     *   2. Forcefully remove the entire OneTrust SDK + Gist overlays from the DOM
     *      so they cannot block subsequent clicks regardless of click success.
     */
    async dismissCookieBanner() {
        // Stage 1: Try clicking the accept/allow-all button
        try {
            await this.cookieBanner.click({ timeout: 8_000 });
        } catch {
            // Button not found or timed out — will clean up in stage 2
        }

        // Stage 2: Forcefully remove ALL OneTrust and Gist overlay elements from the DOM.
        // This guarantees nothing is left blocking pointer events, even if the click
        // succeeded but OneTrust's animation hasn't fully hidden the dark-filter yet.
        await this.page.evaluate(() => {
            document.getElementById('onetrust-consent-sdk')?.remove();
            document.querySelector('.onetrust-pc-dark-filter')?.remove();
            document.querySelector('.rt-modal-background')?.remove();
            document.getElementById('gist-overlay')?.remove();
            document.getElementById('gist-embed-message')?.remove();
        }).catch(() => {});
    }

    /**
     * Log in with email and password.
     */
    async login(email, password) {
        await this.signInButton.click();
        await this.emailInput.waitFor({ state: 'visible' });
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
        // Wait for the login modal to close — the .show class is removed on success
        await this.page.locator('.modal-container.show').waitFor({ state: 'hidden', timeout: 30_000 });
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Check if the user is logged in.
     * Races avatar (authenticated) vs sign-in link (unauthenticated).
     * Suppressing both sides' rejections so only the final visibility check matters.
     */
    async isLoggedIn() {
        await Promise.race([
            this.userAvatar.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {}),
            this.signInButton.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {}),
        ]);
        return this.userAvatar.isVisible().catch(() => false);
    }

    /**
     * Assert that the user is logged in.
     */
    async assertLoggedIn() {
        await expect(this.userAvatar).toBeVisible({ timeout: 15_000 });
    }
}

module.exports = { AuthPage };
