import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from '../lib/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'ghost' | 'ghostLight' | 'gold' | 'danger'

type StyleProps = {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  block?: boolean
}

function classes({ variant = 'primary', size = 'md', block }: StyleProps, extra?: string) {
  return cx(
    styles.button,
    styles[variant],
    size === 'sm' && styles.small,
    block && styles.block,
    extra,
  )
}

type ButtonProps = StyleProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Shows a spinner and disables the button while an action runs. */
    loading?: boolean
  }

export function Button({
  variant,
  size,
  block,
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes({ variant, size, block }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}

type ButtonLinkProps = StyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    /** In-app route, e.g. "/admin/site" (uses the router, no page reload). */
    to?: string
    /** External address, e.g. a Google Maps or WhatsApp link. */
    href?: string
    children: ReactNode
  }

/** A link styled as a button. Use `to` for app pages, `href` for external sites. */
export function ButtonLink({
  variant,
  size,
  block,
  className,
  to,
  href,
  ...rest
}: ButtonLinkProps) {
  const cls = classes({ variant, size, block }, className)
  if (to) return <Link to={to} className={cls} {...rest} />
  return <a href={href} className={cls} {...rest} />
}
