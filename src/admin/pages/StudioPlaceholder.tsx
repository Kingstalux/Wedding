import { Eyebrow } from '../../components/Typography'

/** Stands in for a studio page until its step builds it. */
export function StudioPlaceholder({
  title,
  step,
  mockup,
}: {
  title: string
  step: number
  mockup: string
}) {
  return (
    <div>
      <Eyebrow>Coming in Step {step}</Eyebrow>
      <h1 className="display h2">{title}</h1>
      <p className="muted" style={{ marginTop: 16 }}>
        The design for this page is in <code>mockup/{mockup}</code>.
      </p>
    </div>
  )
}
