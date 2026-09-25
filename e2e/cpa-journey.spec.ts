import { test, expect } from '@playwright/test';

test.describe('End-to-End CPA Learning Journey', () => {
  test('should seamlessly transition through Concrete -> Pictorial -> Abstract with score continuity', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Audio Mute Toggle
    const muteBtn = page.getByRole('button', { name: /Mute audio|Unmute audio/i });
    await expect(muteBtn).toBeVisible();
    await muteBtn.click();
    await muteBtn.click();

    // 2. Concrete Mode Manipulatives
    await expect(page.getByTestId('concrete-mode-view')).toBeVisible();
    await page.getByRole('button', { name: 'Fill 5' }).click();
    await expect(page.getByText('5 counters placed so far!')).toBeVisible();

    // 3. Switch to Pictorial Mode
    await page.getByRole('tab', { name: /Pictorial/i }).click();
    await expect(page.getByTestId('pictorial-mode-view')).toBeVisible();

    // Answer a pictorial question
    const options = page.locator('button[aria-label^="Select "]');
    const optionCount = await options.count();
    for (let i = 0; i < optionCount; i++) {
      await options.nth(i).click();
      const isNextVisible = await page.getByRole('button', { name: /Next Flash Card/i }).isVisible();
      if (isNextVisible) {
        break;
      }
      await page.getByRole('button', { name: /Try Again/i }).click();
    }
    await expect(page.getByRole('button', { name: /Next Flash Card/i })).toBeVisible();
    await page.getByRole('button', { name: /Next Flash Card/i }).click();

    // Streak should be at least 1
    const streakDisplay = page.getByText(/Streak/i).first();
    await expect(streakDisplay).toBeVisible();

    // 4. Switch to Abstract Mode
    await page.getByRole('tab', { name: /Abstract/i }).click();
    await expect(page.getByTestId('abstract-mode-view')).toBeVisible();

    // Number bond tree is displayed
    const numberBondTree = page.getByTestId('number-bond-tree');
    await expect(numberBondTree).toBeVisible();

    // Solve the number bond problem
    const wholeEl = page.locator('[aria-label^="Whole circle:"]');
    const partAEl = page.locator('[aria-label^="Part A circle:"]');
    const partBEl = page.locator('[aria-label^="Part B circle:"]');

    const wholeVal = (await wholeEl.getAttribute('aria-label'))?.replace('Whole circle:', '').trim();
    const partAVal = (await partAEl.getAttribute('aria-label'))?.replace('Part A circle:', '').trim();
    const partBVal = (await partBEl.getAttribute('aria-label'))?.replace('Part B circle:', '').trim();

    let ans = 0;
    if (wholeVal === '?') {
      ans = Number(partAVal) + Number(partBVal);
    } else if (partAVal === '?') {
      ans = Number(wholeVal) - Number(partBVal);
    } else {
      ans = Number(wholeVal) - Number(partAVal);
    }

    for (const char of String(ans)) {
      await page.getByRole('button', { name: `Digit ${char}` }).click();
    }
    await page.getByRole('button', { name: 'Submit Answer' }).click();

    // Success feedback
    await expect(page.getByText('Bravo! Correct equation!')).toBeVisible();

    // 5. Verify footer
    await expect(
      page.getByText(/Singapore Concrete-Pictorial-Abstract \(CPA\) Early Mathematics PWA/i)
    ).toBeVisible();
  });
});
