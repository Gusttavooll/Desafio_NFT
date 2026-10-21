import { DatabaseSync } from 'node:sqlite'
import { randomBytes, randomUUID, createHash } from 'node:crypto'

const hash = token => createHash('sha256').update(token).digest('hex')

// Local sandbox only: each server-issued session owns a separate R$10 fixture.
// This ledger does not mint NFTs or alter marketplace inventory.
export function createRepository(path) {
  const db = new DatabaseSync(path)
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, collectorId TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, collectorId TEXT NOT NULL, revision INTEGER NOT NULL,
      amountMinor INTEGER NOT NULL, currency TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL,
      stripeSessionId TEXT UNIQUE, checkoutUrl TEXT);
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS receipts (orderId TEXT PRIMARY KEY, snapshot TEXT NOT NULL);`)
  const owned = db.prepare('SELECT * FROM orders WHERE id=? AND collectorId=?')
  const transaction = fn => {
    db.exec('BEGIN IMMEDIATE')
    try { const result = fn(); db.exec('COMMIT'); return result }
    catch (error) { db.exec('ROLLBACK'); throw error }
  }
  return {
    close: () => db.close(),
    createDemoSession: () => transaction(() => {
      const token = randomBytes(32).toString('hex')
      const collectorId = randomUUID()
      const id = randomUUID()
      db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(hash(token), collectorId, Date.now() + 86400000)
      db.prepare('INSERT INTO orders VALUES (?, ?, 1, 1000, ?, ?, ?, NULL, NULL)').run(id, collectorId, 'brl', 'KRONOS — pedido demonstrativo (sem NFT real)', 'pending')
      return { token, order: owned.get(id, collectorId) }
    }),
    authenticate: token => {
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
      const session = db.prepare('SELECT collectorId FROM sessions WHERE hash=? AND expires>?').get(hash(token), Date.now())
      return session ? { id: session.collectorId } : null
    },
    getOwnedOrder: (id, collectorId) => owned.get(id, collectorId) || null,
    getDemoOrder: collectorId => db.prepare('SELECT * FROM orders WHERE collectorId=? ORDER BY rowid DESC LIMIT 1').get(collectorId),
    prepareCheckout: (id, collectorId) => {
      const order = owned.get(id, collectorId)
      if (!order || order.status !== 'pending') throw new Error('Order unavailable')
      return order
    },
    saveCheckout: (id, revision, session) => transaction(() => {
      const order = db.prepare('SELECT * FROM orders WHERE id=? AND revision=?').get(id, revision)
      if (!order || (order.stripeSessionId && order.stripeSessionId !== session.id)) throw new Error('Session conflict')
      if (order.stripeSessionId === session.id) return
      if (order.status !== 'pending') throw new Error('Order unavailable')
      db.prepare('UPDATE orders SET stripeSessionId=?, checkoutUrl=? WHERE id=? AND revision=?').run(session.id, session.url, id, revision)
    }),
    applyEvent: (event, decide) => transaction(() => {
      if (db.prepare('SELECT 1 FROM events WHERE id=?').get(event.id)) return
      const order = db.prepare('SELECT * FROM orders WHERE stripeSessionId=?').get(event.data.object.id)
      if (!order) throw new Error('Session not persisted yet')
      const status = decide(order)
      if (status) {
        if (!['confirmed', 'rejected'].includes(status)) throw new Error('Invalid status')
        const updated = db.prepare("UPDATE orders SET status=? WHERE id=? AND status='pending'").run(status, order.id)
        if (status === 'confirmed' && updated.changes === 1) {
          const receipt = { orderId: order.id, amountMinor: order.amountMinor, currency: order.currency, stripeSessionId: order.stripeSessionId, confirmedAt: new Date().toISOString(), sandbox: true }
          db.prepare('INSERT INTO receipts VALUES (?, ?)').run(order.id, JSON.stringify(receipt))
        }
      }
      db.prepare('INSERT INTO events VALUES (?)').run(event.id)
    }),
    getReceipt: (id, collectorId) => {
      if (!owned.get(id, collectorId)) return null
      const row = db.prepare('SELECT snapshot FROM receipts WHERE orderId=?').get(id)
      return row ? JSON.parse(row.snapshot) : null
    },
  }
}
