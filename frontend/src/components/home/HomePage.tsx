import { forwardRef, useRef } from 'react'
import { CONTACT_EMAIL, CONTACT_SUBJECT } from '../../config'
import { tours } from '../../data/tours'
import { canRunRichScene } from '../../lib/webgl'
import { PASS_KEY, THEME_KEY } from '../../config'
import { FolioSticky } from './FolioSticky'
import { FlightPath } from './FlightPath'
import { Timeline } from './Timeline'
import { PlaneWindow } from '../window/PlaneWindow'

type Props = {
  booting?: boolean
  onReset?: () => void
}

export const HomePage = forwardRef<HTMLElement, Props>(function HomePage(
  { booting = false, onReset },
  ref,
) {
  const trackRef = useRef<HTMLDivElement>(null)
  const tailRef = useRef<HTMLDivElement>(null)
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`

  return (
    <main className={`folio${booting ? ' booting' : ''}`} ref={ref}>
      <FolioSticky booting={booting} />
      <div className="folio-col">
        <div className="folio-window reveal">
          <PlaneWindow paused={booting} />
        </div>
        <div className="folio-intro reveal">
          <p className="folio-tagline">{tours.hero.title}</p>
          <p className="folio-sub">
            {tours.hero.subtitle}
            <br />
            {tours.hero.desc1}
            <br />
            {tours.hero.desc2}
          </p>
        </div>
        <Timeline
          trackRef={trackRef}
          tailRef={tailRef}
          pathRail={<FlightPath trackRef={trackRef} tailRef={tailRef} />}
        />
      </div>
      <FooterFx />
      <footer className="folio-footer">
        <div className="folio-footer-inner">
          <nav className="ff-links">
            {onReset && (
              <button className="ff-link" type="button" onClick={onReset}>
                <span className="ff-link-label">Return to Gate</span>
              </button>
            )}
            <a className="ff-link" href={mailto}>
              <span className="ff-link-label">Email</span>
            </a>
          </nav>
        </div>
      </footer>
    </main>
  )
})

function FooterFx() {
  return (
    <div className="folio-footer-fx" aria-hidden>
      <div className="pb pb1" />
      <div className="pb pb2" />
      <div className="pb pb3" />
      <div className="pb pb4" />
      <div className="pb pb5" />
      <div className="folio-footer-tint" />
    </div>
  )
}

export function clearAccessState() {
  try {
    localStorage.removeItem(PASS_KEY)
    localStorage.removeItem(THEME_KEY)
  } catch {
    /* ignore */
  }
  location.reload()
}

export function showResetControl() {
  return canRunRichScene()
}
