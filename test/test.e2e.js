import { test, expect } from '@playwright/test'

test('All the mocha tests passed', async ({ page }) => {
  await page.goto('http://localhost:3000/test/e2e.runtime.html')
  const testFailures = await page.evaluate('window.testFailures')

  expect(testFailures).toBe(0)
})
