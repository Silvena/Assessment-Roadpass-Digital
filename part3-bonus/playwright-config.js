const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './',
    testMatch: '**/*.spec.js',
    timeout: 20_000,
    retries: 1,

    use: {
        // Base URL used by all request.get/post calls when a relative path is given
        baseURL: 'https://maps.roadtrippers.com',

        // Extra HTTP headers sent with every API request
        extraHTTPHeaders: {
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },

        // Ignore HTTPS certificate errors (uncomment if needed behind a proxy)
        // ignoreHTTPSErrors: true,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],

    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ],
});

