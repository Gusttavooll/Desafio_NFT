// Gera as imagens placeholder das Fixtures (SVG quadrado, determinístico) em public/nfts/.
// Uso: node scripts/generate-nft-images.mjs
// Lê título e token de src/mocks/core/fixtures/nfts.ts; o teste das Fixtures confere que todos os arquivos existem.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const source = readFileSync('src/mocks/core/fixtures/nfts.ts', 'utf8')
const entries = [...source.matchAll(/title: '([^']+)', tokenId: '([^']+)'/g)].map(([, title, tokenId]) => ({ title, tokenId }))

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(text) {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

function svg(name) {
  const rand = mulberry32(hash(name))
  const hue = Math.floor(rand() * 360)
  const shapes = []
  for (let i = 0; i < 7; i++) {
    const h = (hue + i * 28) % 360
    const r = 220 - i * 28
    const cx = 256 + Math.round((rand() - 0.5) * 60)
    const cy = 256 + Math.round((rand() - 0.5) * 60)
    shapes.push(
      i % 2 === 0
        ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="hsl(${h} 70% ${35 + i * 6}%)" opacity="0.9"/>`
        : `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="hsl(${h} 75% ${40 + i * 5}%)" opacity="0.85" transform="rotate(${Math.round(rand() * 90)} ${cx} ${cy})"/>`,
    )
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" fill="hsl(${hue} 30% 14%)"/>${shapes.join('')}</svg>\n`
}

mkdirSync('public/nfts', { recursive: true })
let count = 0
for (const { title, tokenId } of entries) {
  const base = slug(`${title} ${tokenId}`)
  for (const variant of ['a', 'b', 'c']) {
    writeFileSync(`public/nfts/${base}-${variant}.svg`, svg(`${base}-${variant}`))
    count++
  }
}
console.log(`${count} imagens geradas em public/nfts/`)
