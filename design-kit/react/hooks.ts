import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * The same behaviour as kit.js, as React hooks (copied from the wedding site).
 */

/** Sections with data-reveal "fill in" as they scroll into view (styles in base.css). */
export function useReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const sections = document.querySelectorAll<HTMLElement>('section[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.reveal = 'in'
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    for (const section of sections) {
      const box = section.getBoundingClientRect()
      if (box.top < window.innerHeight && box.bottom > 0) {
        section.dataset.reveal = 'in'
      } else {
        section.dataset.reveal = 'pending'
        observer.observe(section)
      }
    }
    return () => observer.disconnect()
  }, [])
}

/** True once the page has scrolled past `threshold` of the screen height. */
export function useSolidHeader(threshold = 0.8) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return solid
}

/** Mobile menu: focus the close button, Escape closes, the page stops scrolling. */
export function useMobileMenu() {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])
  return { open, setOpen, closeRef }
}

/** Card strip: a ref for the <ul>, which arrows are useful, and a one-card step. */
export function useStrip(gap = 16) {
  const ref = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const measure = useCallback(() => {
    const strip = ref.current
    if (!strip) return
    setEdges({
      start: strip.scrollLeft <= 4,
      end: strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4,
    })
  }, [])
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])
  const step = (direction: 1 | -1) => {
    const strip = ref.current
    const card = strip?.querySelector('li')
    if (strip && card) strip.scrollBy({ left: direction * (card.clientWidth + gap) })
  }
  // Put onScroll={measure} on the <ul>.
  return { ref, edges, step, measure }
}
