import { db, publicUser } from './db.js'
import {
  clearSessionCookie,
  createSession,
  destroySession,
  hashPassword,
  requireAuth,
  setSessionCookie,
  verifyPassword,
} from './auth.js'

export function registerAuthRoutes(app) {
  app.post('/api/auth/register', (req, res) => {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')

    if (!name || !email || password.length < 4) {
      res.status(400).json({ error: 'Navn, e-post og passord (min. 4 tegn) kreves' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      res.status(409).json({ error: 'E-post er allerede i bruk' })
      return
    }

    const id = crypto.randomUUID()
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, 'player', ?)`,
    ).run(id, name, email, hashPassword(password), new Date().toISOString())

    const session = createSession(id)
    setSessionCookie(res, session.id, session.expires)
    const user = publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id))
    res.status(201).json({ user })
  })

  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!row || !verifyPassword(password, row.password_hash)) {
      res.status(401).json({ error: 'Feil e-post eller passord' })
      return
    }
    const session = createSession(row.id)
    setSessionCookie(res, session.id, session.expires)
    res.json({ user: publicUser(row) })
  })

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    destroySession(req.sessionId)
    clearSessionCookie(res)
    res.json({ ok: true })
  })

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.user })
  })
}
