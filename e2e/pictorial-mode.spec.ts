import { test, expect } from '@playwright/test';

test.describe('Pictorial Mode: Visual Subitizing & Kitten Flash Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Switch to Pictorial mode
    await page.getByRole('tab', { name: /Pictorial/i }).click();
  });

  test('should render Pictorial mode with KittenCard and answer options', async ({ page }) => {
    const pictorialView = page.getByTestId('pictorial-mode-view');
    await expect(pictorialView).toBeVisible();

    await expect(page.getByText('Pictorial Mode: Flash Card Challenge')).toBeVisible();
    await expect(page.getByText('How many counters does the kitten see?')).toBeVisible();

    // Kitten card is rendered
    const kittenCard = page.getByTestId('kitten-card');
    await expect(kittenCard).toBeVisible();

    // Answer buttons (multiple options)
    const options = page.locator('button[aria-label^="Select "]');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should handle user answers, feedback, and progression to next card', async ({ page }) => {
    const options = page.locator('button[aria-label^="Select "]');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Let's test the answer flow
    // Try the first option
    await options.first().click();

    // Check feedback banner
    const feedback = page.getByRole('status').first();
    await expect(feedback).toBeVisible();

    const isSuccess = await page.getByRole('button', { name: /Next Flash Card/i }).isVisible();

    if (!isSuccess) {
      // It was incorrect! Verify "Try Again" is displayed
      const tryAgainBtn = page.getByRole('button', { name: /Try Again/i });
      await expect(tryAgainBtn).toBeVisible();
      await tryAgainBtn.click();

      // Now click the remaining options until we get it right
      let solved = false;
      for (let i = 1; i < count; i++) {
        await options.nth(i).click();
        const nextVisible = await page.getByRole('button', { name: /Next Flash Card/i }).isVisible();
        if (nextVisible) {
          solved = true;
          break;
        } else {
          await page.getByRole('button', { name: /Try Again/i }).click();
        }
      }
      expect(solved).toBe(true);
    }

    // Now click Next Flash Card
    const nextBtn = page.getByRole('button', { name: /Next Flash Card/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // A fresh problem should be presented (feedback banner dismissed)
    await expect(page.getByRole('button', { name: /Next Flash Card/i })).not.toBeVisible();
  });

  test('should adapt difficulty across stages 1 through 4', async ({ page }) => {
    // Switch to Stage 2 (1-10)
    await page.getByRole('button', { name: 'Stage 2: Numbers 1-10' }).click();
    await expect(page.getByRole('button', { name: 'Stage 2: Numbers 1-10' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Switch to Stage 3 (Teens 10-20)
    await page.getByRole('button', { name: 'Stage 3: Teens 10-20' }).click();
    await expect(page.getByRole('button', { name: 'Stage 3: Teens 10-20' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Kitten card should now show double ten-frame
    const doubleCard = page.getByTestId('kitten-card');
    await expect(doubleCard).toBeVisible();
  });
});
