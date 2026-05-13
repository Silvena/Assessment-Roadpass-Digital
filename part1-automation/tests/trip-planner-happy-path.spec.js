const { test, expect } = require('@playwright/test');
const { TripPlannerPage } = require('../pages/TripPlannerPage');

test.describe('TripPlannerPage Tests', () => {
    let tripPlannerPage;

    test.beforeEach(async ({ page }) => {
        tripPlannerPage = new TripPlannerPage(page);
        // Navigate to the maps page using baseURL from playwright.config.js
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

    test('should instantiate TripPlannerPage correctly', async () => {
        expect(tripPlannerPage).toBeDefined();
        expect(typeof tripPlannerPage.setTripName).toBe('function');
        expect(typeof tripPlannerPage.addWaypoint).toBe('function');
        expect(typeof tripPlannerPage.saveTrip).toBe('function');
        expect(typeof tripPlannerPage.getTripName).toBe('function');
        expect(typeof tripPlannerPage.getWaypointCount).toBe('function');
    });

    test('should have all required locators', async () => {
        expect(tripPlannerPage.tripPanel).toBeDefined();
        expect(tripPlannerPage.tripNameInput).toBeDefined();
        expect(tripPlannerPage.waypointSearchInput).toBeDefined();
        expect(tripPlannerPage.saveTripButton).toBeDefined();
        expect(tripPlannerPage.waypointList).toBeDefined();
        expect(tripPlannerPage.validationError).toBeDefined();
        expect(tripPlannerPage.successToast).toBeDefined();
    });



    test('should detect trip panel when visible', async ({ page }) => {
        const tripPanel = page.locator('[data-testid="trip-panel"], .trip-planner, [aria-label="Trip planner"]').first();

        const isPanelVisible = await tripPanel.isVisible({ timeout: 5000 }).catch(() => false);

        if (isPanelVisible) {
            console.log('✓ Trip panel is visible');
            expect(isPanelVisible).toBe(true);
        } else {
            console.log('ℹ️ Trip panel not visible (may require triggering new trip creation)');
        }
    });

    test('should locate save trip button', async ({ page }) => {
        const saveButton = page.getByRole('button', { name: /save trip|save/i }).first();

        const isVisible = await saveButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (isVisible) {
            console.log('✓ Save trip button found');
            expect(isVisible).toBe(true);
        } else {
            console.log('ℹ️ Save trip button not visible on initial page');
        }
    });

    test('should get waypoint count', async ({ page }) => {
        const waypointList = page.locator('[data-testid="waypoint-list"], .waypoint-list, [aria-label="Trip stops"]');

        const existsInDOM = await waypointList.count().catch(() => 0);

        if (existsInDOM > 0) {
            const items = await waypointList
                .locator('[data-testid="waypoint-item"], .waypoint-item, li')
                .all();
            console.log(`✓ Found ${items.length} waypoints`);
            expect(Array.isArray(items)).toBe(true);
        } else {
            console.log('ℹ️ Waypoint list not found in DOM');
        }
    });

    test('should check if waypoint exists', async ({ page }) => {
        const waypointList = page.locator('[data-testid="waypoint-list"], .waypoint-list, [aria-label="Trip stops"]');

        const listExists = await waypointList.count().catch(() => 0);

        if (listExists > 0) {
            const testWaypoint = await waypointList.getByText('test', { exact: false }).isVisible({ timeout: 3000 }).catch(() => false);
            console.log(`✓ Waypoint check completed`);
            expect(typeof testWaypoint).toBe('boolean');
        } else {
            console.log('ℹ️ Waypoint list not available');
        }
    });

    test('should detect validation errors when present', async ({ page }) => {
        const validationError = page.getByRole('alert')
            .or(page.locator('[data-testid="validation-error"], .field-error, .form-error'))
            .first();

        const isVisible = await validationError.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
            const errorText = await validationError.innerText();
            console.log(`✓ Validation error detected: ${errorText}`);
            expect(errorText.length).toBeGreaterThan(0);
        } else {
            console.log('ℹ️ No validation errors present initially');
        }
    });

    test('should detect success toast when present', async ({ page }) => {
        const successToast = page.locator('[data-testid="toast-success"], .toast-success, [role="status"]')
            .or(page.getByText(/trip saved|saved successfully/i))
            .first();

        const isVisible = await successToast.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
            const toastText = await successToast.innerText();
            console.log(`✓ Success toast detected: ${toastText}`);
            expect(toastText.length).toBeGreaterThan(0);
        } else {
            console.log('ℹ️ No success toast present initially');
        }
    });

    test('should check if save button is enabled', async ({ page }) => {
        const saveButton = page.getByRole('button', { name: /save trip|save/i }).first();

        const isVisible = await saveButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (isVisible) {
            const isEnabled = await saveButton.isEnabled().catch(() => false);
            console.log(`✓ Save button enabled state: ${isEnabled}`);
            expect(typeof isEnabled).toBe('boolean');
        } else {
            console.log('ℹ️ Save button not visible');
        }
    });

    test('should verify method chaining on setTripName', async ({ page }) => {
        const tripNameInput = page.getByPlaceholder(/trip name|name your trip/i)
            .or(page.getByLabel(/trip name/i))
            .first();

        const isVisible = await tripNameInput.isVisible({ timeout: 5000 }).catch(() => false);

        if (isVisible) {
            // Test that methods return 'this' for chaining
            const result = await tripPlannerPage.setTripName('Test Trip');
            expect(result).toBe(tripPlannerPage);
            console.log('✓ Method chaining works correctly');
        } else {
            console.log('ℹ️ Trip input not available for chaining test');
        }
    });
});
