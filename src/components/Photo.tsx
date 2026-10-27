import type { CSSProperties } from 'react'
import { cx } from '../lib/cx'
import styles from './Photo.module.css'

export type PhotoTone = 'navy' | 'slate' | 'forest' | 'emerald'

type Props = {
  /** Image address. When missing, a coloured placeholder with `label` is shown. */
  src?: string | null
  /** Optional image for screens held upright (phones). The browser loads only one of the two. */
  portraitSrc?: string | null
  alt?: string
  /** Text shown on the placeholder, e.g. "Couple photo". */
  label?: string
  tone?: PhotoTone
  className?: string
  style?: CSSProperties
  loading?: 'lazy' | 'eager'
}

/**
 * A photo that fills its box (object-fit: cover). Until the couple uploads
 * a picture, it shows the mockup's coloured placeholder instead.
 * The parent sets the size (e.g. aspect-ratio or height).
 */
export function Photo({
  src,
  portraitSrc,
  alt = '',
  label,
  tone = 'slate',
  className,
  style,
  loading = 'lazy',
}: Props) {
  return (
    <div
      className={cx(styles.photo, styles[tone], !src && styles.placeholder, className)}
      style={style}
    >
      {src && portraitSrc ? (
        <picture>
          <source media="(orientation: portrait)" srcSet={portraitSrc} />
          <img src={src} alt={alt} loading={loading} decoding="async" />
        </picture>
      ) : src ? (
        <img src={src} alt={alt} loading={loading} decoding="async" />
      ) : (
        label && <span className={styles.label}>{label}</span>
      )}
    </div>
  )
}
