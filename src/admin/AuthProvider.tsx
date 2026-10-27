import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

/*
 * The couple's sign-in.
 *
 * Supabase Auth keeps the session (a signed login token) in localStorage, so
 * the couple stays signed in between visits. Being signed in isn't enough to
 * enter the studio: is_admin() must also say this account is in `admins`.
 * The database enforces the same rule on every request, so this check is
 * about showing the right screen, not about security.
 */

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'notAdmin'; email: string }
  | { status: 'admin'; email: string; userId: string }

type AuthContextValue = {
  auth: AuthState
  /** Returns an error message to show, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  /** Sends a "reset your password" email. Returns an error message or null. */
  sendPasswordReset: (email: string) => Promise<string | null>
  /** Sets a new password for the signed-in account (after a reset link). */
  updatePassword: (password: string) => Promise<string | null>
  /** True while the user arrived from a password-reset email link. */
  recovering: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match.'
  if (/email not confirmed/i.test(message)) return 'This account’s email hasn’t been confirmed yet.'
  if (/rate limit|too many/i.test(message))
    return 'Too many attempts. Please wait a minute and try again.'
  if (/failed to fetch|network/i.test(message))
    return 'No connection. Check your internet and try again.'
  if (/should be different/i.test(message))
    return 'Please choose a password different from the old one.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  // undefined = still reading the saved session
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    // Fires on sign-in, sign-out, token refresh, and when a reset link is opened.
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') {
        setRecovering(false)
        queryClient.removeQueries({ queryKey: ['admin'] }) // forget the couple's data
      }
    })
    return () => data.subscription.unsubscribe()
  }, [queryClient])

  const userId = session?.user.id
  const adminCheck = useQuery({
    queryKey: ['is-admin', userId],
    enabled: Boolean(userId),
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin')
      if (error) throw error
      return data === true
    },
  })

  const isAdmin = adminCheck.data
  const checking = Boolean(session) && adminCheck.isPending
  const auth = useMemo<AuthState>(() => {
    if (session === undefined || checking) return { status: 'loading' }
    if (!session) return { status: 'signedOut' }
    const email = session.user.email ?? ''
    return isAdmin
      ? { status: 'admin', email, userId: session.user.id }
      : { status: 'notAdmin', email }
  }, [session, checking, isAdmin])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? friendly(error.message) : null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    return error ? friendly(error.message) : null
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) setRecovering(false)
    return error ? friendly(error.message) : null
  }, [])

  const value = useMemo(
    () => ({ auth, signIn, signOut, sendPasswordReset, updatePassword, recovering }),
    [auth, signIn, signOut, sendPasswordReset, updatePassword, recovering],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components -- hook belongs with its provider
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
