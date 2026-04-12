import { test, expect } from '@playwright/test';

test.describe('admin artifacts page', () => {
  test('renders required provenance fields', async ({ page }) => {
    await page.goto('/admin/artifacts');

    await expect(page.getByRole('heading', { name: 'Admin Artifacts' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Source URL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Accession' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Fetch timestamp' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Checksum' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Parser version' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Job id' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });
});
