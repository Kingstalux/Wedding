import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { TextField } from '../../components/Form'
import { useAuth } from '../AuthProvider'
import styles from './Login.module.css'

/**
 * Route: /admin/reset-password. The link in the reset email opens this page;
 * Supabase reads the one-time code from the address and signs the account in
 * temporarily, so the new password can be saved.
 */
export function ResetPasswordPage() {
  const { auth, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const signedIn = auth.status === 'admin' || auth.status === 'notAdmin'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('The two passwords don’t match.')
    setBusy(true)
    const problem = await updatePassword(password)
    setBusy(false)
    if (problem) setError(problem)
    else navigate('/admin', { replace: true })
  }

  return (
    <main className={styles.formSide} style={{ minHeight: '100dvh' }}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <h1 className="display" style={{ fontSize: 34 }}>
          Choose a new password
        </h1>

        {auth.status === 'loading' ? (
          <p className="muted" role="status">
            Checking your reset link…
          </p>
        ) : !signedIn ? (
          <>
            <p className={styles.error} role="alert">
              This reset link has expired or was already used. Request a new one from the sign-in
              page.
            </p>
            <Link to="/admin/login">Back to sign in</Link>
          </>
        ) : (
          <>
            <TextField
              look="box"
              label="New password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              look="box"
              label="Repeat the new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={busy}>
              Save password
            </Button>
          </>
        )}
      </form>
    </main>
  )
}
