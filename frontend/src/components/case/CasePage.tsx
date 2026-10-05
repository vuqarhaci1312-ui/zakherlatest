import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CaseStudy, CaseSection, MediaItem } from '../../types/case'
import { studyNeighbors } from '../../data/studies'
import { spaLink } from '../../lib/navigation'
import { CaseReveal } from './CaseReveal'
import { CaseMedia, PhoneFrame, isInteractiveMedia } from './CaseMedia'

const stagger = 60

type LightboxItem =
  | { kind: 'figure'; media: MediaItem; caption?: string; aspect?: number }
  | { kind: 'phone'; media: MediaItem }

function flattenSections(sections: CaseSection[]) {
  const items: LightboxItem[] = []
  const offsets = sections.map((section) => {
    const at = items.length
    if (section.type === 'figure') {
      items.push({
        kind: 'figure',
        media: section.media,
        caption: section.caption,
        aspect: section.aspect,
      })
    } else if (section.type === 'phones') {
      for (const row of section.rows) {
        for (const cell of row) items.push({ kind: 'phone', media: cell })
      }
    }
    return at
  })
  return { items, offsets }
}

function CaseNav({ prev, next }: { prev: CaseStudy | null; next: CaseStudy | null }) {
  const Btn = ({
    dir,
    target,
  }: {
    dir: 'prev' | 'next'
    target: CaseStudy | null
  }) => {
    const back = dir === 'prev'
    const inner = (
      <>
        <span className="cs-nav-kicker">
          {back && <Chevron dir={dir} />}
          {back ? 'Back' : 'Next'}
          {!back && <Chevron dir={dir} />}
        </span>
        <span className="cs-nav-name">
          <span className="cs-nav-name-text">{target?.title ?? '—'}</span>
        </span>
      </>
    )
    if (!target) {
      return (
        <span className={`cs-nav-btn ${back ? 'is-back' : 'is-next'} is-null`} aria-disabled>
          {inner}
        </span>
      )
    }
    return (
      <a
        className={`cs-nav-btn ${back ? 'is-back' : 'is-next'}`}
        href={target.slug}
        onClick={spaLink(target.slug)}
        aria-label={`${back ? 'Previous' : 'Next'} case study: ${target.title}`}
      >
        {inner}
      </a>
    )
  }
  return (
    <nav className="cs-nav" aria-label="Case studies">
      <Btn dir="prev" target={prev} />
      <a className="cs-nav-home" href="/" onClick={spaLink('/')} aria-label="Home">
        <HomeIcon />
      </a>
      <Btn dir="next" target={next} />
    </nav>
  )
}

