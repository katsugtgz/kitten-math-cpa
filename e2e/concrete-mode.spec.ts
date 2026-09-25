import { test, expect } from '@playwright/test';

test.describe('Concrete Mode: Physical Manipulatives & Ten-Frames', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render Concrete mode as the default CPA stage with all manipulatves', async ({ page }) => {
    // Mode indicator in StageSelector
    const concreteTab = page.getByRole('tab', { name: /Concrete/i });
    await expect(concreteTab).toHaveAttribute('aria-selected', 'true');

    // Concrete mode view container
    const concreteView = page.getByTestId('concrete-mode-view');
    await expect(concreteView).toBeVisible();

    // Kitten mascot peeking in concrete mode
    const mascot = concreteView.getByTestId('kitten-mascot');
    await expect(mascot).toBeVisible();

    // Ten-frame grid
    const tenFrameRegion = page.getByRole('region', { name: /Interactive Ten-Frame Grid/i });
    await expect(tenFrameRegion).toBeVisible();

    // Origami Paper Tray
    const paperTray = page.getByRole('region', { name: /Origami Paper Tray Bank/i });
    await expect(paperTray).toBeVisible();

    // Initial tally
    await expect(page.getByText('Total:')).toBeVisible();
  });

  test('should place and remove counters via grid slot clicks', async ({ page }) => {
    const slot1 = page.getByRole('button', { name: 'Slot 1: empty' });
    await expect(slot1).toBeVisible();

    // Click to place red counter (default selected color)
    await slot1.click();
    await expect(page.getByRole('button', { name: 'Slot 1: red' })).toBeVisible();

    // Verify counter chip is rendered inside slot 1
    const counterInSlot = page
      .getByRole('button', { name: 'Slot 1: red' })
      .getByRole('img', { name: /red tactile counter chip/i });
    await expect(counterInSlot).toBeVisible();

    // Click again to remove the counter
    await page.getByRole('button', { name: 'Slot 1: red' }).click();
    await expect(page.getByRole('button', { name: 'Slot 1: empty' })).toBeVisible();
  });

  test('should switch colors and add counters from Paper Tray', async ({ page }) => {
    // Select and add black counter via Paper Tray
    const addBlackBtn = page.getByRole('button', { name: 'Select and Add Black Counter' });
    await addBlackBtn.click();

    // First slot should now be black
    await expect(page.getByRole('button', { name: 'Slot 1: black' })).toBeVisible();

    // Select and add red counter
    const addRedBtn = page.getByRole('button', { name: 'Select and Add Red Counter' });
    await addRedBtn.click();

    // Second slot should now be red
    await expect(page.getByRole('button', { name: 'Slot 2: red' })).toBeVisible();
  });

  test('should support helper actions: Fill 5, Fill 10, and Clear All', async ({ page }) => {
    // Click Fill 5
    const fill5Btn = page.getByRole('button', { name: 'Fill 5' });
    await fill5Btn.click();

    // First 5 slots should be filled
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByRole('button', { name: new RegExp(`Slot ${i}: (red|black)`) })).toBeVisible();
    }

    // Click Fill 10
    const fill10Btn = page.getByRole('button', { name: 'Fill 10' });
    await fill10Btn.click();

    // All 10 slots filled
    for (let i = 1; i <= 10; i++) {
      await expect(page.getByRole('button', { name: new RegExp(`Slot ${i}: (red|black)`) })).toBeVisible();
    }

    // Click Clear All
    const clearBtn = page.getByRole('button', { name: 'Clear All' });
    await clearBtn.click();

    // Slot 1 should be empty again
    await expect(page.getByRole('button', { name: 'Slot 1: empty' })).toBeVisible();
  });

  test('should toggle capacity between single (10) and double (20) ten-frames', async ({ page }) => {
    const toggleBtn = page.getByRole('button', { name: /Switch to Double \(20\)/i });
    await toggleBtn.click();

    // Should now show Frame 1 and Frame 2
    await expect(page.getByText('Frame 1 (1-10)')).toBeVisible();
    await expect(page.getByText('Frame 2 (11-20)')).toBeVisible();
    await expect(page.getByText('Capacity: 20')).toBeVisible();

    // Button should now offer to switch back to Single (10)
    const switchBackBtn = page.getByRole('button', { name: /Switch to Single \(10\)/i });
    await expect(switchBackBtn).toBeVisible();
    await switchBackBtn.click();

    // Should revert back to 10
    await expect(page.getByText('Capacity: 10')).toBeVisible();
  });

  test('should update Number Track Strip dynamically', async ({ page }) => {
    const numberTrack = page.getByRole('group', { name: 'Number Track Strip' });
    await expect(numberTrack).toBeVisible();

    // Fill 5
    await page.getByRole('button', { name: 'Fill 5' }).click();

    // Number 5 on track should be highlighted as current
    const trackItem5 = numberTrack.getByText('5', { exact: true });
    await expect(trackItem5).toBeVisible();
  });
});
