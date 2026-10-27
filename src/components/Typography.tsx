import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './Typography.module.css'

/** Small spaced capitals above a heading, e.g. "OUR GALLERY". */
export function Eyebrow({
  children,
  light,
  className,
}: {
  children: ReactNode
  /** Use on emerald/dark backgrounds. */
  light?: boolean
  className?: string
}) {
  return <p className={cx(styles.eyebrow, light && styles.eyebrowLight, className)}>{children}</p>
}

/** The short gold line under headings. */
export function Rule({ center }: { center?: boolean }) {
  return <hr className={cx(styles.rule, center && styles.ruleCenter)} />
}

/** "B | G": the couple's initials with a thin divider. */
export function Monogram({
  bride,
  groom,
  size = 24,
  gold,
  className,
}: {
  bride: string
  groom: string
  size?: number
  /** Gold divider instead of a text-coloured one. */
  gold?: boolean
  className?: string
}) {
  const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '·'
  return (
    <span
      className={cx(styles.monogram, gold && styles.monogramGold, className)}
      style={{ fontSize: size }}
      aria-label={`${bride} & ${groom}`}
      role="img"
    >
      {initial(bride)}
      <i aria-hidden="true" />
      {initial(groom)}
    </span>
  )
}
