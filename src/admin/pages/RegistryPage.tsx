import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { useConfirm } from '../../components/Confirm'
import { Dialog, DialogActions } from '../../components/Dialog'
import { TextAreaField, TextField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../components/IconButton'
import { Photo } from '../../components/Photo'
import { useToast } from '../../components/Toast'
import { fullNames } from '../../lib/guestNames'
import { mediaUrl } from '../../lib/media'
import { formatShortDateTime } from '../../lib/time'
import { removeMedia, uploadPhotoBlob } from '../../lib/upload'
import { PhotoEditorDialog } from '../components/photo/PhotoEditorDialog'
import { Pager } from '../components/Pager'
import { paginate } from '../paging'
import { studioErrorMessage } from '../queries'
import {
  useDeleteGift,
  useFreeGift,
  useRegistry,
  useSaveGift,
  useSwapGifts,
  type GiftInput,
  type RegistryGift,
} from '../registry'
import studio from '../studio.module.css'
import styles from './RegistryPage.module.css'

const GIFTS_PER_PAGE = 10

/*
 * "Gift list": the things the couple would love. Guests reserve a gift on
 * their invitation; here the couple adds, edits and orders the gifts, and
 * sees who reserved what.
 */
export function RegistryPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const registry = useRegistry()
  const removeGift = useDeleteGift()
  const freeGift = useFreeGift()
  const swap = useSwapGifts()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<RegistryGift | 'new' | null>(null)

  const list = registry.data ?? []
  const reserved = list.filter((g) => g.gift_reservations).length
  const paged = paginate(list, page, GIFTS_PER_PAGE)
  // The gift being edited, kept up to date after saves (e.g. a new photo).
  const current =
    editing && editing !== 'new' ? (list.find((g) => g.id === editing.id) ?? editing) : null

  async function remove(gift: RegistryGift) {
    const ok = await confirm({
      title: `Delete “${gift.title_en}”?`,
      message: gift.gift_reservations
        ? 'A guest has reserved this gift. It disappears from their list too.'
        : 'It disappears from the gift list straight away.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await removeGift.mutateAsync(gift)
      toast('Gift deleted')
    } catch (err) {
      toast(studioErrorMessage(err), 'error')
    }
  }

  async function free(gift: RegistryGift) {
    const ok = await confirm({
      title: `Free “${gift.title_en}”?`,
      message: 'The guest’s reservation is removed and other guests can choose it again.',
      confirmLabel: 'Free this gift',
    })
    if (!ok) return
    try {
      await freeGift.mutateAsync(gift.id)
      toast('The gift is available again')
    } catch (err) {
      toast(studioErrorMessage(err), 'error')
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const a = list[Math.min(index, index + direction)]
    const b = list[Math.max(index, index + direction)]
    try {
      await swap.mutateAsync([a, b])
    } catch (err) {
      toast(studioErrorMessage(err), 'error')
    }
  }

  return (
    <>
      <div className={studio.pageHead}>
        <div>
          <h1 className="display">Gift list</h1>
          <p>
            Things you would love. Guests reserve a gift on their invitation; others then see it as
            taken, never by whom.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Icon name="plus" /> Add a gift
        </Button>
      </div>

      {registry.isPending && <p className={studio.loading}>Loading the gift list…</p>}
      {registry.isError && <p className={studio.error}>{studioErrorMessage(registry.error)}</p>}

      {registry.isSuccess && (
        <section className={studio.card} aria-labelledby="registry-title">
          <div className={studio.cardHead}>
            <h2 id="registry-title">
              {list.length === 1 ? '1 gift' : `${list.length} gifts`} · {reserved} reserved
            </h2>
          </div>
          {list.length === 0 ? (
            <p className="muted">
              No gifts yet. Until you add one, the invitation shows only the money options.
            </p>
          ) : (
            <ul className={styles.list}>
              {paged.items.map((gift) => {
                const index = list.indexOf(gift)
                const res = gift.gift_reservations
                return (
                  <li key={gift.id} className={styles.row}>
                    <Photo
                      className={styles.thumb}
                      src={mediaUrl(gift.photo_path)}
                      label="No photo"
                    />
                    <div className={styles.info}>
                      {gift.category_en && <p className={styles.category}>{gift.category_en}</p>}
                      <p className={styles.title}>{gift.title_en}</p>
                      {res ? (
                        <p className={styles.reserved}>
                          Reserved by{' '}
                          <strong>
                            {res.guests
                              ? fullNames(res.guests.name, res.guests.partner_name)
                              : 'a removed guest'}
                          </strong>{' '}
                          · {formatShortDateTime(res.created_at)}
                          <button type="button" className={styles.free} onClick={() => free(gift)}>
                            Free this gift
                          </button>
                        </p>
                      ) : (
                        <p className={styles.available}>Available</p>
                      )}
                    </div>
                    <div className={styles.actions}>
                      <IconButton
                        icon="chevronLeft"
                        size="sm"
                        className={styles.up}
                        label={`Move ${gift.title_en} up`}
                        disabled={index === 0 || swap.isPending}
                        onClick={() => move(index, -1)}
                      />
                      <IconButton
                        icon="chevronRight"
                        size="sm"
                        className={styles.down}
                        label={`Move ${gift.title_en} down`}
                        disabled={index === list.length - 1 || swap.isPending}
                        onClick={() => move(index, 1)}
                      />
                      <IconButton
                        icon="edit"
                        size="sm"
                        label={`Edit ${gift.title_en}`}
                        onClick={() => setEditing(gift)}
                      />
                      <IconButton
                        icon="trash"
                        size="sm"
                        label={`Delete ${gift.title_en}`}
                        onClick={() => remove(gift)}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <Pager
            page={paged.page}
            pageCount={paged.pageCount}
            onPage={setPage}
            label={`Gifts ${paged.from}–${paged.to} of ${paged.total}`}
          />
        </section>
      )}

      {editing && (
        <GiftDialog
          gift={current}
          nextSort={list.reduce((max, g) => Math.max(max, g.sort), 0) + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

const EMPTY: GiftInput = {
  title_en: '',
  title_fr: '',
  description_en: '',
  description_fr: '',
  category_en: '',
  category_fr: '',
}

type CroppedPhoto = { blob: Blob; width: number; height: number; url: string }

/**
 * Add or edit a gift, photo included: the chosen photo is cropped first and
 * uploaded only when the couple presses Add / Save.
 */
function GiftDialog({
  gift,
  nextSort,
  onClose,
}: {
  gift: RegistryGift | null
  nextSort: number
  onClose: () => void
}) {
  const toast = useToast()
  const save = useSaveGift()
  const fileRef = useRef<HTMLInputElement>(null)
  // The file being cropped, then the cropped photo waiting to be uploaded.
  const [cropping, setCropping] = useState<File | null>(null)
  const [photo, setPhoto] = useState<CroppedPhoto | null>(null)
  // true when the couple removed the current photo
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<GiftInput>(() =>
    gift
      ? {
          title_en: gift.title_en,
          title_fr: gift.title_fr,
          description_en: gift.description_en,
          description_fr: gift.description_fr,
          category_en: gift.category_en,
          category_fr: gift.category_fr,
        }
      : EMPTY,
  )
  const [error, setError] = useState<string | null>(null)

  // The cropped photo is shown from memory until it's uploaded; free that copy
  // when it's replaced or the dialog closes.
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url)
    },
    [photo],
  )

  const shownPhoto = photo?.url ?? (photoRemoved ? null : mediaUrl(gift?.photo_path))

  function chooseFile(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = ''
    if (file) setCropping(file)
  }

  const field = (key: keyof GiftInput) => ({
    value: draft[key],
    onChange: (e: { target: { value: string } }) =>
      setDraft((d) => ({ ...d, [key]: e.target.value })),
  })

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!draft.title_en.trim()) return setError('Give the gift a name (in English at least).')
    setError(null)
    const input = Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [k, v.trim()]),
    ) as GiftInput
    setSaving(true)
    let uploaded: string | null = null
    try {
      if (photo) uploaded = (await uploadPhotoBlob('gifts', photo)).path
      const oldPath = gift?.photo_path ?? null
      const photoChanged = Boolean(photo) || photoRemoved
      const photoField = photoChanged ? { photo_path: uploaded } : {}
      await save.mutateAsync(
        gift
          ? { ...input, ...photoField, id: gift.id }
          : { ...input, ...photoField, sort: nextSort },
      )
      // The previous photo is no longer used.
      if (photoChanged) await removeMedia(oldPath)
      toast(gift ? 'Gift saved' : 'Gift added')
      onClose()
    } catch (err) {
      // Don't leave an unused upload behind.
      await removeMedia(uploaded)
      setError(studioErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open title={gift ? 'Edit gift' : 'Add a gift'} onClose={onClose} wide>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.photoField}>
          <Photo className={styles.photoPreview} src={shownPhoto} label="No photo yet" />
          <div className={styles.photoButtons}>
            <p className={styles.formLabel}>Photo</p>
            {/* A real file input, visually hidden, opened by the button below */}
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose a photo of the gift"
              onChange={(e) => chooseFile(e.target.files?.[0])}
            />
            <div className={styles.photoActions}>
              <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
                {shownPhoto ? 'Replace photo' : 'Choose a photo'}
              </Button>
              {shownPhoto && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPhoto(null)
                    setPhotoRemoved(true)
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className={studio.hint}>
              JPG, PNG or WebP. You can crop it next; it&rsquo;s saved with the gift.
            </p>
          </div>
        </div>
        <div className={studio.grid2}>
          <TextField look="box" label="Name (English)" maxLength={120} {...field('title_en')} />
          <TextField
            look="box"
            label="Name (French, optional)"
            maxLength={120}
            {...field('title_fr')}
          />
          <TextAreaField
            look="box"
            label="Description (English)"
            rows={3}
            maxLength={400}
            {...field('description_en')}
          />
          <TextAreaField
            look="box"
            label="Description (French, optional)"
            rows={3}
            maxLength={400}
            {...field('description_fr')}
          />
          <TextField
            look="box"
            label="Category (English)"
            placeholder="e.g. Kitchen"
            hint="Gifts with the same category are grouped in a filter."
            maxLength={40}
            {...field('category_en')}
          />
          <TextField
            look="box"
            label="Category (French, optional)"
            placeholder="ex. Cuisine"
            maxLength={40}
            {...field('category_fr')}
          />
        </div>
        {error && (
          <p className={studio.error} role="alert">
            {error}
          </p>
        )}
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {gift ? 'Save' : 'Add gift'}
          </Button>
        </DialogActions>
      </form>
      {cropping && (
        <PhotoEditorDialog
          file={cropping}
          shape="gift"
          onCancel={() => setCropping(null)}
          onSave={async (cropped) => {
            setPhoto({ ...cropped, url: URL.createObjectURL(cropped.blob) })
            setPhotoRemoved(false)
            setCropping(null)
          }}
        />
      )}
    </Dialog>
  )
}
