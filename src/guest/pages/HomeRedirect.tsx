import { Navigate } from 'react-router'
import { TOKEN_STORAGE_KEY } from '../InvitationProvider'
import { PersonalPage } from './PersonalPage'

/**
 * Route: "/". A guest who opened their invitation on this device before is
 * taken straight back to it; anyone else sees "This invitation is personal".
 */
export function HomeRedirect() {
  let token: string | null = null
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    // Storage blocked: behave as a first visit.
  }
  return token ? <Navigate to={`/i/${encodeURIComponent(token)}`} replace /> : <PersonalPage />
}
