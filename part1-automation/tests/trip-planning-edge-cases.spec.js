const { test, expect } = require('@playwright/test');
const { MapPage } = require('../pages/MapPage');
const { TripPlannerPage } = require('../pages/TripPlannerPage');
const { AuthPage } = require('../pages/Authpage');

/**
 * Trip Planning Edge Cases Test Suite
 *
 * Tests various edge cases and boundary conditions for the trip planning feature.
 * Auth state is pre-loaded from auth/.auth/user.json (see global.setup.js).
 */

test.describe('Trip Planning - Edge Cases', () => {
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

    // If global setup failed to authenticate, log in inline so tests are not blocked
    if (!await authPage.isLoggedIn()) {
      await authPage.login(
        process.env.ROADTRIPPERS_EMAIL,
        process.env.ROADTRIPPERS_PASSWORD
      );
      await mapPage.waitForMapLoad();
    }
  });

  // ── TC-01: Boundary - Empty Trip Name ──────────────────────────────────────
  test('TC-01: should not allow saving a trip with only whitespace as name', async () => {
    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();

    // Attempt to set whitespace-only name
    await tripPlanner.setTripName('   ');
    await tripPlanner.addWaypoint('Denver, Colorado');

    const isSaveEnabled = await tripPlanner.isSaveButtonEnabled();
    expect(isSaveEnabled).toBe(false);
  });

  // ── TC-02: Boundary - Maximum Waypoint Count ───────────────────────────────
  test('TC-02: should handle adding multiple waypoints to a trip', async () => {
    const tripName = `Multi-Waypoint Trip ${Date.now()}`;

    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName(tripName);

    // Add 5 waypoints
    const locations = ['New York', 'Boston', 'Philadelphia', 'Baltimore', 'Washington DC'];
    for (const location of locations) {
      await tripPlanner.addWaypoint(location);
    }

    const waypointCount = await tripPlanner.getWaypointCount();
    expect(waypointCount).toBe(5);
  });

  // ── TC-03: Boundary - Single Character Trip Name ────────────────────────────
  test('TC-03: should accept a single character trip name', async () => {
    const singleCharName = 'A';

    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName(singleCharName);
    await tripPlanner.addWaypoint('Seattle, Washington');

    const savedName = await tripPlanner.getTripName();
    expect(savedName).toBe(singleCharName);
  });

  // ── TC-04: Boundary - Numeric Trip Name ────────────────────────────────────
  test('TC-04: should accept a numeric-only trip name', async () => {
    const numericName = '2024';

    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName(numericName);
    await tripPlanner.addWaypoint('Portland, Oregon');

    const savedName = await tripPlanner.getTripName();
    expect(savedName).toBe(numericName);
  });

  // ── TC-05: Boundary - Very Long Location Name ──────────────────────────────
  test('TC-05: should handle adding waypoints with very long names', async () => {
    const tripName = `Long Location Trip ${Date.now()}`;
    const longLocation = 'Saint ' + 'Mary '.repeat(50); // Very long location name

    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName(tripName);
    await tripPlanner.addWaypoint(longLocation);

    const waypointCount = await tripPlanner.getWaypointCount();
    expect(waypointCount).toBeGreaterThanOrEqual(1);
  });

  // ── TC-06: State - Clearing Trip Name Between Inputs ───────────────────────
  test('TC-06: should properly update trip name when changed multiple times', async () => {
    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();

    // Set initial name
    await tripPlanner.setTripName('First Trip');
    let currentName = await tripPlanner.getTripName();
    expect(currentName).toBe('First Trip');

    // Update name
    await tripPlanner.setTripName('Updated Trip');
    currentName = await tripPlanner.getTripName();
    expect(currentName).toBe('Updated Trip');

    await tripPlanner.addWaypoint('Las Vegas, Nevada');
  });

  // ── TC-07: Validation - Duplicate Waypoint Addition ────────────────────────
  test('TC-07: should handle adding the same location as waypoint multiple times', async () => {
    const tripName = `Duplicate Waypoints Trip ${Date.now()}`;
    const location = 'Denver, Colorado';

    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName(tripName);

    // Add same location twice
    await tripPlanner.addWaypoint(location);
    await tripPlanner.addWaypoint(location);

    const waypointCount = await tripPlanner.getWaypointCount();
    expect(waypointCount).toBeGreaterThanOrEqual(2);
  });

  // ── TC-08: Boundary - Special Unicode Characters ────────────────────────────
  test('TC-08: should accept emoji and unicode characters in trip name', async () => {
    const unicodeName = `Road Trip 2024 - 北京 - МОСКВА`;

    await mapPage.clickNewTrip();
    await tripPlanner.waitForPanelOpen();
    await tripPlanner.setTripName(unicodeName);
    await tripPlanner.addWaypoint('London, England');

    const savedName = await tripPlanner.getTripName();
    expect(savedName.length).toBeGreaterThan(0);
  });
});
