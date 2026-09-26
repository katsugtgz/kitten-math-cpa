import { test, expect } from '@playwright/test';

test.describe('PWA & Offline Readiness', () => {
  test('should serve a valid Web App Manifest', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('Kitten Math: CPA Ten-Frame Adventure');
    expect(manifest.short_name).toBe('KittenMath');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const has192 = manifest.icons.some((icon: { sizes: string }) => icon.sizes === '192x192');
    const has512 = manifest.icons.some((icon: { sizes: string }) => icon.sizes === '512x512');
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });

  test('should link to manifest, favicon, and apple-touch-icon in HTML head', async ({ page }) => {
    await page.goto('/');

    const manifestLink = page.locator('link[rel="manifest"]').first();
    await expect(manifestLink).toHaveAttribute('href', /manifest\.webmanifest$/);

    const iconLink = page.locator('link[rel="icon"]');
    await expect(iconLink).toHaveAttribute('href', /favicon\.ico$/);

    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveAttribute('href', /apple-touch-icon\.png$/);
  });

  test('should serve service worker script (sw.js)', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text.length).toBeGreaterThan(50);
  });

  test('should register service worker and activate cache in browser', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    // Wait for service worker to register and become active
    await page.waitForFunction(
      async () => {
        if (!('serviceWorker' in navigator)) return false;
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          return Boolean(reg);
        } catch {
          return false;
        }
      },
      { timeout: 15000 }
    );

    const swRegistered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return Boolean(registration.active);
    });

    expect(swRegistered).toBe(true);
  });

  test('should display Install Banner upon beforeinstallprompt event and allow dismissal', async ({ page }) => {
    await page.goto('/');

    // Banner is initially hidden (no beforeinstallprompt fired yet)
    await expect(page.getByTestId('pwa-install-banner')).not.toBeVisible();

    // Dispatch simulated beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      Object.assign(event, {
        platforms: ['web'],
        userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
        prompt: () => Promise.resolve(),
      });
      window.dispatchEvent(event);
    });

    // Install banner should now be visible
    const banner = page.getByTestId('pwa-install-banner');
    await expect(banner).toBeVisible();
    await expect(page.getByRole('button', { name: 'Install App' })).toBeVisible();

    // Dismiss the banner
    await page.getByRole('button', { name: 'Dismiss Install Banner' }).click();
    await expect(banner).not.toBeVisible();
  });
});
