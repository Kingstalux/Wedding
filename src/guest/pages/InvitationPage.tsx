import { useEffect, useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router'
import { InvitationProvider, useInvitation, useInvitationState } from '../InvitationProvider'
import { useMusic } from '../useMusic'
import { Envelope } from './Envelope'
import { HomePage } from './HomePage'
import { LoadingScreen } from './LoadingScreen'
import { PersonalPage } from './PersonalPage'

/**
 * Route: /i/:token (parent of the home page and /i/:token/pass).
 * Loads the invitation once, so both pages share the same data,
 * and shows the "personal" page when the token isn't valid.
 */
export function InvitationLayout() {
  const { token = '' } = useParams()
  return (
    <InvitationProvider token={token}>
      <InvitationGate />
    </InvitationProvider>
  )
}

function InvitationGate() {
  const state = useInvitationState()

  useEffect(() => {
    if (state.status === 'ready') {
      const { bride, groom } = state.content.settings
      document.title = `${bride} & ${groom}`
    }
  }, [state])

  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'invalid') return <PersonalPage />
  return <Outlet />
}

/**
 * Route: /i/:token (index). Shows the opening screen first. Once opened,
 * the guest sees the full page for the rest of the visit (remembered per tab).
 */
export function InvitationPage() {
  const { token, content } = useInvitation()
  const storageKey = `opened:${token}`
  const [opened, setOpened] = useState(() => sessionStorage.getItem(storageKey) === '1')
  const music = useMusic(content.settings.music_url)
  const { hash } = useLocation()

  // Links like /i/abc#rsvp (e.g. "Back to the invitation") scroll to that section.
  useEffect(() => {
    if (opened && hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [opened, hash])

  function open() {
    music.start()
    sessionStorage.setItem(storageKey, '1')
    setOpened(true)
    window.scrollTo({ top: 0 })
  }

  return opened ? <HomePage music={music} /> : <Envelope onOpen={open} hasMusic={music.available} />
}
