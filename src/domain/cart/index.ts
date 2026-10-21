// API pública: Carrinho e Cotação. Outros contextos importam só daqui.
export { addItem, setQuantity, removeItem, countItems, mergeCarts } from './cart'
export type { Cart, CartItem, CartAdjustment, EditionLimit } from './cart'
