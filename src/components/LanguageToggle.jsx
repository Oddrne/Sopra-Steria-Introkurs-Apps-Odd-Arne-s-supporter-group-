import { LOCALES, LOCALE_LABELS } from '../i18n/messages.js'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="lang-toggle" role="group" aria-label={t('lang.label')}>
      <button
        type="button"
        className={`lang-btn ${locale === LOCALES.nb ? 'is-active' : ''}`}
        onClick={() => setLocale(LOCALES.nb)}
        aria-pressed={locale === LOCALES.nb}
      >
        {LOCALE_LABELS.nb}
      </button>
      <button
        type="button"
        className={`lang-btn ${locale === LOCALES.en ? 'is-active' : ''}`}
        onClick={() => setLocale(LOCALES.en)}
        aria-pressed={locale === LOCALES.en}
      >
        {LOCALE_LABELS.en}
      </button>
    </div>
  )
}
