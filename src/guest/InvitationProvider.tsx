import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useT } from '../i18n/LanguageProvider'
import * as api from './api'
import type { GiftAnnouncement, Invitation, PublicContent, Rsvp } from './types'

/*
 * Gives every guest page access to:
 *  - content:    settings, programme and gallery
 *  - invitation: this guest's name, reply and the guest book
 *  - actions:    what a guest can do (reply, post a wish, announce a gift)
 *
 * Data comes from get_invitation(token) through React Query, which caches it
 * under the key ['invitation', token]. After each action the cache is updated
 * in place, so the page changes immediately without reloading everything.
 */

export const TOKEN_STORAGE_KEY = 'wedding-token'

type Actions = {
  submitRsvp: (rsvp: Rsvp) => Promise<void>
  postWish: (message: string) => Promise<void>
  deleteWish: (id: string) => Promise<void>
  announceGift: (gift: GiftAnnouncement) => Promise<void>
}

type InvitationState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'error'; error: unknown; retry: () => void }
  | {
      status: 'ready'
      token: string
      preview: boolean
      content: PublicContent
      invitation: Invitation
      actions: Actions
    }

const InvitationContext = createContext<InvitationState | null>(null)

export function InvitationProvider({
  token,
  preview = false,
  children,
}: {
  token: string
  /** The couple viewing from the studio: visits aren't counted. */
  preview?: boolean
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const { lang, setLang, chosen } = useT()
  const queryKey = useMemo(() => ['invitation', token], [token])

  const query = useQuery({
    queryKey,
    queryFn: () => api.loadInvitation(token, preview),
    // Each load counts as a visit in the couple's tracking, so load once per
    // page view and never refresh in the background.
    staleTime: Infinity,
  })

  const loaded = query.data ?? null

  // Remember the link on this device, so opening the site's bare address later
  // brings the guest back to their invitation. Forget it if it stopped working.
  useEffect(() => {
    if (preview || !query.isSuccess) return
    try {
      if (loaded) localStorage.setItem(TOKEN_STORAGE_KEY, token)
      else if (localStorage.getItem(TOKEN_STORAGE_KEY) === token) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    } catch {
      // Storage blocked (private browsing): nothing to remember.
    }
  }, [preview, query.isSuccess, loaded, token])

  // Language: use the guest's saved choice from an earlier visit (any device),
  // and save new choices so WhatsApp messages can be sent in their language.
  const savedLang = loaded?.invitation.lang ?? null
  useEffect(() => {
    if (!loaded || preview) return
    if (!chosen && savedLang && savedLang !== lang) {
      setLang(savedLang)
    } else if (savedLang !== lang) {
      api.setLanguage(token, lang).catch(() => {})
      queryClient.setQueryData<api.LoadedInvitation | null>(queryKey, (old) =>
        old ? { ...old, invitation: { ...old.invitation, lang } } : old,
      )
    }
  }, [loaded, preview, chosen, savedLang, lang, setLang, token, queryClient, queryKey])

  const actions = useMemo<Actions>(() => {
    // Apply a change to the cached invitation; every section re-renders with it.
    const update = (change: (inv: Invitation) => Invitation) =>
      queryClient.setQueryData<api.LoadedInvitation | null>(queryKey, (old) =>
        old ? { ...old, invitation: change(old.invitation) } : old,
      )

    return {
      submitRsvp: async (rsvp) => {
        const saved = await api.submitRsvp(token, rsvp)
        update((inv) => ({ ...inv, rsvp: saved }))
      },
      postWish: async (message) => {
        const wish = await api.postWish(token, message)
        update((inv) => ({ ...inv, wishes: [wish, ...inv.wishes] }))
      },
      deleteWish: async (id) => {
        await api.deleteWish(token, id)
        update((inv) => ({ ...inv, wishes: inv.wishes.filter((w) => w.id !== id) }))
      },
      announceGift: (gift) => api.announceGift(token, gift),
    }
  }, [queryClient, queryKey, token])

  let state: InvitationState
  if (query.isPending) state = { status: 'loading' }
  else if (query.isError)
    state = { status: 'error', error: query.error, retry: () => query.refetch() }
  else if (!loaded) state = { status: 'invalid' }
  else state = { status: 'ready', token, preview, ...loaded, actions }

  return <InvitationContext.Provider value={state}>{children}</InvitationContext.Provider>
}

/** Raw state, including 'loading', 'invalid' and 'error'. Used by the page that wraps the sections. */
// eslint-disable-next-line react/only-export-components -- hooks belong with their provider
export function useInvitationState(): InvitationState {
  const state = useContext(InvitationContext)
  if (!state) throw new Error('useInvitationState must be used inside <InvitationProvider>')
  return state
}

/** For sections that only render once the invitation is ready. */
// eslint-disable-next-line react/only-export-components -- hooks belong with their provider
export function useInvitation() {
  const state = useInvitationState()
  if (state.status !== 'ready') throw new Error('useInvitation used before the invitation loaded')
  return state
}
