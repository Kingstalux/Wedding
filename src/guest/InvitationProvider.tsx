import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SAMPLE_TOKEN, sampleContent, sampleInvitation } from './sample'
import type { GiftAnnouncement, Invitation, PublicContent, Rsvp } from './types'

/*
 * Gives every guest page access to:
 *  - content:    settings, programme and gallery (the same for everyone)
 *  - invitation: this guest's name, reply and the guest book
 *  - actions:    what a guest can do (reply, post a wish, announce a gift)
 *
 * STEP 3: everything is sample data kept in memory; nothing is saved.
 * STEP 6: the same shape is loaded from Supabase with the guest's token,
 * and the actions call database functions (supabase.rpc(...)).
 */

type Actions = {
  submitRsvp: (rsvp: Rsvp) => Promise<void>
  postWish: (message: string) => Promise<void>
  deleteWish: (id: string) => Promise<void>
  announceGift: (gift: GiftAnnouncement) => Promise<void>
}

type InvitationState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | {
      status: 'ready'
      token: string
      content: PublicContent
      invitation: Invitation
      actions: Actions
    }

const InvitationContext = createContext<InvitationState | null>(null)

/** Pretend network delay so loading states are visible while developing. */
const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

export function InvitationProvider({ token, children }: { token: string; children: ReactNode }) {
  const [invitation, setInvitation] = useState<Invitation>(sampleInvitation)

  const actions = useMemo<Actions>(
    () => ({
      submitRsvp: async (rsvp) => {
        await wait()
        setInvitation((inv) => ({ ...inv, rsvp }))
      },
      postWish: async (message) => {
        await wait()
        setInvitation((inv) => ({
          ...inv,
          wishes: [
            {
              id: crypto.randomUUID(),
              author: inv.first_name,
              message,
              created_at: new Date().toISOString(),
              mine: true,
            },
            ...inv.wishes,
          ],
        }))
      },
      deleteWish: async (id) => {
        await wait(200)
        setInvitation((inv) => ({ ...inv, wishes: inv.wishes.filter((w) => w.id !== id) }))
      },
      announceGift: async () => {
        await wait()
      },
    }),
    [],
  )

  const state: InvitationState =
    token === SAMPLE_TOKEN
      ? { status: 'ready', token, content: sampleContent, invitation, actions }
      : { status: 'invalid' }

  return <InvitationContext.Provider value={state}>{children}</InvitationContext.Provider>
}

/** Raw state, including 'loading' and 'invalid'. Used by the page that wraps the sections. */
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
