import { expect, test, type Page } from '@playwright/test'

async function emit(page: Page, price: string, available: number, version?: number) {
  await page.evaluate(input => (window as unknown as { __mocks: { emit: (input: unknown) => void } }).__mocks.emit(input), {
    resource: 'nft', resourceId: 'emerald-ape-042', payload: { price, editions: [{ id: 'emerald-ape-042:1-1', available }] }, ...(version === undefined ? {} : { version }),
  })
}

test('tempo real atualiza preço/estoque, ignora antigo e reconcilia após queda', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-042')
  await expect(page.locator('.detail-price .price-tag')).toContainText('1.850')
  await expect(page.getByText('Atualizações ao vivo conectadas.', { exact: true })).toBeAttached()
  await emit(page, '2.345', 0)
  await expect(page.locator('.detail-price .price-tag')).toContainText('2.345')
  await emit(page, '0.100', 1, 1)
  await expect(page.locator('.detail-price .price-tag')).toContainText('2.345')
  await page.evaluate(() => (window as unknown as { __mocks: { disconnect: () => void } }).__mocks.disconnect())
  await expect(page.getByText('Atualizações ao vivo desconectadas. Reconectando…')).toBeVisible()
  await emit(page, '3.456', 0)
  await expect(page.locator('.detail-price .price-tag')).toContainText('2.345')
  await page.evaluate(() => (window as unknown as { __mocks: { reconnect: () => void } }).__mocks.reconnect())
  await expect(page.locator('.detail-price .price-tag')).toContainText('3.456')
  await page.reload()
  await expect(page.locator('.detail-price .price-tag')).toContainText('3.456')
})

test('estoque em tempo real ajusta o limite da edição sem perder o foco', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-042')
  await expect(page.getByText('Atualizações ao vivo conectadas.', { exact: true })).toBeAttached()
  const choice = page.getByRole('radio').first()
  await choice.focus()
  const editionId = await choice.getAttribute('value')
  await page.evaluate(id => (window as unknown as { __mocks: { emit: (input: unknown) => void } }).__mocks.emit({ resource: 'nft', resourceId: 'emerald-ape-042', payload: { price: '1.850', editions: [{ id, available: 0 }] } }), editionId)
  await expect(choice).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true })).toBeDisabled()
  await expect(page.getByText('Esta edição está esgotada. Escolha outra edição disponível.')).toBeVisible()
})
