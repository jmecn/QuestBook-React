import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from '@/app/router'
import { ensureI18nReady } from '@/shared/i18n/i18n'
import { normalizeSitePath } from '@/shared/lib/site-base'
import { registerQuestExportServiceWorker } from '@/shared/lib/register-quest-export-sw'
import { initThemeFromStorage } from '@/shared/lib/theme'
import '@/index.css'

normalizeSitePath()
initThemeFromStorage()
registerQuestExportServiceWorker()

void ensureI18nReady().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={appRouter} />
    </React.StrictMode>,
  )
})
