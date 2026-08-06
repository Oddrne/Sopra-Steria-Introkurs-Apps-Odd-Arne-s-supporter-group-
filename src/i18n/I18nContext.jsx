import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LOCALES, messages } from './messages.js'

const STORAGE_KEY = 'kjell-games-locale'
const I18nContext = createContext(null)

function getInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === LOCALES.nb || stored === LOCALES.en) return stored
  } catch {
    /* ignore */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'nb'
  return nav.toLowerCase().startsWith('en') ? LOCALES.en : LOCALES.nb
}

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`,
  )
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale === LOCALES.en ? 'en' : 'nb'
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = useCallback((next) => {
    if (next === LOCALES.nb || next === LOCALES.en) setLocaleState(next)
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
