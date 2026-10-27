import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { QR_COLORS } from '../lib/qr'

/** A scannable QR code drawn as SVG (sharp at any size). */
export function QrCode({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className?: string
}) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let cancelled = false
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: QR_COLORS,
    })
      .then((markup) => !cancelled && setSvg(markup))
      .catch(() => !cancelled && setSvg(''))
    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      // The markup comes from the qrcode library, not from user input.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
