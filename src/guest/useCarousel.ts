import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A sideways strip of cards (Words of love, the gallery): swipe on phones,
 * arrows on computers. Put `ref` and `onScroll={measure}` on the <ul>;
 * `edges` says which arrow has nothing left to show.
 *
 * `itemCount` re-measures when cards are added or removed.
 */
export function useCarousel(itemCount: number, gap: number) {
  const ref = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  const measure = useCallback(() => {
    const track = ref.current
    if (!track) return
    setEdges({
      start: track.scrollLeft <= 4,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, itemCount])

  /** Moves one card forward (1) or back (-1). */
  const step = (direction: 1 | -1) => {
    const track = ref.current
    const card = track?.querySelector('li')
    if (!track || !card) return
    track.scrollBy({ left: direction * (card.clientWidth + gap) })
  }

  /** Brings card `index` into view (instantly, without moving the page). */
  const show = useCallback((index: number) => {
    const track = ref.current
    const card = track?.children[index] as HTMLElement | undefined
    if (!track || !card) return
    // The track is position: relative, so offsetLeft is measured from it.
    track.scrollTo({ left: card.offsetLeft, behavior: 'instant' })
  }, [])

  return { ref, edges, measure, step, show }
}
