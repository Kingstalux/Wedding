import QRCode from 'qrcode'

/** Forest on white: high contrast, so every phone camera scans it reliably. */
export const QR_COLORS = { dark: '#0c3b2e', light: '#ffffff' }

/** The address a pass's QR code opens: the door team scans it with any phone camera. */
export function passUrl(code: string): string {
  return `${window.location.origin}/pass/${encodeURIComponent(code)}`
}

/** Saves the QR code as a PNG file, for the "Download" button. */
export async function downloadQrPng(value: string, fileName: string) {
  const dataUrl = await QRCode.toDataURL(value, { width: 800, margin: 2, color: QR_COLORS })
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  link.click()
}
