import { useState } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { GiftDialog, useGiftWays } from '../GiftDialog'
import { useInvitation } from '../InvitationProvider'
import styles from './Gifts.module.css'

/**
 * "A Gift From the Heart": a few words, then the gift list (its own page) or,
 * without a list, the popup to send money.
 */
export function Gifts() {
  const { t } = useT()
  const { token, content } = useInvitation()
  const { settings, registryCount } = content
  const ways = useGiftWays(settings)
  const [open, setOpen] = useState(false)

  const hasList = registryCount > 0
  if (!settings.show_gifts || (!hasList && ways.length === 0)) return null

  return (
    <section
      id="gifts"
      data-reveal=""
      className={`on-dark ${styles.gifts}`}
      aria-labelledby="gifts-title"
    >
      <div className={`container ${styles.intro}`}>
        <Eyebrow>{t('gift.eyebrow')}</Eyebrow>
        <h2 id="gifts-title" className="display h2">
          {t('gift.title')}
        </h2>
        <Rule center />
        <p className={`serif-body ${styles.lede}`}>
          {hasList ? t('gift.lede') : t('gift.ledeMoney')}
        </p>
        {hasList ? (
          <>
            <ButtonLink variant="gold" to={`/i/${token}/gifts`}>
              {t('gift.browse')}
            </ButtonLink>
            {ways.length > 0 && (
              <button type="button" className={styles.alt} onClick={() => setOpen(true)}>
                {t('gift.orSendMoney')}
              </button>
            )}
          </>
        ) : (
          <Button variant="gold" onClick={() => setOpen(true)}>
            {t('gift.open')}
          </Button>
        )}
      </div>
      <GiftDialog open={open} onClose={() => setOpen(false)} />
    </section>
  )
}