function Chevron({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg className="cs-nav-chev" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={dir === 'prev' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg className="cs-nav-home-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.9 10.3 12 3.8l8.1 6.5V19a1.4 1.4 0 0 1-1.4 1.4H5.3A1.4 1.4 0 0 1 3.9 19v-8.7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10.1 20.4v-3.5a1.9 1.9 0 1 1 3.8 0v3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SectionBlock({
  section,
  offset,
  onOpen,
}: {
  section: CaseSection
  offset: number
  onOpen: (index: number) => void
}) {
  switch (section.type) {
    case 'overview':
      return (
        <section className="cs-overview">
          <p className="cs-gutter-label">{section.label}</p>
          <p className="cs-lede">{section.body}</p>
        </section>
      )
    case 'deep-dive':
      return (
        <section className="cs-deep">
          <h2 className="cs-heading">{section.title}</h2>
          <p className="cs-body">{section.body}</p>
        </section>
      )
    case 'figure':
      return (
        <figure
          className={`cs-figure${section.wide ? ' is-wide' : ''}`}
          style={section.aspect ? { ['--fig-ar' as string]: section.aspect } : undefined}
        >
          <span className="cs-figure-card">
            <span className="cs-figure-screen">
              <CaseMedia {...section.media} />
              {isInteractiveMedia(section.media) && (
                <button
                  type="button"
                  className="cs-open"
                  onClick={() => onOpen(offset)}
                  aria-label="Open larger"
                />
              )}
            </span>
          </span>
          {section.caption && <figcaption className="cs-figcaption">{section.caption}</figcaption>}
        </figure>
      )
    case 'phones': {
      let cursor = offset
      return (
        <div className="cs-phones">
          {section.rows.map((row, ri) => (
            <div className="cs-phone-row" key={ri}>
              {row.map((cell, ci) => {
                const index = cursor++
                const open = isInteractiveMedia(cell) ? () => onOpen(index) : undefined
                return <PhoneFrame key={ci} media={cell} onOpen={open} />
              })}
            </div>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}

function Lightbox({
  item,
  onClose,
  onStep,
}: {
  item: LightboxItem
  onClose: () => void
  onStep: (dir: number) => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const prev = document.activeElement
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        onStep(e.key === 'ArrowRight' ? 1 : -1)
      }
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.classList.add('is-lightboxed')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('is-lightboxed')
      if (prev instanceof HTMLElement) prev.focus()
    }
  }, [onClose, onStep])

  return (
    <div className="cs-lightbox" role="dialog" aria-modal aria-label="Enlarged mockup">
      <button className="cs-scrim" type="button" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div className="cs-stage">
        {item.kind === 'phone' ? (
          <PhoneFrame media={item.media} />
        ) : (
          <figure
            className="cs-figure"
            style={item.aspect ? { ['--fig-ar' as string]: item.aspect } : undefined}
          >
            <span className="cs-figure-card">
              <span className="cs-figure-screen">
                <CaseMedia {...item.media} />
              </span>
            </span>
            {item.caption && <figcaption className="cs-figcaption">{item.caption}</figcaption>}
          </figure>
        )}
      </div>
      <button
        ref={closeRef}
        className="cs-lightbox-close"
        type="button"
        onClick={onClose}
        aria-label="Close"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

type Props = { study: CaseStudy; booting?: boolean }

export const CasePage = forwardRef<HTMLElement, Props>(function CasePage(
  { study, booting = false },
  ref,
) {
  const { prev, next } = studyNeighbors(study.slug)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const { items, offsets } = useMemo(() => flattenSections(study.sections), [study.sections])

  useEffect(() => setLightbox(null), [study.slug])

  const step = useCallback(
    (dir: number) => {
      setLightbox((current) => {
        if (current === null) return current
        for (let i = current + dir; i >= 0 && i < items.length; i += dir) {
          const media = items[i].kind === 'phone' ? items[i].media : items[i].media
          if (isInteractiveMedia(media) || items[i].kind === 'figure') return i
        }
        return current
      })
    },
    [items],
  )

  return (
    <main className={`case-page${booting ? ' booting' : ''}`} ref={ref}>
      <article className="cs-flow">
        <CaseReveal className="cs-col">
          <header className="cs-header">
            <p className="cs-eyebrow">
              <span>{study.years}</span>
              <span className="cs-eyebrow-dot" aria-hidden />
              <span>{study.platforms}</span>
            </p>
            <h1 className="cs-title">{study.title}</h1>
            <p className="cs-blurb">{study.blurb}</p>
          </header>
        </CaseReveal>
        {study.sections.map((section, i) => (
          <CaseReveal
            key={i}
            delay={Math.min(i + 1, 4) * stagger}
            className={
              section.type === 'phones' || (section.type === 'figure' && section.wide)
                ? 'cs-full'
                : 'cs-col'
            }
          >
            <SectionBlock section={section} offset={offsets[i]} onOpen={setLightbox} />
          </CaseReveal>
        ))}
      </article>
      {lightbox !== null && (
        <Lightbox item={items[lightbox]} onClose={() => setLightbox(null)} onStep={step} />
      )}
      <FooterFx />
      <CaseNav prev={prev} next={next} />
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
