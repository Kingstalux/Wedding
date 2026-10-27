import { useState } from 'react'
import { ButtonLink } from '../../components/Button'
import { Switch, TextAreaField, TextField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { fromLocalInput, toLocalInput } from '../../lib/time'
import { MediaField } from '../components/MediaField'
import { SaveBar } from '../components/SaveBar'
import {
  studioErrorMessage,
  usePreviewLink,
  useSettings,
  useUpdateSettings,
  type SettingsPatch,
  type SettingsRow,
} from '../queries'
import styles from '../studio.module.css'

/** The text fields edited on this page (photos and the song save separately). */
type Draft = {
  bride: string
  groom: string
  city: string
  countdown: string // datetime-local, Douala time
  rsvp_deadline: string // YYYY-MM-DD or ''
  word_en: string
  word_fr: string
  show_word: boolean
  dress_en: string
  dress_fr: string
  show_dress: boolean
  show_gifts: boolean
  momo_number: string
  momo_name: string
  om_number: string
  om_name: string
  show_gift_box: boolean
  gift_box_note_en: string
  gift_box_note_fr: string
  music_title: string
  wa_template_en: string
  wa_template_fr: string
}

function toDraft(s: SettingsRow): Draft {
  return {
    bride: s.bride,
    groom: s.groom,
    city: s.city,
    countdown: toLocalInput(s.countdown_at),
    rsvp_deadline: s.rsvp_deadline ?? '',
    word_en: s.word_en,
    word_fr: s.word_fr,
    show_word: s.show_word,
    dress_en: s.dress_en,
    dress_fr: s.dress_fr,
    show_dress: s.show_dress,
    show_gifts: s.show_gifts,
    momo_number: s.momo_number ?? '',
    momo_name: s.momo_name ?? '',
    om_number: s.om_number ?? '',
    om_name: s.om_name ?? '',
    show_gift_box: s.show_gift_box,
    gift_box_note_en: s.gift_box_note_en,
    gift_box_note_fr: s.gift_box_note_fr,
    music_title: s.music_title ?? '',
    wa_template_en: s.wa_template_en,
    wa_template_fr: s.wa_template_fr,
  }
}

function toPatch(d: Draft): SettingsPatch {
  const orNull = (v: string) => v.trim() || null
  return {
    bride: d.bride.trim(),
    groom: d.groom.trim(),
    city: d.city.trim(),
    countdown_at: fromLocalInput(d.countdown) ?? undefined,
    rsvp_deadline: d.rsvp_deadline || null,
    word_en: d.word_en.trim(),
    word_fr: d.word_fr.trim(),
    show_word: d.show_word,
    dress_en: d.dress_en.trim(),
    dress_fr: d.dress_fr.trim(),
    show_dress: d.show_dress,
    show_gifts: d.show_gifts,
    momo_number: orNull(d.momo_number),
    momo_name: orNull(d.momo_name),
    om_number: orNull(d.om_number),
    om_name: orNull(d.om_name),
    show_gift_box: d.show_gift_box,
    gift_box_note_en: d.gift_box_note_en.trim(),
    gift_box_note_fr: d.gift_box_note_fr.trim(),
    music_title: orNull(d.music_title),
    wa_template_en: d.wa_template_en.trim(),
    wa_template_fr: d.wa_template_fr.trim(),
  }
}

export function SitePage() {
  const settings = useSettings()
  if (settings.isPending) return <p className={styles.loading}>Loading…</p>
  if (settings.isError) return <p className={styles.error}>{studioErrorMessage(settings.error)}</p>
  // Mount the form only once the row is loaded, so its first draft is the saved values.
  return <SiteForm settings={settings.data} />
}

function SiteForm({ settings }: { settings: SettingsRow }) {
  const toast = useToast()
  const update = useUpdateSettings()
  const preview = usePreviewLink().data
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings))
  const [error, setError] = useState<string | null>(null)

  const saved = toDraft(settings)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  // Typed helpers so each input only needs its field name.
  const text = (field: keyof Draft) => ({
    value: draft[field] as string,
    onChange: (e: { target: { value: string } }) =>
      setDraft((d) => ({ ...d, [field]: e.target.value })),
  })
  const toggle = (field: keyof Draft) => ({
    checked: draft[field] as boolean,
    onChange: (e: { target: { checked: boolean } }) =>
      setDraft((d) => ({ ...d, [field]: e.target.checked })),
  })

  async function save() {
    if (!draft.countdown) return setError('Please set the date and time the countdown leads to.')
    setError(null)
    try {
      const row = await update.mutateAsync(toPatch(draft))
      setDraft(toDraft(row))
      toast('Saved — the site is updated')
    } catch (err) {
      setError(studioErrorMessage(err))
    }
  }

  // Photos and the song are saved the moment they're uploaded.
  const saveMedia =
    (column: 'hero_path' | 'word_photo_path' | 'music_path') => (path: string | null) =>
      update.mutateAsync({ [column]: path })

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className="display">Site &amp; texts</h1>
          <p>
            Photos, names, the word from the couple, dress code, gifts, music and WhatsApp texts.
          </p>
        </div>
        {preview && (
          <ButtonLink href={preview} target="_blank" rel="noopener" variant="ghost">
            Preview the site <Icon name="external" />
          </ButtonLink>
        )}
      </div>

      <section className={styles.card} aria-labelledby="hero-title">
        <h2 id="hero-title">Landing photo</h2>
        <p className={styles.lede} style={{ marginBottom: 20 }}>
          The large photo behind your names on the first screen. Landscape works best.
        </p>
        <MediaField
          kind="photo"
          folder="hero"
          path={settings.hero_path}
          onSave={saveMedia('hero_path')}
          shape="hero"
          names={{ bride: draft.bride, groom: draft.groom }}
          placeholder="Landing photo"
        />
      </section>

      <section className={styles.card} aria-labelledby="couple-title">
        <h2 id="couple-title">The couple</h2>
        <p className={styles.lede} style={{ marginBottom: 20 }}>
          Shown in the header, the opening screen, the signature and the WhatsApp message.
        </p>
        <div className={styles.grid3}>
          <TextField look="box" label="Bride’s name" placeholder="e.g. Amina" {...text('bride')} />
          <TextField look="box" label="Groom’s name" placeholder="e.g. Joël" {...text('groom')} />
          <TextField
            look="box"
            label="City"
            placeholder="e.g. Yaoundé, Cameroon"
            {...text('city')}
          />
          <TextField
            look="box"
            label="Countdown to (Cameroon time)"
            type="datetime-local"
            {...text('countdown')}
          />
          <TextField
            look="box"
            label="Please reply by"
            type="date"
            hint="Shown in the RSVP section. Guests can still reply until the day."
            {...text('rsvp_deadline')}
          />
        </div>
      </section>

      <section className={styles.card} aria-labelledby="word-title">
        <div className={styles.cardHead}>
          <div>
            <h2 id="word-title">A word from the couple</h2>
            <p className={styles.lede}>
              Write {'{guest name}'} where each guest’s own name should appear.
            </p>
          </div>
          <Switch
            label={draft.show_word ? 'Shown on the site' : 'Hidden from the site'}
            {...toggle('show_word')}
          />
        </div>
        <div className={draft.show_word ? styles.grid2 : `${styles.grid2} ${styles.dimmed}`}>
          <TextAreaField
            look="box"
            label="English"
            rows={7}
            placeholder="Dear {guest name}, thank you for being part of our story…"
            {...text('word_en')}
          />
          <TextAreaField
            look="box"
            label="Français"
            rows={7}
            placeholder="Cher(e) {nom de l’invité}, merci de faire partie de notre histoire…"
            {...text('word_fr')}
          />
        </div>
        <h3>Photo beside the word</h3>
        <MediaField
          kind="photo"
          folder="word"
          path={settings.word_photo_path}
          onSave={saveMedia('word_photo_path')}
          shape="portrait"
          tone="forest"
          placeholder="Couple photo"
        />
      </section>

      <section className={styles.card} aria-labelledby="dress-title">
        <div className={styles.cardHead}>
          <div>
            <h2 id="dress-title">Dress code</h2>
            <p className={styles.lede}>The wedding colours appear as swatches under this text.</p>
          </div>
          <Switch
            label={draft.show_dress ? 'Shown on the site' : 'Hidden from the site'}
            {...toggle('show_dress')}
          />
        </div>
        <div className={draft.show_dress ? styles.grid2 : `${styles.grid2} ${styles.dimmed}`}>
          <TextAreaField
            look="box"
            label="English"
            placeholder="e.g. Elegant formal attire, in our wedding colours…"
            {...text('dress_en')}
          />
          <TextAreaField
            look="box"
            label="Français"
            placeholder="ex. Tenue de soirée élégante, aux couleurs du mariage…"
            {...text('dress_fr')}
          />
        </div>
        <div className={styles.swatches} aria-label="Wedding colours">
          <span>
            <i style={{ background: 'var(--navy)' }} />
            Midnight navy
          </span>
          <span>
            <i style={{ background: 'var(--slate)' }} />
            Slate blue
          </span>
          <span>
            <i style={{ background: 'var(--forest)' }} />
            Forest green
          </span>
          <span>
            <i style={{ background: 'var(--emerald)' }} />
            Emerald
          </span>
          <span>
            <i style={{ background: 'var(--gold)' }} />
            Gold
          </span>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="gifts-title">
        <div className={styles.cardHead}>
          <div>
            <h2 id="gifts-title">Cash gifts</h2>
            <p className={styles.lede}>
              The last section of the guest page. Leave a number empty to hide that option.
            </p>
          </div>
          <Switch
            label={draft.show_gifts ? 'Shown on the site' : 'Hidden from the site'}
            {...toggle('show_gifts')}
          />
        </div>
        <div className={draft.show_gifts ? styles.grid2 : `${styles.grid2} ${styles.dimmed}`}>
          <TextField
            look="box"
            label="MTN MoMo number"
            inputMode="tel"
            placeholder="+237 6XX XX XX XX"
            {...text('momo_number')}
          />
          <TextField
            look="box"
            label="MTN MoMo account name"
            placeholder="Name guests see when sending"
            {...text('momo_name')}
          />
          <TextField
            look="box"
            label="Orange Money number"
            inputMode="tel"
            placeholder="+237 6XX XX XX XX"
            {...text('om_number')}
          />
          <TextField
            look="box"
            label="Orange Money account name"
            placeholder="Name guests see when sending"
            {...text('om_name')}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <Switch label="Show “Gift box at the reception”" {...toggle('show_gift_box')} />
        </div>
        {draft.show_gift_box && (
          <div className={styles.grid2} style={{ marginTop: 12 }}>
            <TextAreaField
              look="box"
              label="Gift box note (English)"
              rows={2}
              placeholder="e.g. Saturday 26 December · Bansoa Hall…"
              {...text('gift_box_note_en')}
            />
            <TextAreaField
              look="box"
              label="Gift box note (Français)"
              rows={2}
              placeholder="ex. Samedi 26 décembre · Salle Bansoa…"
              {...text('gift_box_note_fr')}
            />
          </div>
        )}
      </section>

      <section className={styles.card} aria-labelledby="music-title">
        <h2 id="music-title">Music</h2>
        <p className={styles.lede} style={{ marginBottom: 20 }}>
          Plays softly once a guest opens the invitation. Guests can pause it any time. MP3 works on
          every phone.
        </p>
        <MediaField
          kind="audio"
          folder="music"
          path={settings.music_path}
          onSave={saveMedia('music_path')}
        />
        <div style={{ marginTop: 18, maxWidth: 420 }}>
          <TextField
            look="box"
            label="Song title (shown on the opening screen)"
            placeholder="e.g. The Best Part of You — Savvy"
            {...text('music_title')}
          />
        </div>
      </section>

      <section className={styles.card} aria-labelledby="wa-title">
        <h2 id="wa-title">WhatsApp invitation text</h2>
        <p className={styles.lede} style={{ marginBottom: 20 }}>
          Each guest gets the version in their language. Placeholders: {'{name}'} {'{bride}'}{' '}
          {'{groom}'} {'{link}'}. Keep {'{link}'} so the guest receives their private link.
        </p>
        <div className={styles.grid2}>
          <TextAreaField
            look="box"
            label="English"
            rows={5}
            placeholder="Dear {name}, {bride} & {groom} invite you… Open your invitation: {link}"
            {...text('wa_template_en')}
          />
          <TextAreaField
            look="box"
            label="Français"
            rows={5}
            placeholder="Cher(e) {name}, {bride} & {groom} vous invitent… Votre invitation : {link}"
            {...text('wa_template_fr')}
          />
        </div>
      </section>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <SaveBar
        dirty={dirty}
        saving={update.isPending}
        onSave={save}
        onDiscard={() => setDraft(saved)}
      />
    </>
  )
}
