const { expect } = require('@playwright/test');

class BasePage {

    constructor(page) {
        this.page = page;
    }
    /**
     * Navigate to a path on the site.
     * e.g. goto('/dashboard') goes to maps.roadtrippers.com/dashboard
     */
    async goto(path='') {
        await this.page.goto(path);
    }
    /**
     * Wait until the page stops making network requests.
     * This replaces arbitrary sleep() calls — instead of waiting 3 seconds
     * blindly, we wait until the page is actually done loading.
     */
    async waitForNetworkIdle() {
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 10_000 });
        } catch {
            // If networkidle times out, fall back to domcontentloaded
            await this.page.waitForLoadState('domcontentloaded');
        }
    }

    /**
     * check that the URl contains 'trips'
     */
    async assertURLContains(fragment){
        await expect(this.page).toHaveURL(new RegExp(fragment));
    }
    async assertToastVisible(pattern){
        const toast=this.page.locator('[role="status"], [role="alert"], .toast, .notification')
        await  expect (toast.filter({hasText: pattern})).toBeVisible();
    }

    async dismissAnyModal() {
        const closeBtn = this.page.getByRole('button', { name: /close|dismiss|×/i });
        if (await closeBtn.isVisible().catch(()=> false)) {
            await closeBtn.click();
        }
    }
}
//meke this class visible to other files
module.exports = {BasePage};
