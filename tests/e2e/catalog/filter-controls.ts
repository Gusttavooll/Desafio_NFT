import { expect, type Page } from '@playwright/test'

export async function openFilters(page: Page) {
  await expect(page.getByRole('searchbox', { name: 'Buscar obras' })).toBeVisible()
  if ((page.viewportSize()?.width ?? 1440) <= 640) {
    await page.getByRole('button', { name: 'Abrir filtros', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Filtros do acervo' })).toBeVisible()
  }
}
export async function closeFilters(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) <= 640) {
    await page.getByRole('button', { name: 'Ver resultados', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Filtros do acervo' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Abrir filtros', exact: true })).toBeFocused()
  }
}
