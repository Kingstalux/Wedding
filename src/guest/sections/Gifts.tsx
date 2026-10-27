import { useState } from 'react'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { copyText } from '../../lib/clipboard'
import { cx } from '../../lib/cx'
import { useInvitation } from '../InvitationProvider'
import styles from './Gifts.module.css'

function CopyButton({ text }: { text: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await copyText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }}
    >
      {copied ? (
        <>
          <Icon name="check" /> {t('gift.copied')}
        </>
      ) : (
        t('gift.copy')
      )}
    </Button>
  )
}

/** How to send a cash gift: MoMo, Orange Money and/or the gift box. */
export function Gifts() {
  const { t, pick } = useT()
  const { settings } = useInvitation().content
  if (!settings.show_gifts) return null

  // Only the options the couple filled in are shown.
  const ways: Array<{ key: string; label: string; number?: string; name?: string | null }> = []
  if (settings.momo_number)
    ways.push({
      key: 'momo',
      label: t('gift.momo'),
      number: settings.momo_number,
      name: settings.momo_name,
    })
  if (settings.om_number)
    ways.push({
      key: 'orange',
      label: t('gift.orange'),
      number: settings.om_number,
      name: settings.om_name,
    })
  if (settings.show_gift_box) ways.push({ key: 'cash', label: t('gift.cash') })
  if (ways.length === 0) return null

  return (
    <section id="gifts" className={styles.gifts} aria-labelledby="gifts-title">
      <div className="container">
        <div className={styles.intro}>
          <Eyebrow>{t('gift.eyebrow')}</Eyebrow>
          <h2 id="gifts-title" className="display h2">
            {t('gift.title')}
          </h2>
          <Rule center />
          <p className={`serif-body ${styles.lede}`}>{t('gift.lede')}</p>
        </div>

        <ul className={styles.ways}>
          {ways.map((way) => (
            <li key={way.key} className={styles.way}>
              <p className={styles.label}>{way.label}</p>
              {way.number ? (
                <>
                  <p className={styles.number}>{way.number}</p>
                  <p className={styles.note}>
                    {way.name && t('gift.accountName', { name: way.name })}
                  </p>
                  <CopyButton text={way.number} />
                </>
              ) : (
                <>
                  <p className={cx(styles.number, styles.numberSmall)}>{t('gift.box')}</p>
                  <p className={styles.note}>
                    {pick(settings.gift_box_note_en, settings.gift_box_note_fr)}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
