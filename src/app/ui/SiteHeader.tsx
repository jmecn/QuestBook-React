import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuestSearch } from '@/features/search/QuestSearchContext'
import { useI18n } from '@/shared/i18n/useI18n'
import { useTheme } from '@/shared/hooks/useTheme'
import {
  localeDisplayName,
  useLanguageConfig,
  visibleLocales,
} from '@/shared/hooks/useLanguageConfig'
import { siteUrl } from '@/shared/lib/site-base'
import { useBuildInfo } from '@/shared/hooks/useBuildInfo'
import { formatModpackVersion } from '@/shared/lib/build-info'

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

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

function LocaleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
    </svg>
  )
}

const WIKI_URL = 'https://wiki.terrafirmagreg.team/'
const DISCORD_URL = 'https://discord.com/invite/AEaCzCTUwQ'

export function SiteHeader() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { openSearch } = useQuestSearch()
  const { locale, setLocale, t } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const langConfigQuery = useLanguageConfig()
  const buildInfoQuery = useBuildInfo()
  const modpackVersion = formatModpackVersion(buildInfoQuery.data?.modpack)
  const locales = visibleLocales(langConfigQuery.data)

  const goHome = () => {
    const first = params.get('chapter')
    navigate(first ? `/?lang=${locale}&chapter=${first}` : `/?lang=${locale}`)
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
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
          {modpackVersion ? (
            <span className="site-modpack-version">{modpackVersion}</span>
          ) : null}
        </button>

        <div className="site-search">
          <button
            type="button"
            className="site-search-field site-search-trigger"
            onClick={() => openSearch()}
            aria-label={t('searchPlaceholder')}
          >
            <span className="site-search-icon">
              <SearchIcon />
            </span>
            <span className="site-search-trigger-label">{t('searchPlaceholder')}</span>
          </button>
        </div>

        <div className="site-header-actions">
          <nav className="header-nav-links" aria-label={t('navLinksAria')}>
            <a
              className="header-nav-link"
              href={WIKI_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('navWikiAria')}
            >
              {t('navWiki')}
            </a>
            <a
              className="header-nav-link"
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('navDiscordAria')}
            >
              {t('navDiscord')}
            </a>
          </nav>

          <label
            className="header-control header-control--locale"
            title={localeDisplayName(langConfigQuery.data, locale)}
          >
            <span className="header-locale-icon" aria-hidden="true">
              <LocaleIcon />
            </span>
            <span className="header-control-label">{t('labelLang')}</span>
            <select
              className="header-select header-select--locale"
              aria-label={t('labelLang')}
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
