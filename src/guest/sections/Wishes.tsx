import { useCallback, useEffect, useRef, useState } from 'react'
import { useConfirm } from '../../components/Confirm'
import { IconButton } from '../../components/IconButton'
import { Eyebrow } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { dayKey, formatDate } from '../../lib/time'
import { useInvitation } from '../InvitationProvider'
import styles from './Wishes.module.css'

/**
 * The guest book's messages, as a carousel. Swipe on phones, use the arrows
 * (or scroll the focused list with the keyboard) on computers.
 * The form to write one is its own section (GuestBook).
 */
export function Wishes() {
  const { t, lang } = useT()
  const confirm = useConfirm()
  const { content, invitation, actions } = useInvitation()
  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const wishes = invitation.wishes

  // Which arrows are useful right now.
  const measure = useCallback(() => {
    const track = trackRef.current
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
  }, [measure, wishes.length])

  // A newly posted wish appears first: bring the carousel back to the start.
  const newest = wishes[0]?.id
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 })
  }, [newest])

  if (!content.settings.show_wishes) return null

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current
    const card = track?.querySelector('li')
    if (!track || !card) return
    track.scrollBy({ left: direction * (card.clientWidth + 16) })
  }

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
    <section id="wishes" className={styles.wishes} aria-labelledby="wishes-title">
      <div className="container">
        <div className={styles.head}>
          <div>
            <Eyebrow light>{t('book.eyebrow')}</Eyebrow>
            <h2 id="wishes-title" className="display h2">
              {t('wishes.title')}
            </h2>
          </div>
          {wishes.length > 1 && (
            <div className={styles.arrows}>
              <IconButton
                icon="chevronLeft"
                tone="light"
                label={t('wishes.prev')}
                disabled={edges.start}
                onClick={() => scrollByCard(-1)}
              />
              <IconButton
                icon="chevronRight"
                tone="light"
                label={t('wishes.next')}
                disabled={edges.end}
                onClick={() => scrollByCard(1)}
              />
            </div>
          )}
        </div>

        {wishes.length === 0 ? (
          <p className={styles.empty}>{t('book.empty')}</p>
        ) : (
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
                <p className={styles.message}>{wish.message}</p>
                <div className={styles.meta}>
                  <span className={styles.who}>
                    {wish.author} · {formatDate(dayKey(wish.created_at), lang)}
                  </span>
                  {wish.mine && (
                    <button type="button" className={styles.delete} onClick={() => remove(wish.id)}>
                      {t('book.delete')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className={styles.write}>
          <a href="#guestbook">{t('wishes.write')} →</a>
        </p>
      </div>
    </section>
  )
}
