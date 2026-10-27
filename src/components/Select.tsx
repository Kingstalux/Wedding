import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../lib/cx'
import { Icon } from './Icon'
import styles from './Select.module.css'

export type SelectOption = { value: string; label: string }

type Props = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  look?: 'line' | 'box'
  id?: string
  /** Needed when there's no visible <label for={id}>. */
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * A dropdown styled like the rest of the site (the browser's own <select>
 * can't be styled when open). Follows the WAI-ARIA "select-only combobox"
 * pattern: arrow keys, Home/End, Enter/Space, Escape and type-to-find all work.
 */
export function Select({
  value,
  options,
  onChange,
  look = 'box',
  id,
  placeholder = 'Choose…',
  disabled,
  className,
  ...aria
}: Props) {
  const autoId = useId()
  const buttonId = id ?? autoId
  const listId = `${buttonId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const selectedIndex = options.findIndex((o) => o.value === value)
  const [active, setActive] = useState(Math.max(0, selectedIndex))

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Keep the highlighted option visible while moving with the keyboard.
  useEffect(() => {
    if (open)
      listRef.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function openList() {
    if (disabled) return
    const box = buttonRef.current?.getBoundingClientRect()
    if (box)
      setUp(window.innerHeight - box.bottom < 280 && box.top > window.innerHeight - box.bottom)
    setActive(Math.max(0, selectedIndex))
    setOpen(true)
  }

  function choose(index: number) {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  /** Jump to the first option starting with the letters typed in the last second. */
  function typeAhead(key: string) {
    const now = Date.now()
    typed.current = {
      text: (now - typed.current.at < 800 ? typed.current.text : '') + key.toLowerCase(),
      at: now,
    }
    const found = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text))
    if (found >= 0) setActive(found)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    const last = options.length - 1
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
      PageDown: Math.min(last, active + 5),
      PageUp: Math.max(0, active - 5),
    }
    if (e.key in moves) {
      e.preventDefault()
      setActive(moves[e.key])
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(active)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation() // don't also close a surrounding dialog
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    } else if (e.key.length === 1) {
      typeAhead(e.key)
    }
  }

  const selected = options[selectedIndex]

  return (
    <div ref={rootRef} className={cx(styles.select, className)}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        className={cx(styles.trigger, styles[look])}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        {...aria}
      >
        <span className={cx(styles.value, !selected && styles.placeholder)}>
          {selected?.label ?? placeholder}
        </span>
        <svg className={styles.chevron} width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={cx(styles.list, up && styles.up)}
          tabIndex={-1}
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              id={`${listId}-${i}`}
              data-index={i}
              role="option"
              aria-selected={option.value === value}
              className={cx(styles.option, i === active && styles.active)}
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => e.preventDefault()} // keep focus on the button
              onClick={() => choose(i)}
            >
              {option.label}
              {option.value === value && <Icon name="check" className={styles.check} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
