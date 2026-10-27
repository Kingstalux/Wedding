import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Switch } from '../../components/Form'
import { useConfirm } from '../../components/Confirm'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../components/IconButton'
import { Photo } from '../../components/Photo'
import { useToast } from '../../components/Toast'
import type { Database } from '../../lib/database.types'
import { mediaUrl } from '../../lib/media'
import { supabase } from '../../lib/supabase'
import { removeMedia, uploadPhotoBlob } from '../../lib/upload'
import { GalleryUploadDialog, type PreparedPhoto } from '../components/photo/GalleryUploadDialog'
import { studioErrorMessage, useSettings, useUpdateSettings } from '../queries'
import studio from '../studio.module.css'
import styles from './GalleryPage.module.css'

type PhotoRow = Database['public']['Tables']['gallery_photos']['Row']

const photosKey = ['admin', 'gallery'] as const

export function GalleryPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const inputRef = useRef<HTMLInputElement>(null)
  const settings = useSettings()
  const updateSettings = useUpdateSettings()
  const [picked, setPicked] = useState<File[] | null>(null)

  const photos = useQuery({
    queryKey: photosKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('sort')
        .order('created_at')
      if (error) throw error
      return data
    },
  })
  const list = photos.data ?? []
  const refresh = () => queryClient.invalidateQueries({ queryKey: photosKey })

  // Upload the prepared photos one by one, in the chosen order, so progress is
  // visible and a failure doesn't lose the rest.
  async function uploadPrepared(prepared: PreparedPhoto[], onProgress: (done: number) => void) {
    let nextSort = Math.max(0, ...list.map((p) => p.sort)) + 1
    let failed = 0
    for (const [i, photo] of prepared.entries()) {
      onProgress(i)
      try {
        const { path, width, height } = await uploadPhotoBlob('gallery', photo)
        const { error } = await supabase
          .from('gallery_photos')
          .insert({ path, width, height, sort: nextSort++ })
        if (error) {
          await removeMedia(path)
          throw error
        }
      } catch (err) {
        failed++
        toast(`${photo.name}: ${studioErrorMessage(err)}`, 'error')
      }
    }
    await refresh()
    setPicked(null)
    const added = prepared.length - failed
    if (added)
      toast(added === 1 ? 'Photo added to the gallery' : `${added} photos added to the gallery`)
  }

  const remove = useMutation({
    mutationFn: async (photo: PhotoRow) => {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', photo.id)
      if (error) throw error
      await removeMedia(photo.path)
    },
    onSuccess: () => {
      refresh()
      toast('Photo deleted')
    },
    onError: (err) => toast(studioErrorMessage(err), 'error'),
  })

  // Swap two neighbours, then save the new positions (0, 1, 2…) that changed.
  const move = useMutation({
    mutationFn: async ({ from, to }: { from: number; to: number }) => {
      const order = [...list]
      ;[order[from], order[to]] = [order[to], order[from]]
      queryClient.setQueryData(photosKey, order) // show the new order immediately
      const changed = order
        .map((photo, index) => ({ photo, index }))
        .filter(({ photo, index }) => photo.sort !== index)
      for (const { photo, index } of changed) {
        const { error } = await supabase
          .from('gallery_photos')
          .update({ sort: index })
          .eq('id', photo.id)
        if (error) throw error
      }
    },
    onSettled: refresh,
    onError: (err) => toast(studioErrorMessage(err), 'error'),
  })

  const shown = settings.data?.show_gallery ?? true

  return (
    <>
      <div className={studio.pageHead}>
        <div>
          <h1 className="display">Gallery</h1>
          <p>Add, remove and reorder the photos guests see in “Moments We’ll Cherish”.</p>
        </div>
        <Switch
          label={shown ? 'Gallery shown on the site' : 'Gallery hidden from the site'}
          checked={shown}
          disabled={!settings.data || updateSettings.isPending}
          onChange={(e) =>
            updateSettings.mutate(
              { show_gallery: e.target.checked },
              { onError: (err) => toast(studioErrorMessage(err), 'error') },
            )
          }
        />
      </div>

      {photos.isPending && <p className={studio.loading}>Loading…</p>}
      {photos.isError && <p className={studio.error}>{studioErrorMessage(photos.error)}</p>}

      {photos.isSuccess && (
        <ul className={styles.grid}>
          {list.map((photo, i) => (
            <li key={photo.id} className={styles.photo}>
              <Photo src={mediaUrl(photo.path)} alt={`Gallery photo ${i + 1}`} />
              <div className={styles.tools}>
                <span>
                  {i + 1} / {list.length}
                </span>
                <div>
                  <IconButton
                    icon="chevronLeft"
                    size="sm"
                    label={`Move photo ${i + 1} earlier`}
                    disabled={i === 0 || move.isPending}
                    onClick={() => move.mutate({ from: i, to: i - 1 })}
                  />
                  <IconButton
                    icon="chevronRight"
                    size="sm"
                    label={`Move photo ${i + 1} later`}
                    disabled={i === list.length - 1 || move.isPending}
                    onClick={() => move.mutate({ from: i, to: i + 1 })}
                  />
                  <IconButton
                    icon="trash"
                    size="sm"
                    label={`Delete photo ${i + 1}`}
                    onClick={async () =>
                      (await confirm({
                        title: 'Delete this photo?',
                        message: 'It is removed from the gallery and from storage.',
                        confirmLabel: 'Delete',
                        danger: true,
                      })) && remove.mutate(photo)
                    }
                  />
                </div>
              </div>
            </li>
          ))}
          <li>
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="Choose photos to add"
              onChange={(e) => {
                if (e.target.files?.length) setPicked([...e.target.files])
                e.target.value = ''
              }}
            />
            <button type="button" className={styles.add} onClick={() => inputRef.current?.click()}>
              <Icon name="plus" size={20} />
              Add photos
            </button>
          </li>
        </ul>
      )}

      <p className={studio.hint}>
        You can select several photos at once, then crop and order them before they’re added.
        They’re resized automatically so they load quickly on phones.
      </p>

      {picked && (
        <GalleryUploadDialog
          files={picked}
          onCancel={() => setPicked(null)}
          onUpload={uploadPrepared}
        />
      )}
    </>
  )
}
