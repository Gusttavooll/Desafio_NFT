const status = document.querySelector('#status')
const pay = document.querySelector('#pay')
async function api(path, options) {
  const response = await fetch(path, options)
  if (!response.ok) throw new Error('Não foi possível verificar agora. Tente novamente.')
  return response.json()
}
async function refresh() {
  try {
    const order = await api('/sandbox/status')
    const labels = { pending: 'Pagamento pendente. O retorno à página não confirma a compra.', confirmed: 'Pagamento de teste confirmado pelo Stripe.', rejected: 'Pagamento recusado ou sessão expirada.' }
    status.textContent = labels[order.status]
    pay.disabled = order.status !== 'pending'
    document.querySelector('#receipt').textContent = order.receipt ? JSON.stringify(order.receipt, null, 2) : ''
  } catch (error) { status.textContent = error.message }
}
pay.addEventListener('click', async () => {
  pay.disabled = true
  try {
    status.textContent = 'Abrindo checkout de teste…'
    const order = await api('/sandbox/start', { method: 'POST' })
    const session = await api('/payments/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) })
    const url = new URL(session.url)
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Endereço de pagamento inválido.')
    window.location.assign(url.href)
  } catch (error) { status.textContent = error.message; pay.disabled = false }
})
document.querySelector('#refresh').addEventListener('click', refresh)
if (window.location.pathname === '/checkout/confirmation') refresh()
