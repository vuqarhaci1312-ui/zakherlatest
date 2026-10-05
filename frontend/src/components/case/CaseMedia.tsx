import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '../../types/case'

const videoRe = /\.(mp4|m4v|webm|mov)$/i
const lazyMargin = '600px'

function EmptyMedia({ className }: { className?: string }) {
  return <span className={`cs-media is-empty ${className ?? ''}`} aria-hidden />
}

function Compare({
  before,
  after,
  labels,
}: {
  before: React.ReactNode
  after: React.ReactNode
  labels?: boolean
}) {
  const [split, setSplit] = useState(50)
  const [dragging, setDragging] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !root.current) return
    const rect = root.current.getBoundingClientRect()
    setSplit(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)))
  }
  const end = (e: React.PointerEvent) => {
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={`cs-compare${dragging ? ' is-dragging' : ''}`}
      ref={root}
      style={{ ['--split' as string]: `${split}%` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span className="cs-compare-layer">{before}</span>
      <span className="cs-compare-layer is-after">{after}</span>
      {labels && (
        <>
          <span className="cs-compare-tag is-before" style={{ opacity: split < 12 ? 0 : 1 }}>
            Before
          </span>
          <span className="cs-compare-tag is-after" style={{ opacity: split > 88 ? 0 : 1 }}>
            After
          </span>
        </>
      )}
      <span className="cs-compare-line" aria-hidden />
      <button
        type="button"
        className="cs-compare-grip"
        role="slider"
        aria-label="Compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split)}
      />
    </div>
  )
}

function ImpactHubDemo() {
  return (
    <video
      className="cs-media"
      src="/case/fahlo/impact-hub-1.mp4"
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      aria-hidden
    />
  )
}

const demos: Record<string, () => React.ReactNode> = {
  'impact-1up': ImpactHubDemo,
}

function CaseImage({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(!src)
  if (failed) return <EmptyMedia className={className} />
  return (
    <img
      className={`cs-media ${className ?? ''}`}
      src={src}
      onError={() => setFailed(true)}
      data-lazy=""
      loading="lazy"
      decoding="async"
      draggable={false}
      alt=""
      aria-hidden
    />
  )
}

function CaseVideo({
  src,
  poster,
  hover,
  label,
  className,
}: {
  src?: string
  poster?: string
  hover?: boolean
  label?: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)
  const [failed, setFailed] = useState(!src)
  const [playing, setPlaying] = useState(false)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || failed) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const loadObs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), {
      rootMargin: lazyMargin,
    })
    const playObs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) el.pause()
      else if (!hover) el.play().catch(() => undefined)
    })
    loadObs.observe(el)
    playObs.observe(el)
    return () => {
      loadObs.disconnect()
      playObs.disconnect()
    }
  }, [failed, hover])

  useEffect(() => {
    const el = ref.current
    if (!hover || !hovering || !el) return
    el.play().catch(() => undefined)
  }, [hover, hovering])

  if (failed) return <EmptyMedia className={className} />

  const video = (
    <video
      ref={ref}
      className={`cs-media ${className ?? ''}`}
      src={visible ? src : undefined}
      poster={poster}
      onError={() => setFailed(true)}
      onPlay={hover ? () => setPlaying(true) : undefined}
      onPause={hover ? () => setPlaying(false) : undefined}
      data-lazy=""
      preload="none"
      muted
      loop
      playsInline
      autoPlay={!hover}
      controlsList="nodownload noplaybackrate"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden
    />
  )

  if (!hover) return video
  return (
    <span
      className={`cs-hoverplay${playing ? ' is-playing' : ''}`}
      onPointerEnter={(e) => e.pointerType !== 'touch' && setHovering(true)}
      onPointerLeave={(e) => e.pointerType !== 'touch' && setHovering(false)}
      onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}
    >
      {video}
      <span className="cs-hoverplay-hint" aria-hidden>
        {label && <span className="cs-hoverplay-label">{label}</span>}
        <span className="cs-hoverplay-say is-hover">Hover to play</span>
        <span className="cs-hoverplay-say is-tap">Tap to play</span>
      </span>
    </span>
  )
}

export function isInteractiveMedia(media: MediaItem) {
  return !!(media.demo || media.before || media.after || media.hover)
}

export function CaseMedia(props: MediaItem & { className?: string }) {
  const { demo, before, after, src, poster, hover, label, className } = props
  if (demo && demos[demo]) return <>{demos[demo]()}</>
  if (before || after) {
    return (
      <Compare
        before={<CaseMedia src={before} className={className} />}
        after={<CaseMedia src={after} className={className} />}
        labels={!!before && !!after}
      />
    )
  }
  if (src && !videoRe.test(src)) return <CaseImage src={src} className={className} />
  return (
    <CaseVideo
      src={src}
      poster={poster}
      hover={hover}
      label={label}
      className={className}
    />
  )
}

export function PhoneFrame({
  media,
  onOpen,
}: {
  media: MediaItem
  onOpen?: () => void
}) {
  const bare = !!media.bare
  return (
    <div className={`cs-phone${bare ? ' is-bare' : ''}${isInteractiveMedia(media) ? ' is-live' : ''}`}>
      <div className="cs-phone-screen">
        <CaseMedia {...media} />
      </div>
      {!bare && (
        <img className="cs-phone-bezel" src="/folio/device.png" alt="" draggable={false} />
      )}
      {onOpen && (
        <button type="button" className="cs-open" onClick={onOpen} aria-label="Open larger" />
      )}
    </div>
  )
}
