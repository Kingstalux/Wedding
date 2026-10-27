import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { ConfirmProvider } from './components/Confirm'
import { ToastProvider } from './components/Toast'
import { LanguageProvider } from './i18n/LanguageProvider'
import { router } from './router'
import './styles/tokens.css'
import './styles/base.css'

/*
 * React Query keeps a cache of data loaded from Supabase. Components ask for
 * data with useQuery(); after a change (useMutation) the cache is updated so
 * every component showing that data re-renders.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // one quick retry on a flaky connection, then show the error
      refetchOnWindowFocus: false, // don't reload when the guest switches apps
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ToastProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>,
)
