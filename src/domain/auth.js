/** SHA-256 hex — hobby-nivå (klient-side). Ikke erstatning for ekte server-auth. */

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password, passwordHash) {
  const hashed = await hashPassword(password)
  return hashed === passwordHash
}

/** Precomputed SHA-256("demo") for seed-brukere */
export const DEMO_PASSWORD_HASH =
  '2a97516c354b68848cdbd8f54a226a0a55b21ed138e207ad6c5cbb9c00aa5aea'
