const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: '.',
  testMatch: ['tests/**/*.spec.js'],
  timeout:60_000,
  expect:{timeout:10_000},

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* In CI, retry flaky tests up to 2 times. Locally, no retries. */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI
    ? [
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['list'],
      ]
    : [
        ['html', { open: 'on-failure', outputFolder: 'playwright-report' }],
        ['list'],
      ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'https://maps.roadtrippers.com',
    headless: true,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /auth\/.*\.setup\.js/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: './auth/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: './auth/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: './auth/.auth/user.json' },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
outputDir: 'reports/test-results',
  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
