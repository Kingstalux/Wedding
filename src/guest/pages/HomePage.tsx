import { Countdown } from '../sections/Countdown'
import { DressCode } from '../sections/DressCode'
import { Footer } from '../sections/Footer'
import { Gallery } from '../sections/Gallery'
import { Gifts } from '../sections/Gifts'
import { GuestBook } from '../sections/GuestBook'
import { Header } from '../sections/Header'
import { Hero } from '../sections/Hero'
import { Rsvp } from '../sections/Rsvp'
import { Schedule } from '../sections/Schedule'
import { Wishes } from '../sections/Wishes'
import { Word } from '../sections/Word'
import type { Music } from '../useMusic'

/** The guest's invitation page: every section, top to bottom, as in the mockup. */
export function HomePage({ music }: { music: Music }) {
  return (
    <>
      <Header music={music} />
      <main id="top">
        <Hero />
        <Countdown />
        <Word />
        <Schedule />
        <DressCode />
        <Gallery />
        <Rsvp />
        <Wishes />
        <GuestBook />
        <Gifts />
      </main>
      <Footer />
    </>
  )
}
