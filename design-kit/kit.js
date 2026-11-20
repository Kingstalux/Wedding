/*
 * The behaviour, in plain JavaScript (no framework). Load at the end of
 * <body> or with <script type="module">. React versions are in react/.
 */

/**
 * Sections "fill in" as they scroll into view (styles in base.css).
 * Sections already on screen show their final look straight away; without
 * IntersectionObserver every section simply shows its final look.
 */
export function initReveal(root = document) {
  if (!('IntersectionObserver' in window)) return () => {}
  const sections = root.querySelectorAll('section[data-reveal]')
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.dataset.reveal = 'in'
        observer.unobserve(entry.target)
      }
    },
    // Fires once the section's top is 12% above the bottom of the screen,
    // so short and very tall sections behave the same.
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
}

/** The header turns solid once the page has scrolled past 80% of the screen. */
export function initSolidHeader(header, threshold = 0.8) {
  const onScroll = () =>
    header.classList.toggle('solid', window.scrollY > window.innerHeight * threshold)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}

/**
 * Full-screen mobile menu: focus moves into it, Escape and any link close it,
 * and the page behind stops scrolling while it is open.
 */
export function initMobileMenu(nav, openButton, closeButton) {
  const setOpen = (open) => {
    nav.classList.toggle('open', open)
    openButton.setAttribute('aria-expanded', String(open))
    document.body.style.overflow = open ? 'hidden' : ''
    ;(open ? closeButton : openButton).focus()
  }
  openButton.addEventListener('click', () => setOpen(true))
  closeButton.addEventListener('click', () => setOpen(false))
  nav.addEventListener('click', (e) => e.target.closest('a') && setOpen(false))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false)
  })
}

/** Card strip arrows: move one card at a time; disable an arrow at the end. */
export function initStrip(strip, prev, next, gap = 16) {
  const measure = () => {
    prev.disabled = strip.scrollLeft <= 4
    next.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4
  }
  const step = (direction) => {
    const card = strip.firstElementChild
    if (card) strip.scrollBy({ left: direction * (card.clientWidth + gap) })
  }
  prev.addEventListener('click', () => step(-1))
  next.addEventListener('click', () => step(1))
  strip.addEventListener('scroll', measure, { passive: true })
  window.addEventListener('resize', measure)
  measure()
}
