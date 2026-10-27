import { useId } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cx } from '../lib/cx'
import styles from './Form.module.css'

/** "line" = the guest site's underlined look; "box" = the studio's boxed look. */
export type FieldLook = 'line' | 'box'

type FieldShell = {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  look?: FieldLook
  className?: string
}

/**
 * Wraps a control with its label, hint and error, and wires up the ids
 * (htmlFor, aria-describedby, aria-invalid) so screen readers announce them.
 */
function useFieldIds(id?: string) {
  const auto = useId()
  const controlId = id ?? auto
  return { controlId, hintId: `${controlId}-hint`, errorId: `${controlId}-error` }
}

function Shell({
  label,
  hint,
  error,
  className,
  ids,
  children,
}: FieldShell & { ids: ReturnType<typeof useFieldIds>; children: ReactNode }) {
  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={ids.controlId}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className={styles.hint} id={ids.hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className={styles.error} id={ids.errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function a11y(ids: ReturnType<typeof useFieldIds>, hint: ReactNode, error?: string | null) {
  return {
    id: ids.controlId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? ids.errorId : hint ? ids.hintId : undefined,
  }
}

type TextFieldProps = FieldShell & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>

export function TextField({
  label,
  hint,
  error,
  look = 'line',
  className,
  id,
  ...rest
}: TextFieldProps) {
  const ids = useFieldIds(id)
  return (
    <Shell label={label} hint={hint} error={error} className={className} ids={ids}>
      <input
        className={cx(styles.control, styles[look], error && styles.invalid)}
        {...a11y(ids, hint, error)}
        {...rest}
      />
    </Shell>
  )
}

type TextAreaFieldProps = FieldShell &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export function TextAreaField({
  label,
  hint,
  error,
  look = 'line',
  className,
  id,
  ...rest
}: TextAreaFieldProps) {
  const ids = useFieldIds(id)
  return (
    <Shell label={label} hint={hint} error={error} className={className} ids={ids}>
      <textarea
        className={cx(styles.control, styles[look], styles.textarea, error && styles.invalid)}
        {...a11y(ids, hint, error)}
        {...rest}
      />
    </Shell>
  )
}

type SelectFieldProps = FieldShell &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & { children: ReactNode }

export function SelectField({
  label,
  hint,
  error,
  look = 'line',
  className,
  id,
  children,
  ...rest
}: SelectFieldProps) {
  const ids = useFieldIds(id)
  return (
    <Shell label={label} hint={hint} error={error} className={className} ids={ids}>
      <select
        className={cx(styles.control, styles[look], error && styles.invalid)}
        {...a11y(ids, hint, error)}
        {...rest}
      >
        {children}
      </select>
    </Shell>
  )
}

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  label: ReactNode
  className?: string
}

/** On/off switch, e.g. "Shown on the site". A real checkbox underneath. */
export function Switch({ label, className, ...rest }: ToggleProps) {
  return (
    <label className={cx(styles.switch, className)}>
      <input type="checkbox" role="switch" {...rest} />
      <span>{label}</span>
    </label>
  )
}

/** One radio option, e.g. "Joyfully accepts". Group them in a <fieldset>. */
export function Choice({ label, className, ...rest }: ToggleProps) {
  return (
    <label className={cx(styles.choice, className)}>
      <input type="radio" {...rest} />
      <span>{label}</span>
    </label>
  )
}
