'use strict';

const { defineConfig, devices } = require('@playwright/test');

const baseURL = `http://localhost:${process.env.PORT || 3000}`;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-ios',
      use: {
        browserName: 'chromium',
        // iPhone 13 viewport + mobile emulation, rendered via Chromium
        ...devices['iPhone 13'],
      },
    },
    {
      name: 'mobile-android',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'node tests/server.js',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
