import { LOCALES, LOCALE_LABELS } from '../i18n/messages.js'
import { useI18n } from '../i18n/I18nContext.jsx'

const ORDER = [LOCALES.nb, LOCALES.en, LOCALES.fr]

export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="lang-toggle" role="group" aria-label={t('lang.label')}>
      {ORDER.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-btn ${locale === code ? 'is-active' : ''}`}
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  )
}
