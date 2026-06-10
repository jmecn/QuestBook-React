import { createBrowserRouter } from 'react-router-dom'
import { routerBasename } from '@/shared/lib/site-base'
import { AppLayout } from '@/app/ui/AppLayout'
import { ChapterPage } from '@/features/chapter/ChapterPage'
import { SearchLegacyRedirect } from '@/features/search/SearchLegacyRedirect'

export const appRouter = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <ChapterPage /> },
        { path: 'search', element: <SearchLegacyRedirect /> },
      ],
    },
  ],
  { basename: routerBasename() },
)
