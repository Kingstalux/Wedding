import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ButtonLink } from '../../components/Button'
import { Switch } from '../../components/Form'
import { useToast } from '../../components/Toast'
import { supabase } from '../../lib/supabase'
import { formatShortDateTime } from '../../lib/time'
import { studioErrorMessage } from '../queries'
import studio from '../studio.module.css'
import styles from './GuestsPage.module.css'

const giftsKey = ['admin', 'gifts'] as const

const METHOD_LABEL = { momo: 'MTN MoMo', orange: 'Orange Money', cash: 'Cash at the reception' }

const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`

/** Gifts guests told the couple about, with a "Received" tick after checking the account. */
export function GiftsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const gifts = useQuery({
    queryKey: giftsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_announcements')
        .select('id, method, amount_fcfa, message, received, created_at, guests(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const setReceived = useMutation({
    mutationFn: async ({ id, received }: { id: string; received: boolean }) => {
      const { error } = await supabase.from('gift_announcements').update({ received }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: giftsKey }),
    onError: (err) => toast(studioErrorMessage(err), 'error'),
  })

  const list = gifts.data ?? []
  const totals = (['momo', 'orange', 'cash'] as const).map((method) => {
    const items = list.filter((g) => g.method === method)
    return {
      method,
      count: items.length,
      announced: items.reduce((sum, g) => sum + (g.amount_fcfa ?? 0), 0),
      received: items.filter((g) => g.received).reduce((sum, g) => sum + (g.amount_fcfa ?? 0), 0),
    }
  })

  return (
    <>
      <div className={studio.pageHead}>
        <div>
          <h1 className="display">Gifts</h1>
          <p>
            Guests only announce gifts here. Check your MoMo / Orange Money account, then tick
            “Received”.
          </p>
        </div>
        <ButtonLink to="/admin/site" variant="ghost">
          Edit numbers &amp; options
        </ButtonLink>
      </div>

      <section className={styles.stats} aria-label="Totals">
        {totals.map((t) => (
          <div key={t.method} className={styles.stat}>
            <strong>{t.count}</strong>
            <span>{METHOD_LABEL[t.method]}</span>
            {t.announced > 0 && (
              <p className={studio.hint} style={{ marginTop: 6 }}>
                Announced {fcfa(t.announced)}
                <br />
                Received {fcfa(t.received)}
              </p>
            )}
          </div>
        ))}
      </section>

      {gifts.isPending && <p className={studio.loading}>Loading…</p>}
      {gifts.isError && <p className={studio.error}>{studioErrorMessage(gifts.error)}</p>}

      {gifts.isSuccess && (
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th scope="col">Guest</th>
                <th scope="col">Sent via</th>
                <th scope="col">Amount</th>
                <th scope="col">Message</th>
                <th scope="col">Received</th>
              </tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id}>
                  <td>
                    <span className={styles.name}>{g.guests?.name ?? 'Removed guest'}</span>
                    <span className={styles.sub}>{formatShortDateTime(g.created_at)}</span>
                  </td>
                  <td>{METHOD_LABEL[g.method]}</td>
                  <td>
                    {g.amount_fcfa ? (
                      fcfa(g.amount_fcfa)
                    ) : (
                      <span className={styles.sub}>Not given</span>
                    )}
                  </td>
                  <td>{g.message || <span className={styles.sub}>—</span>}</td>
                  <td>
                    <Switch
                      label={<span className="sr-only">Received</span>}
                      checked={g.received}
                      onChange={(e) => setReceived.mutate({ id: g.id, received: e.target.checked })}
                    />
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.sub} style={{ padding: '28px 16px' }}>
                    No gifts announced yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
