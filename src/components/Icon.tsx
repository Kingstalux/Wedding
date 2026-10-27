import type { SVGProps } from 'react'

/*
 * Line icons drawn on a 16×16 grid, taken from the mockup's inline SVGs.
 * Stroke icons use currentColor, so they follow the surrounding text colour.
 */
const stroke = {
  arrowDown: <path d="M8 1v14M3 10l5 5 5-5" />,
  arrowRight: <path d="M1 8h13M9 3l5 5-5 5" />,
  chevronLeft: <path d="M10 2L4 8l6 6" />,
  chevronRight: <path d="M6 2l6 6-6 6" />,
  close: <path d="M2 2l12 12M14 2L2 14" />,
  menu: <path d="M1 4h14M1 8h14M1 12h14" />,
  check: <path d="M2 8.5l4 4 8-9" />,
  plus: <path d="M8 2v12M2 8h12" />,
  copy: (
    <>
      <rect x="5" y="5" width="9" height="9" />
      <path d="M11 5V2H2v9h3" />
    </>
  ),
  edit: <path d="M11 2l3 3-8 8H3v-3z" />,
  trash: <path d="M2 4h12M6 4V2h4v2M4 4l1 10h6l1-10" />,
  music: (
    <>
      <path d="M6 12V3l8-1.5V10" />
      <circle cx="4" cy="12" r="2" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  external: <path d="M9 2h5v5M14 2L7 9M11 10v4H2V5h4" />,
  signOut: <path d="M6 2H2v12h4M10.5 4.5L14 8l-3.5 3.5M14 8H6" />,
  users: (
    <>
      <circle cx="6" cy="5" r="2.6" />
      <path d="M1.5 14c.5-2.7 2.4-4 4.5-4s4 1.3 4.5 4M10.5 3a2.3 2.3 0 010 4.4M12.5 10.3c1.2.5 1.8 1.6 2 3.7" />
    </>
  ),
  layout: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" />
      <path d="M1.5 6h13M4.5 9.5h4" />
    </>
  ),
  pin: (
    <>
      <path d="M8 14.5s4.5-4.1 4.5-7.6a4.5 4.5 0 00-9 0C3.5 10.4 8 14.5 8 14.5z" />
      <circle cx="8" cy="6.8" r="1.6" />
    </>
  ),
  image: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" />
      <path d="M1.5 11l3.5-3.5 3.5 3.5 2-2 4 4" />
      <circle cx="10.8" cy="5.8" r="1" />
    </>
  ),
  message: <path d="M2 2.5h12v8.5H6.5L2 14.5z" />,
  gift: (
    <>
      <rect x="1.5" y="5.5" width="13" height="3" />
      <path d="M2.5 8.5v6h11v-6M8 5.5v9M8 5.5S6.5 2 4.8 2.6C3.2 3.2 4.5 5.5 8 5.5zM8 5.5s1.5-3.5 3.2-2.9c1.6.6.3 2.9-3.2 2.9z" />
    </>
  ),
  scan: <path d="M1.5 5V1.5H5M11 1.5h3.5V5M14.5 11v3.5H11M5 14.5H1.5V11M4.5 8h7" />,
} as const

const fill = {
  play: <path d="M4 2v12l10-6z" />,
  whatsapp: (
    <path d="M8 1.2a6.7 6.7 0 00-5.8 10.1L1.3 14.8l3.6-.9A6.7 6.7 0 108 1.2zm0 12.2a5.5 5.5 0 01-2.8-.8l-.2-.1-2.1.6.6-2.1-.1-.2A5.5 5.5 0 118 13.4zm3-4.1c-.2-.1-1-.5-1.1-.5s-.3-.1-.4.1l-.5.6c-.1.1-.2.1-.4 0a4.5 4.5 0 01-2.2-1.9c-.2-.3.2-.3.5-1 .1-.1 0-.2 0-.3l-.5-1.2c-.1-.3-.3-.3-.4-.3h-.3a.7.7 0 00-.5.2 2 2 0 00-.6 1.5 3.5 3.5 0 00.7 1.8 7.9 7.9 0 003 2.7c1.1.5 1.6.5 2.1.4a1.8 1.8 0 001.2-.8 1.4 1.4 0 00.1-.8c-.1-.1-.2-.1-.4-.2z" />
  ),
} as const

export type IconName = keyof typeof stroke | keyof typeof fill

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number }

/** Decorative by default (aria-hidden). Give the parent button an aria-label. */
export function Icon({ name, size = 16, ...rest }: Props) {
  const isFill = name in fill
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      fill={isFill ? 'currentColor' : 'none'}
      stroke={isFill ? 'none' : 'currentColor'}
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {isFill ? fill[name as keyof typeof fill] : stroke[name as keyof typeof stroke]}
    </svg>
  )
}
