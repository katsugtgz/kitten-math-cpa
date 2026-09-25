import { test, expect } from '@playwright/test';

test.describe('Abstract Mode: Number Bonds & Equations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Switch to Abstract mode
    await page.getByRole('tab', { name: /Abstract/i }).click();
  });

  test('should render Abstract mode with Number Bond tree and Virtual Keypad', async ({ page }) => {
    const abstractView = page.getByTestId('abstract-mode-view');
    await expect(abstractView).toBeVisible();

    await expect(page.getByText('Abstract Mode: Symbolic Equations')).toBeVisible();

    // Virtual keypad is present
    const keypad = page.getByTestId('virtual-keypad');
    await expect(keypad).toBeVisible();

    // Digit buttons 0-9
    for (let d = 0; d <= 9; d++) {
      await expect(page.getByRole('button', { name: `Digit ${d}` })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Delete last digit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit Answer' })).toBeVisible();
  });

  test('should type and delete digits using the Virtual Keypad', async ({ page }) => {
    // Type 4 then 2
    await page.getByRole('button', { name: 'Digit 4' }).click();
    await page.getByRole('button', { name: 'Digit 2' }).click();

    // The number bond tree should contain 42 in the missing circle
    const tree = page.getByTestId('number-bond-tree');
    await expect(tree).toContainText('42');

    // Press Delete
    await page.getByRole('button', { name: /Delete last digit/i }).click();
    await expect(tree).toContainText('4');
  });

  test('should solve number bond by calculating missing value and submitting', async ({ page }) => {
    // Ensure in Stage 1 for number bonds
    await page.getByRole('button', { name: 'Stage 1: Numbers 1-5' }).click();

    // Read the tree
    const wholeEl = page.locator('[aria-label^="Whole circle:"]');
    const partAEl = page.locator('[aria-label^="Part A circle:"]');
    const partBEl = page.locator('[aria-label^="Part B circle:"]');

    const wholeText = (await wholeEl.getAttribute('aria-label'))?.replace('Whole circle:', '').trim();
    const partAText = (await partAEl.getAttribute('aria-label'))?.replace('Part A circle:', '').trim();
    const partBText = (await partBEl.getAttribute('aria-label'))?.replace('Part B circle:', '').trim();

    let answer = 0;
    if (wholeText === '?') {
      answer = Number(partAText) + Number(partBText);
    } else if (partAText === '?') {
      answer = Number(wholeText) - Number(partBText);
    } else {
      answer = Number(wholeText) - Number(partAText);
    }

    // Type the answer using keypad
    const digits = String(answer).split('');
    for (const d of digits) {
      await page.getByRole('button', { name: `Digit ${d}` }).click();
    }

    // Click Submit
    await page.getByRole('button', { name: 'Submit Answer' }).click();

    // Verify positive feedback
    await expect(page.getByText('Bravo! Correct equation!')).toBeVisible();

    // Next problem button appears
    const nextBtn = page.getByRole('button', { name: /Next Problem/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Input reset for next problem
    await expect(page.getByRole('button', { name: /Next Problem/i })).not.toBeVisible();
  });

  test('should handle incorrect answers gracefully with retry option', async ({ page }) => {
    // Intentionally enter wrong answer 99
    await page.getByRole('button', { name: 'Digit 9' }).click();
    await page.getByRole('button', { name: 'Digit 9' }).click();
    await page.getByRole('button', { name: 'Submit Answer' }).click();

    // Should show error message
    await expect(page.getByText('Try reviewing the parts of the number.')).toBeVisible();
    const retryBtn = page.getByRole('button', { name: /Try Again/i });
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();
  });

  test('should support keyboard typing and solve equations in Stage 4', async ({ page }) => {
    // Switch to Stage 4 (Equations)
    await page.getByRole('button', { name: 'Stage 4: Mastery 1-20' }).click();

    const eqRegion = page.getByTestId('equation-display');
    await expect(eqRegion).toBeVisible();

    // Read equation values
    const op1El = page.locator('[aria-label*="first operand"]');
    const op2El = page.locator('[aria-label*="second operand"]');
    const resEl = page.locator('[aria-label*="result"]');

    const op1Text = (await op1El.getAttribute('aria-label'))?.split(':')[1].trim() ?? '';
    const op2Text = (await op2El.getAttribute('aria-label'))?.split(':')[1].trim() ?? '';
    const resText = (await resEl.getAttribute('aria-label'))?.split(':')[1].trim() ?? '';

    const eqText = await eqRegion.innerText();
    const isSubtraction = eqText.includes('−') || eqText.includes('-');

    let answer = 0;
    if (isSubtraction) {
      if (op1Text === '?') {
        answer = Number(resText) + Number(op2Text);
      } else if (op2Text === '?') {
        answer = Number(op1Text) - Number(resText);
      } else {
        answer = Number(op1Text) - Number(op2Text);
      }
    } else {
      if (op1Text === '?') {
        answer = Number(resText) - Number(op2Text);
      } else if (op2Text === '?') {
        answer = Number(resText) - Number(op1Text);
      } else {
        answer = Number(op1Text) + Number(op2Text);
      }
    }

    // Type answer using keyboard
    await page.keyboard.type(String(answer));
    await page.keyboard.press('Enter');

    // Should be correct
    await expect(page.getByText('Bravo! Correct equation!')).toBeVisible();
  });
});
