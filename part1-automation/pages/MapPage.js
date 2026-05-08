const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * MapPage
 *
 * Represents the main map view — the authenticated landing page.
 * Responsible for navigation and surfacing the "New Trip" entry point.
 */
class MapPage extends BasePage {

  constructor(page) {
    super(page);
    this.url = '/';
  }

  get mapContainer() {
    return this.page
      .locator('[data-testid="map-container"], #map, .mapboxgl-canvas, .mapboxgl-map')
      .first();
  }

  // "New Trip" button covers many possible labels/roles Roadtrippers may use.
  // The `.or()` chain falls back left-to-right; `.first()` prevents strict-mode errors.
  get newTripButton() {
    return this.page.locator('[data-id="add-waypoint"]')
  }

  get userMenuButton() {
    return this.page
      .locator([
        '[data-testid="user-menu-button"]',
        '[data-testid="user-avatar"]',
        'button[aria-label*="account" i]',
        'button[aria-label*="profile" i]',
        'button[aria-label*="menu" i]',
        '.user-menu',
        'img[alt*="avatar"]',
      ].join(', '))
      .first();
  }

  get myTripsLink() {
    return this.page.getByRole('link', { name: /my trips/i });
  }

  async navigate() {
    await this.page.goto(this.url);
    await this.waitForMapLoad();
  }

  async waitForMapLoad() {
    await expect(this.mapContainer).toBeVisible({ timeout: 20_000 });
  }

  async clickNewTrip() {
    await expect(this.newTripButton).toBeVisible({ timeout: 15_000 });
    // Use force: true to bypass any transparent or lingering modal overlays
    // if they are just about to disappear.
    await this.newTripButton.click({ force: true });
  }

  async openUserMenu() {
    await this.userMenuButton.click();
  }

  async goToMyTrips() {
    await this.openUserMenu();
    await expect(this.myTripsLink).toBeVisible();
    await this.myTripsLink.click();
    await this.page.waitForURL(/trips/, { timeout: 15_000 });
  }

  async isMapLoaded() {
    return this.mapContainer.isVisible().catch(() => false);
  }
}

module.exports = { MapPage };
