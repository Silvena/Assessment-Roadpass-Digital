const { defineConfig } = require('@playwright/test');

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
            'Accept': 'application/json',
            'User-Agent': 'Playwright-API-Test/1.0',
        },

        // Ignore HTTPS certificate errors (uncomment if needed behind a proxy)
        // ignoreHTTPSErrors: true,
    },

    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ],
});

