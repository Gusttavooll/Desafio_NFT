import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/components/fixture.html')
})

test('campo de senha mantém alvo de toque, atributos e ação acessível', async ({ page }) => {
  const input = page.getByLabel('Senha', { exact: true })
  const toggle = page.getByRole('button', { name: 'Mostrar senha', exact: true })
  await expect(input).toHaveAttribute('type', 'password')
  await expect(input).toHaveAttribute('autocomplete', 'current-password')
  await expect(input).toHaveAttribute('spellcheck', 'false')
  await expect(toggle).toHaveCSS('height', '44px')
  await expect(toggle).toHaveCSS('width', '44px')
  await expect(toggle).not.toHaveAttribute('aria-pressed')
  await toggle.click()
  await expect(input).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click()
  await expect(input).toHaveAttribute('type', 'password')
})

test('tokens, contraste e grade sobrevivem à integração com o layout', async ({ page }) => {
  await expect(page.getByTestId('override')).toHaveCSS('border-radius', '0px')
  await expect(page.getByTestId('override')).toHaveCSS('min-height', '0px')
  await expect(page.locator('body')).not.toHaveCSS('background-image', 'none')
  await expect(page.getByText('Principal', { exact: true })).toHaveCSS('color', 'rgb(22, 29, 27)')
  const columns = await page.getByRole('radiogroup').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)
  expect(columns).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('diálogo devolve o foco ao gatilho depois de fechar pelo teclado', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Abrir detalhes', exact: true })
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(trigger).toBeFocused()
})
