import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LOCALES, messages } from './messages.js'

const STORAGE_KEY = 'kjell-games-locale'
const I18nContext = createContext(null)
const SUPPORTED = new Set(Object.values(LOCALES))

function getInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (SUPPORTED.has(stored)) return stored
  } catch {
    /* ignore */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'nb').toLowerCase()
  if (nav.startsWith('fr')) return LOCALES.fr
  if (nav.startsWith('en')) return LOCALES.en
  return LOCALES.nb
}

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`,
  )
}

function htmlLang(locale) {
  if (locale === LOCALES.en) return 'en'
  if (locale === LOCALES.fr) return 'fr'
  return 'nb'
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale)

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale)
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = useCallback((next) => {
    if (SUPPORTED.has(next)) setLocaleState(next)
  }, [])

  const t = useCallback(
    (key, vars) => {
      const table = messages[locale] ?? messages.nb
      const raw = table[key] ?? messages.nb[key] ?? key
      return interpolate(raw, vars)
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
