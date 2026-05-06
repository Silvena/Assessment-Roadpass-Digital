const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * TripPlannerPage
 *
 * Encapsulates all interactions within the trip creation and editing panel.
 * This panel typically appears as a sidebar after clicking "New Trip" on MapPage.
 */
class TripPlannerPage extends BasePage {
  constructor(page) {
    super(page);
  }

  // Trip panel: the sidebar/drawer that opens after clicking "New Trip"
  get tripPanel() {
    return this.page
      .locator([
        '[data-testid="trip-panel"]',
        '[data-testid="trip-planner"]',
        '.trip-planner',
        '.trip-panel',
        '.sidebar',
        '[aria-label="Trip planner"]',
        '[aria-label="New trip"]',
        '.new-trip-panel',
        // Roadtrippers uses a panel with class "panel" for trip editing
        '.panel',
      ].join(', '))
      .first();
  }

  // Trip name input — could be a named input or a contenteditable header
  get tripNameInput() {
    return this.page
      .locator([
        'input[placeholder*="trip name" i]',
        'input[placeholder*="name your trip" i]',
        'input[name="name"]',
        'input[name="tripName"]',
        'input[aria-label*="trip name" i]',
        '[data-testid="trip-name-input"]',
        // Some apps use a contenteditable div for the trip title
        '[contenteditable][data-placeholder*="trip" i]',
      ].join(', '))
      .or(this.page.getByLabel(/trip name/i))
      .first();
  }

  // Waypoint search — the "Add a stop" search box
  get waypointSearchInput() {
    return this.page
      .locator([
        'input[placeholder*="add a stop" i]',
        'input[placeholder*="search for a place" i]',
        'input[placeholder*="where to" i]',
        'input[placeholder*="search" i]',
        'input[placeholder*="location" i]',
        'input[aria-label*="add stop" i]',
        'input[aria-label*="waypoint" i]',
        '[data-testid="waypoint-input"]',
        '[data-testid="search-input"]',
      ].join(', '))
      .first();
  }

  get saveTripButton() {
    return this.page
      .locator([
        'button:has-text("Save Trip")',
        'button:has-text("Save")',
        '[data-testid="save-trip"]',
      ].join(', '))
      .first();
  }

  // Waypoint list container
  get waypointList() {
    return this.page
      .locator([
        '[data-testid="waypoint-list"]',
        '.waypoint-list',
        '[aria-label="Trip stops"]',
        '.stops-list',
        '.trip-stops',
      ].join(', '))
      .first();
  }

  get validationError() {
    return this.page
      .getByRole('alert')
      .or(this.page.locator('[data-testid="validation-error"], .field-error, .form-error'))
      .first();
  }

  get successToast() {
    return this.page
      .locator('[data-testid="toast-success"], .toast-success, [role="status"]')
      .or(this.page.getByText(/trip saved|saved successfully/i))
      .first();
  }

  // Wait for the trip panel to open after clicking "New Trip"
  async waitForPanelOpen() {
    await expect(this.tripPanel).toBeVisible({ timeout: 15_000 });
  }

  async setTripName(name) {
    await expect(this.tripNameInput).toBeVisible({ timeout: 10_000 });
    await this.tripNameInput.clear();
    await this.tripNameInput.fill(name);
    return this;
  }

  async getTripName() {
    return this.tripNameInput.inputValue();
  }

  async addWaypoint(location) {
    await expect(this.waypointSearchInput).toBeVisible({ timeout: 10_000 });
    await this.waypointSearchInput.click();
    await this.waypointSearchInput.fill(location);
    await this._selectWaypointSuggestion();
    return this;
  }

  async _selectWaypointSuggestion() {
    // Autocomplete list: try multiple known patterns
    const suggestionList = this.page
      .locator([
        '[data-testid="autocomplete-list"]',
        '.autocomplete-results',
        '[role="listbox"]',
        '.suggestions',
        '.autocomplete-dropdown',
        '[data-testid="suggestion-list"]',
      ].join(', '))
      .first();

    await expect(suggestionList).toBeVisible({ timeout: 10_000 });

    const firstSuggestion = suggestionList
      .locator('[role="option"], li, [data-testid="suggestion-item"]')
      .first();

    await expect(firstSuggestion).toBeVisible({ timeout: 5_000 });
    await firstSuggestion.click();
    // Wait until dropdown collapses
    await expect(suggestionList).toBeHidden({ timeout: 8_000 });
  }

  async getWaypointCount() {
    const items = await this.waypointList
      .locator('[data-testid="waypoint-item"], .waypoint-item, .stop-item, li')
      .all();
    return items.length;
  }

  async waypointExists(locationName) {
    const item = this.waypointList.getByText(locationName, { exact: false });
    return item.isVisible().catch(() => false);
  }

  async saveTrip() {
    await expect(this.saveTripButton).toBeVisible();
    await expect(this.saveTripButton).toBeEnabled();
    await this.saveTripButton.click();
    await expect(this.successToast).toBeVisible({ timeout: 15_000 });
  }

  async trySaveTripWithoutWaypoints() {
    await expect(this.saveTripButton).toBeVisible();
    await this.saveTripButton.click();
  }

  async getValidationErrorText() {
    await expect(this.validationError).toBeVisible({ timeout: 5_000 });
    return this.validationError.innerText();
  }

  async isSaveButtonEnabled() {
    return this.saveTripButton.isEnabled().catch(() => false);
  }
}

module.exports = { TripPlannerPage };
