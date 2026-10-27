import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/cx'
import { Icon, type IconName } from './Icon'
import styles from './IconButton.module.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName
  /** Required: icon-only buttons need a text label for screen readers. */
  label: string
  tone?: 'default' | 'light'
  size?: 'md' | 'sm'
}

export function IconButton({
  icon,
  label,
  tone = 'default',
  size = 'md',
  className,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        styles.iconButton,
        tone === 'light' && styles.light,
        size === 'sm' && styles.small,
        className,
      )}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  )
}
