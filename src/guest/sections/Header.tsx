import { useEffect, useRef, useState } from 'react'
import { IconButton } from '../../components/IconButton'
import { Icon } from '../../components/Icon'
import { Monogram } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import type { MessageKey } from '../../i18n/en'
import { cx } from '../../lib/cx'
import { useInvitation } from '../InvitationProvider'
import type { Music } from '../useMusic'
import styles from './Header.module.css'

type Props = { music: Music }

export function Header({ music }: Props) {
  const { t, lang, setLang } = useT()
  const { content } = useInvitation()
  const { settings } = content
  const [solid, setSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Switch to the solid emerald bar once the hero has scrolled away.
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile menu: move focus into it, close on Escape, stop the page scrolling behind it.
  useEffect(() => {
    if (!menuOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  // Sections the couple switched off don't appear in the menu.
  const links: Array<[string, MessageKey, boolean]> = [
    ['#top', 'nav.home', true],
    ['#word', 'nav.word', settings.show_word],
    ['#schedule', 'nav.schedule', content.events.length > 0],
    ['#dresscode', 'nav.dress', settings.show_dress],
    ['#gallery', 'nav.gallery', settings.show_gallery && content.gallery.length > 0],
    ['#rsvp', 'nav.rsvp', true],
    ['#guestbook', 'nav.book', settings.show_wishes],
    ['#gifts', 'nav.gifts', settings.show_gifts],
  ]

  return (
    <header className={cx(styles.header, solid && styles.solid)}>
      <a className={styles.monogram} href="#top" aria-label={t('nav.top')}>
        <Monogram bride={settings.bride} groom={settings.groom} />
      </a>

      <nav className={cx(styles.nav, menuOpen && styles.navOpen)} aria-label={t('nav.label')}>
        <IconButton
          ref={closeRef}
          className={styles.closeButton}
          icon="close"
          label={t('nav.close')}
          tone="light"
          onClick={() => setMenuOpen(false)}
        />
        {links
          .filter(([, , visible]) => visible)
          .map(([href, key]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {t(key)}
            </a>
          ))}
      </nav>

      <div className={styles.tools}>
        <div className={styles.lang} role="group" aria-label={t('lang.label')}>
          {(['en', 'fr'] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        {music.available && (
          <button
            type="button"
            className={styles.musicButton}
            onClick={music.toggle}
            aria-label={music.playing ? t('music.pause') : t('music.play')}
            title={settings.music_title ?? undefined}
          >
            {music.playing ? (
              <span className={styles.eq} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            ) : (
              <Icon name="music" />
            )}
          </button>
        )}

        <IconButton
          className={styles.menuButton}
          icon="menu"
          label={t('nav.open')}
          tone="light"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        />
      </div>
    </header>
  )
}
