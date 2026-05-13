const { test, expect } = require('@playwright/test');
const { MapPage } = require('../../pages/MapPage');
const { TripPlannerPage } = require('../../pages/TripPlannerPage');


    test.describe('Quarantined TripPlannerPage Tests', () => {
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

});
