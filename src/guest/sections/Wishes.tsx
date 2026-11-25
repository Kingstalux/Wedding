import { useEffect, useRef, useState } from 'react'
import { useConfirm } from '../../components/Confirm'
import { IconButton } from '../../components/IconButton'
import { useT } from '../../i18n/LanguageProvider'
import { useInvitation } from '../InvitationProvider'
import { useCarousel } from '../useCarousel'
import styles from './Wishes.module.css'

/**
 * Words of love: the guests' wishes, as a carousel. Swipe on phones, use the
 * arrows (or scroll the focused list with the keyboard) on computers.
 * Guests write one with their RSVP. Hidden until there is at least one.
 */
export function Wishes() {
  const { t } = useT()
  const confirm = useConfirm()
  const { content, invitation, actions } = useInvitation()
  const wishes = invitation.wishes
  const { ref: trackRef, edges, measure, step } = useCarousel(wishes.length, 16)

  // A newly posted wish appears first: bring the carousel back to the start.
  const newest = wishes[0]?.id
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 })
  }, [newest, trackRef])

  if (!content.settings.show_wishes || wishes.length === 0) return null

  async function remove(id: string) {
    const ok = await confirm({
      title: t('book.deleteConfirm'),
      confirmLabel: t('book.delete'),
      cancelLabel: t('common.cancel'),
      danger: true,
    })
    if (ok) await actions.deleteWish(id)
  }

  return (
    <section
      id="wishes"
      data-reveal=""
      className={`on-dark ${styles.wishes}`}
      aria-labelledby="wishes-title"
    >
      <div className="container">
        <div className={styles.head}>
          <h2 id="wishes-title" className="display h2">
            {t('wishes.title')}
          </h2>
          {wishes.length > 1 && (
            <div className={styles.arrows}>
              <IconButton
                icon="chevronLeft"
                tone="light"
                label={t('wishes.prev')}
                disabled={edges.start}
                onClick={() => step(-1)}
              />
              <IconButton
                icon="chevronRight"
                tone="light"
                label={t('wishes.next')}
                disabled={edges.end}
                onClick={() => step(1)}
              />
            </div>
          )}
        </div>

        <ul
          ref={trackRef}
          className={styles.track}
          onScroll={measure}
          tabIndex={0}
          aria-label={t('wishes.label')}
          aria-roledescription="carousel"
        >
          {wishes.map((wish, i) => (
            <li
              key={wish.id}
              className={styles.card}
              aria-roledescription="slide"
              aria-label={t('wishes.count', { n: i + 1, total: wishes.length })}
            >
              <span className={styles.quote} aria-hidden="true">
                “
              </span>
              <WishMessage text={wish.message} author={wish.author} />
              <div className={styles.meta}>
                <span className={styles.who}>{wish.author}</span>
                {wish.mine && (
                  <button type="button" className={styles.delete} onClick={() => remove(wish.id)}>
                    {t('book.delete')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * A wish's text. Cards have a maximum height; a long message scrolls inside
 * its own card. Only then can it take keyboard focus, so arrow keys scroll it
 * and short wishes add no extra stop when tabbing through the page.
 */
function WishMessage({ text, author }: { text: string; author: string }) {
  const { t } = useT()
  const ref = useRef<HTMLParagraphElement>(null)
  const [scrolls, setScrolls] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !('ResizeObserver' in window)) return
    const check = () => setScrolls(el.scrollHeight > el.clientHeight + 1)
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return (
    <p
      ref={ref}
      className={styles.message}
      {...(scrolls && {
        tabIndex: 0,
        role: 'region',
        'aria-label': t('wishes.message', { name: author }),
      })}
    >
      {text}
    </p>
  )
}
