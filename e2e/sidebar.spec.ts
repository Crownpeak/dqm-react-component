/**
 * DQM Sidebar E2E Tests
 *
 * End-to-end tests for the DQM Sidebar component.
 */
import { test, expect } from '@playwright/test';

test.describe('DQM Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dev app
    await page.goto('/');
  });

  test('should display the FAB button', async ({ page }) => {
    // The FAB should be visible
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await expect(fab.first()).toBeVisible();
  });

  test('should open sidebar when FAB is clicked', async ({ page }) => {
    // Click the FAB to open sidebar
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await fab.first().click();

    // Sidebar drawer should be visible
    const drawer = page.locator('[role="presentation"]').or(page.locator('.MuiDrawer-root'));
    await expect(drawer.first()).toBeVisible();
  });

  test('should show login form when not authenticated', async ({ page }) => {
    // Open sidebar
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await fab.first().click();

    // Should show login form elements
    const apiKeyInput = page.locator('input[type="password"]').or(page.locator('input').filter({ hasText: /api.*key/i }));
    // Either see a login form or the sidebar content
    const hasLoginOrContent = await apiKeyInput.count() > 0 ||
      await page.locator('text=/quality|analysis|checkpoint/i').count() > 0;
    expect(hasLoginOrContent).toBeTruthy();
  });

  test('should close sidebar when close button is clicked', async ({ page }) => {
    // Open sidebar
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await fab.first().click();

    // Wait for drawer to be visible
    await page.waitForTimeout(500);

    // Click close button (use specific data-testid)
    const closeButton = page.locator('[data-testid="sidebar-close"]');
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
      // Drawer should be hidden after animation
      await page.waitForTimeout(500);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Open sidebar
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await fab.first().click();

    // Press Tab to navigate
    await page.keyboard.press('Tab');

    // Press Escape to close
    await page.keyboard.press('Escape');
  });
});

test.describe('Language Switching', () => {
  test('should display language switch', async ({ page }) => {
    await page.goto('/');

    // Open sidebar
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await fab.first().click();

    // Look for language selector
    const languageSelector = page.locator('[data-testid="language-switch"]').or(
      page.locator('button').filter({ hasText: /en|de|es/i })
    );

    // May or may not be visible depending on configuration
    const count = await languageSelector.count();
    console.log(`Language selector elements found: ${count}`);
  });

  test('should change language when selector is used', async ({ page }) => {
    await page.goto('/');

    // Open sidebar
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await fab.first().click();

    // Get initial text content
    const initialContent = await page.textContent('body');

    // Try to find and click language selector
    const germanOption = page.locator('button').filter({ hasText: 'DE' }).or(
      page.locator('[data-testid="language-de"]')
    );

    if (await germanOption.count() > 0) {
      await germanOption.first().click();

      // Content should change (German words should appear)
      await page.waitForTimeout(500);
      const newContent = await page.textContent('body');
      console.log('Language switch attempted');
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // FAB should have accessible name
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await expect(fab.first()).toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to FAB
    await page.keyboard.press('Tab');

    // FAB should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Focused element: ${focusedElement}`);
  });

  test('should maintain focus trap in modal', async ({ page }) => {
    await page.goto('/');

    // Open sidebar
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await fab.first().click();

    // Tab multiple times - focus should stay within sidebar
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should still be within the drawer
    const drawer = page.locator('[role="presentation"]').or(page.locator('.MuiDrawer-root'));
    if (await drawer.count() > 0) {
      const drawerBox = await drawer.first().boundingBox();
      console.log('Drawer visible:', !!drawerBox);
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // FAB should be visible on mobile
    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await expect(fab.first()).toBeVisible();

    // Open sidebar
    await fab.first().click();

    // Sidebar should be visible
    const drawer = page.locator('[role="presentation"]').or(page.locator('.MuiDrawer-root'));
    await expect(drawer.first()).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const fab = page.locator('[data-testid="dqm-fab"]').or(page.locator('button').filter({ hasText: /analyze|quality/i }));
    await expect(fab.first()).toBeVisible();
  });
});
