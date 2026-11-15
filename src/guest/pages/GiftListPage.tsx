import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { useConfirm } from '../../components/Confirm'
import { Icon } from '../../components/Icon'
import { Photo } from '../../components/Photo'
import { useToast } from '../../components/Toast'
import { Eyebrow, Rule } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { cx } from '../../lib/cx'
import * as api from '../api'
import { GiftDialog, useGiftWays } from '../GiftDialog'
import { useInvitation } from '../InvitationProvider'
import type { RegistryGift } from '../types'
import styles from './GiftListPage.module.css'

/**
 * Route: /i/:token/gifts. The couple's gift list: guests reserve what they
 * plan to bring (others only see that it's taken), or send money instead.
 */
export function GiftListPage() {
  const { t, pick } = useT()
  const { token, content } = useInvitation()
  const { settings } = content
  const ways = useGiftWays(settings)
  const confirm = useConfirm()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [category, setCategory] = useState('')
  const [moneyOpen, setMoneyOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const queryKey = ['registry', token]
  const registry = useQuery({ queryKey, queryFn: () => api.loadRegistry(token) })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const gifts = registry.data ?? []
  const title = (g: RegistryGift) => pick(g.title_en, g.title_fr)
  const categoryOf = (g: RegistryGift) => pick(g.category_en, g.category_fr).trim()
  const categories = [...new Set(gifts.map(categoryOf).filter(Boolean))]
  const shown = category ? gifts.filter((g) => categoryOf(g) === category) : gifts

  async function act(gift: RegistryGift, reserve: boolean) {
    const name = title(gift)
    const ok = await confirm(
      reserve
        ? {
            title: t('registry.confirmTitle', { gift: name }),
            message: t('registry.confirmBody'),
            confirmLabel: t('registry.confirm'),
            cancelLabel: t('common.cancel'),
          }
        : {
            title: t('registry.cancelTitle', { gift: name }),
            message: t('registry.cancelBody'),
            confirmLabel: t('registry.cancelConfirm'),
            cancelLabel: t('registry.keep'),
            danger: true,
          },
    )
    if (!ok) return
    setBusy(gift.id)
    try {
      if (reserve) await api.reserveGift(token, gift.id)
      else await api.cancelGiftReservation(token, gift.id)
      toast(reserve ? t('registry.reserved', { gift: name }) : t('registry.cancelled'))
    } catch (err) {
      toast(t(api.errorMessageKey(err)), 'error')
    } finally {
      // Taken or not, show the list as it is now.
      await queryClient.invalidateQueries({ queryKey })
      setBusy(null)
    }
  }

  return (
    <div className={`on-dark ${styles.page}`}>
      <main className={styles.wrap}>
        <Link className={styles.back} to={`/i/${token}#gifts`}>
          <Icon name="chevronLeft" size={14} /> {t('registry.back')}
        </Link>

        <header className={styles.head}>
          <Eyebrow>{t('registry.eyebrow')}</Eyebrow>
          <h1 className="display h2">{t('registry.title')}</h1>
          <Rule center />
          <p className={`serif-body ${styles.lede}`}>{t('registry.lede')}</p>
        </header>

        {ways.length > 0 && (
          <div className={styles.money}>
            <span className={styles.moneyIcon} aria-hidden="true">
              <Icon name="gift" />
            </span>
            <p>{t('registry.money')}</p>
            <Button variant="ghostLight" onClick={() => setMoneyOpen(true)}>
              {t('registry.sendMoney')}
            </Button>
          </div>
        )}

        {categories.length > 1 && (
          <div className={styles.chips} role="group" aria-label={t('registry.filter')}>
            {['', ...categories].map((c) => (
              <button
                key={c || 'all'}
                type="button"
                className={styles.chip}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c || t('registry.all')}
              </button>
            ))}
          </div>
        )}

        {registry.isPending && <p className={styles.status}>{t('common.loading')}</p>}
        {registry.isError && <p className={styles.status}>{t('registry.loadError')}</p>}
        {registry.isSuccess && gifts.length === 0 && (
          <p className={styles.status}>{t('registry.empty')}</p>
        )}

        <ul className={styles.grid}>
          {shown.map((gift) => {
            const taken = gift.reserved && !gift.mine
            return (
              <li key={gift.id} className={cx(styles.card, taken && styles.taken)}>
                <Photo className={styles.photo} src={gift.photo_url} tone="slate" />
                <div className={styles.body}>
                  {categoryOf(gift) && <p className={styles.category}>{categoryOf(gift)}</p>}
                  <h2 className={styles.title}>{title(gift)}</h2>
                  {pick(gift.description_en, gift.description_fr) && (
                    <p className={styles.description}>
                      {pick(gift.description_en, gift.description_fr)}
                    </p>
                  )}
                  <div className={styles.action}>
                    {gift.mine ? (
                      <p className={styles.mine}>
                        <Icon name="check" size={16} /> {t('registry.mine')}
                        <button
                          type="button"
                          className={styles.cancel}
                          disabled={busy === gift.id}
                          onClick={() => act(gift, false)}
                        >
                          {t('registry.cancel')}
                          <span className="sr-only"> · {title(gift)}</span>
                        </button>
                      </p>
                    ) : taken ? (
                      <p className={styles.takenText}>{t('registry.taken')}</p>
                    ) : (
                      <Button
                        variant="gold"
                        size="sm"
                        loading={busy === gift.id}
                        onClick={() => act(gift, true)}
                      >
                        {t('registry.select')}
                        <span className="sr-only"> · {title(gift)}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </main>
      <GiftDialog open={moneyOpen} onClose={() => setMoneyOpen(false)} />
    </div>
  )
}
