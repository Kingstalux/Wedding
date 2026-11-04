import { useEffect } from 'react'

/**
 * The "fill-in" effect of the invitation page (styles in styles/base.css).
 *
 * Every <section data-reveal> below the screen waits as "pending" (ivory,
 * content hidden). When it scrolls into view it switches to "in": the
 * background fills to navy and the content rises in. It plays once.
 * Sections already on screen, and browsers without IntersectionObserver,
 * show the final navy straight away.
 */
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
      // Fires once the section's top is 12% above the bottom of the screen,
      // so it works the same for short and very tall sections.
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
