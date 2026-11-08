import type { ReactNode } from 'react'
import { IconButton } from '../../components/IconButton'
import { cx } from '../../lib/cx'
import styles from './Pager.module.css'

/** Previous / next arrows with "Guests 11–20 of 46". Hidden when everything fits on one page. */
export function Pager({
  page,
  pageCount,
  onPage,
  label,
  children,
  className,
}: {
  page: number
  pageCount: number
  onPage: (page: number) => void
  label: string
  /** Extra controls, e.g. "Go to table". */
  children?: ReactNode
  className?: string
}) {
  if (pageCount <= 1 && !children) return null
  return (
    <nav className={cx(styles.pager, className)} aria-label="Pages">
      <p className={styles.label} aria-live="polite">
        {label}
      </p>
      {children}
      {pageCount > 1 && (
        <div className={styles.arrows}>
          <IconButton
            icon="chevronLeft"
            size="sm"
            label="Previous page"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          />
          <span className={styles.count}>
            {page} / {pageCount}
          </span>
          <IconButton
            icon="chevronRight"
            size="sm"
            label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
          />
        </div>
      )}
    </nav>
  )
}
