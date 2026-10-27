import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Form'
import { Eyebrow } from '../../components/Typography'
import { useAuth } from '../AuthProvider'
import styles from './Login.module.css'

/** Only allow returning to studio pages after sign-in (never to another site). */
function safeNext(next: string | null): string {
  return next && next.startsWith('/admin') ? next : '/admin'
}

export function LoginPage() {
  const { auth, signIn, sendPasswordReset } = useAuth()
  const [search] = useSearchParams()
  const [mode, setMode] = useState<'signIn' | 'reset'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (auth.status === 'admin') return <Navigate to={safeNext(search.get('next'))} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (!email.trim()) return setError('Please enter your email.')
    setBusy(true)
    if (mode === 'signIn') {
      // On success, the auth state changes and the <Navigate> above takes over.
      const problem = await signIn(email, password)
      if (problem) setError(problem)
    } else {
      const problem = await sendPasswordReset(email)
      if (problem) setError(problem)
      else
        setNotice(
          'If this email belongs to the studio, a link to choose a new password is on its way. Check your inbox (and spam).',
        )
    }
    setBusy(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.side}>
        <span className={styles.mark} aria-hidden="true">
          ♥
        </span>
        <div>
          <Eyebrow light>Couple’s studio</Eyebrow>
          <h1 className="display">
            Your <em>wedding,</em> managed
          </h1>
        </div>
        <Eyebrow light>Guests · Replies · Photos · Door</Eyebrow>
      </div>

      <main className={styles.formSide}>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div>
            <h2 className="display" style={{ fontSize: 34 }}>
              {mode === 'signIn' ? 'Welcome back' : 'Reset your password'}
            </h2>
            <p className="muted" style={{ marginTop: 8 }}>
              {mode === 'signIn'
                ? 'Sign in to manage guests, the website and the guest book.'
                : 'Enter the studio email and we’ll send you a link to choose a new password.'}
            </p>
          </div>

          <TextField
            look="box"
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {mode === 'signIn' && (
            <div className={styles.password}>
              <TextField
                look="box"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.reveal}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}

          <Button type="submit" loading={busy}>
            {mode === 'signIn' ? 'Sign in' : 'Send reset link'}
          </Button>

          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              setMode(mode === 'signIn' ? 'reset' : 'signIn')
              setError(null)
              setNotice(null)
            }}
          >
            {mode === 'signIn' ? 'Forgot your password?' : 'Back to sign in'}
          </button>
        </form>
      </main>
    </div>
  )
}
