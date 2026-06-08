import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import { useTheme } from '@/shared/hooks/useTheme'
import {
  localeDisplayName,
  useLanguageConfig,
  visibleLocales,
} from '@/shared/hooks/useLanguageConfig'
import { siteUrl } from '@/shared/lib/site-base'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}

export function SiteHeader() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { locale, setLocale, t } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const langConfigQuery = useLanguageConfig()
  const locales = visibleLocales(langConfigQuery.data)

  const goHome = () => {
    const first = params.get('chapter')
    navigate(first ? `/?lang=${locale}&chapter=${first}` : `/?lang=${locale}`)
  }

  return (
    <header className="site-header">
      <div className="site-header-inner site-header-inner--no-search">
        <button type="button" className="site-brand" onClick={goHome} title={t('brandTitle')}>
          <img
            className="site-brand-icon"
            src={siteUrl('favicon-32.png')}
            width={28}
            height={28}
            alt=""
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <span className="site-name">{t('appTitle')}</span>
        </button>

        <div className="site-header-actions">
          <label className="header-control header-control--locale">
            <span className="header-control-label">{t('labelLang')}</span>
            <select
              className="header-select"
              aria-label="Language"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              {locales.map((code) => (
                <option value={code} key={code}>
                  {localeDisplayName(langConfigQuery.data, code)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="header-icon-button"
            aria-label={t('labelTheme')}
            onClick={toggleTheme}
          >
            <span className="header-icon" data-theme-icon="light" hidden={theme !== 'light'}>
              <SunIcon />
            </span>
            <span className="header-icon" data-theme-icon="dark" hidden={theme !== 'dark'}>
              <MoonIcon />
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
