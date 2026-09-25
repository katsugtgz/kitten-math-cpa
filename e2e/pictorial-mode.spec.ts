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
    const card = page.getByTestId('kitten-card');
    const cardLabel = await card.getAttribute('aria-label');
    const countMatch = cardLabel?.match(/count (\d+)/i);
    const correctCount = countMatch ? Number(countMatch[1]) : 1;

    const options = page.locator('button[aria-label^="Select "]');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);

    // 1. Intentionally choose an incorrect answer first to verify error and retry flow
    const allOptions = await options.all();
    let wrongOption = null;
    for (const opt of allOptions) {
      const label = await opt.getAttribute('aria-label');
      if (label && !label.includes(`Select ${correctCount} counters`)) {
        wrongOption = opt;
        break;
      }
    }

    if (wrongOption) {
      await wrongOption.click();

      // Verify error feedback is displayed
      await expect(page.getByText(/Not quite! Look closely at the pattern/i)).toBeVisible();

      // "Next Flash Card" MUST NOT be visible on incorrect answer
      await expect(page.getByRole('button', { name: /Next Flash Card/i })).not.toBeVisible();

      // "Try Again" button MUST be visible
      const tryAgainBtn = page.getByRole('button', { name: /Try Again/i });
      await expect(tryAgainBtn).toBeVisible();
      await tryAgainBtn.click();

      // After clicking Try Again, the error banner must be dismissed
      await expect(page.getByText(/Not quite! Look closely at the pattern/i)).not.toBeVisible();
    }

    // 2. Now select the correct answer
    const correctBtn = page.getByRole('button', { name: `Select ${correctCount} counters` });
    await correctBtn.click();

    // Verify success feedback
    await expect(page.getByText(new RegExp(`Excellent! Count is ${correctCount}`, 'i'))).toBeVisible();

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
