import { useCallback, useEffect, useRef, useState } from 'react'

export type Music = {
  /** False when the couple hasn't uploaded a song: the music button is hidden. */
  available: boolean
  playing: boolean
  /** Start playing. Browsers only allow this right after a tap or click. */
  start: () => void
  toggle: () => void
}

/**
 * Background music for the invitation.
 *
 * Browsers block audio that starts by itself, so playback begins from the
 * "Open your invitation" tap on the opening screen. After that the guest
 * can pause and resume from the header.
 */
export function useMusic(url: string | null): Music {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!url) return
    const audio = new Audio(url)
    audio.loop = true
    audio.volume = 0.5
    // Don't download the song until the guest taps "Open": a song is several MB,
    // and many guests are on mobile data. It then streams while playing.
    audio.preload = 'none'
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audioRef.current = null
    }
  }, [url])

  const start = useCallback(() => {
    // play() returns a promise that rejects if the browser still refuses; ignore it.
    audioRef.current?.play().catch(() => {})
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }, [])

  return { available: Boolean(url), playing, start, toggle }
}
