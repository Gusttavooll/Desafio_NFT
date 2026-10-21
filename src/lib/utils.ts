import { createCn } from 'cn/config'

// Reconhece os tokens usados pelo tema para que className possa substituir defaults.
export const cn = createCn({
  extend: {
    theme: {
      spacing: ['touch', 'button', 'gutter'],
      radius: ['inner', 'outer'],
    },
  },
})
