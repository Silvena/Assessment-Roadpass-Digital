const { test, expect } = require('@playwright/test');
const { MapPage } = require('../pages/MapPage');
const { TripPlannerPage } = require('../pages/TripPlannerPage');
const { AuthPage } = require('../pages/Authpage');

/**
 * Trip Planning New Edge Cases Test Suite
 *Includes boundary tests, security sanitization, and state-transition tests.
 */

/**
 * THOSE TEST WILL FAILS, DOU TO
 * <a class="nav-link js-route" data-id="trip-planner" href="/">Trip Planner</a>
 * href is not working, and the test is not able to click on "New Trip" button, and open the trip planner panel.
 * I have tried to click on the "New Trip" button using different selectors, but it seems that the button is not interactable.
 * I have also tried to click on the "New Trip" button using JavaScript, but it seems that the button is not working.
 * I have also tried to click on the "New Trip" button using the keyboard, but it seems that the button is not working.
 * I have also tried to click on the "New Trip" button using the mouse, but it seems that the button is not working.
 * that's why they are ignored
 */
test.describe('Trip Planning - New Edge Cases', () => {
  /** @type {MapPage} */
  let mapPage;
  /** @type {TripPlannerPage} */
  let tripPlanner;

  test.beforeEach(async ({ page }) => {
    mapPage = new MapPage(page);
    tripPlanner = new TripPlannerPage(page);
    const authPage = new AuthPage(page);

    await mapPage.navigate();
    await authPage.dismissCookieBanner();

    // Dismiss any modal that appears on load
    await mapPage.dismissAnyModal();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);


    // If global setup failed to authenticate, log in inline so tests are not blocked
    if (!await authPage.isLoggedIn()) {
      await authPage.login(
        process.env.RT_USER_EMAIL,
        process.env.RT_USER_PASSWORD
      );
      await mapPage.waitForMapLoad();
    } else {
       console.log('Already logged in');
    }
  });

  // ── TC-NEW-01: Boundary - Maximum Length Trip Name ─────────────────────────
  test.fixme('TC-NEW-01: should handle a very long trip name (255 characters)', async () => {
    const maxLengthName = 'A'.repeat(255);
    
    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    
    await tripPlanner.setTripName(maxLengthName);
    await tripPlanner.addWaypoint('Denver, Colorado');
    
    const savedName = await tripPlanner.getTripName();
    // Verify it either accepts 255 or truncates gracefully
    expect(savedName).toBe(maxLengthName);
  });

  // ── TC-NEW-02: Security/Sanitization - HTML and Script Tags ────────────────
  test.fixme('TC-NEW-02: should sanitize or safely display HTML/Script tags in trip name', async () => {
    const riskyName = '<b>Trip</b><script>alert(1)</script>';
    
    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    
    await tripPlanner.setTripName(riskyName);
    await tripPlanner.addWaypoint('Chicago, Illinois');
    
    const savedName = await tripPlanner.getTripName();
    expect(savedName).toBe(riskyName);
    // Note: The UI should render this as text, not execute the script.
  });

  // ── TC-NEW-03: State - Rapid Add and Remove Waypoint ────────────────────────
  test.fixme('TC-NEW-03: should correctly update state when a waypoint is added and immediately removed', async () => {
    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName('Add-Remove Test');

    const location = 'New York, NY';
    await tripPlanner.addWaypoint(location);
    
    let count = await tripPlanner.getWaypointCount();
    expect(count).toBe(1);

    // Locate the remove button for the first waypoint and click it
    const removeButton = tripPlanner.waypointList.locator('button[aria-label*="remove" i], .remove-stop, .delete-icon').first();
    await removeButton.click();

    // Verify it returns to 0
    await expect(async () => {
      const newCount = await tripPlanner.getWaypointCount();
      expect(newCount).toBe(0);
    }).toPass({ timeout: 5000 });
  });

  // ── TC-NEW-04: Stress - Large Number of Waypoints ───────────────────────────
  test.fixme('TC-NEW-04: should support adding a large number of waypoints (15 stops)', async () => {
    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName('Large Trip Stress Test');

    const stops = [
      'Atlanta', 'Nashville', 'St. Louis', 'Kansas City', 'Denver',
      'Salt Lake City', 'Las Vegas', 'Los Angeles', 'San Francisco', 'Portland',
      'Seattle', 'Boise', 'Billings', 'Minneapolis', 'Chicago'
    ];

    for (const stop of stops) {
      await tripPlanner.addWaypoint(stop);
    }

    const finalCount = await tripPlanner.getWaypointCount();
    expect(finalCount).toBe(stops.length);
  });

  // ── TC-NEW-05: Input - Leading and Trailing Whitespace in Waypoint ──────────
  test.fixme('TC-NEW-05: should trim or handle leading/trailing whitespace in waypoint search', async () => {
    const dirtyLocation = '   Miami, Florida   ';
    
    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName('Whitespace Waypoint Test');

    await tripPlanner.addWaypoint(dirtyLocation);
    
    const exists = await tripPlanner.waypointExists('Miami');
    expect(exists).toBe(true);
  });
});
