const { test, expect } = require('@playwright/test');
const { MapPage } = require('../../pages/MapPage');
const { TripPlannerPage } = require('../../pages/TripPlannerPage');

test.describe('Quarantined Trip Planner Tests', () => {
    let mapPage;
    let tripPlannerPage;

    test.beforeEach(async ({ page }) => {
        mapPage = new MapPage(page);
        tripPlannerPage = new TripPlannerPage(page);
        
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Open Trip Planner panel before interacting with its elements
        await mapPage.clickNewTrip();
        await tripPlannerPage.waitForPanelOpen();
    });

    test('should set and retrieve trip name', async ({ page }) => {
        const testName = 'Quarantined Test Trip';

        await tripPlannerPage.setTripName(testName);
        const value = await tripPlannerPage.getTripName();
        
        expect(value).toBe(testName);
        console.log('✓ Trip name set successfully');
    });

    test('should handle waypoint search input', async ({ page }) => {
        const testLocation = 'Las Vegas';
        
        await tripPlannerPage.waypointSearchInput.click();
        await tripPlannerPage.waypointSearchInput.fill(testLocation);
        
        const value = await tripPlannerPage.waypointSearchInput.inputValue();
        expect(value).toContain(testLocation);
        console.log('✓ Waypoint input filled successfully');
    });
});
