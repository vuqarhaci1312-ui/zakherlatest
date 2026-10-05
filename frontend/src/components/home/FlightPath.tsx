import { useEffect, useRef } from 'react'

const curvePath = 'M43 0V7.3A39 39 0 0 1 21.71 42.05A39 39 0 0 0 0.5 76.75V110'
const curveHeight = 110
const cornerR = 15
const cornerSpan = cornerR + 30 * 2
const smooth = 0.12

function bentPath(width: number) {
  const cx = width + 0.5
  return `M${cx} 0V${cornerR}A${cornerR} ${cornerR} 0 0 1 ${cx - cornerR} ${cornerR + cornerR}H${0.5 + cornerR}A${cornerR} ${cornerR} 0 0 0 0.5 ${cornerSpan}`
}

type Props = {
  trackRef: React.RefObject<HTMLElement | null>
  tailRef: React.RefObject<HTMLElement | null>
}

export function FlightPath({ trackRef, tailRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dotsPathRef = useRef<SVGPathElement>(null)
  const litPathRef = useRef<SVGPathElement>(null)
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const tail = tailRef.current
    if (!track || !tail) return
    const setTail = () => {
      const tr = track.getBoundingClientRect()
      const tl = tail.getBoundingClientRect()
      track.style.setProperty('--rail-tail', `${(tr.bottom - (tl.top + tl.height / 2)).toFixed(1)}px`)
    }
    setTail()
    const ro = new ResizeObserver(setTail)
    ro.observe(track)
    ro.observe(tail)
    return () => ro.disconnect()
  }, [trackRef, tailRef])

  useEffect(() => {
    const root = rootRef.current
    const litPath = litPathRef.current
    const rail = railRef.current
    const track = trackRef.current
    if (!root || !litPath || !rail || !track) return

    let pathLen = 118
    let railH = curveHeight
    let originY = 0
    let dots: { el: Element; y: number; lit: boolean }[] = []
    let shown = 0
    let target = 0
    let frame = 0

    const scrollProgress = () => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      return max <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / max))
    }

    const layoutCurve = () => {
      const head = track.querySelector('.plan-head')
      if (!head || getComputedStyle(head).getPropertyValue('--plan-centre').trim() !== '1') {
        railH = curveHeight
        svgRef.current?.removeAttribute('style')
        svgRef.current?.setAttribute('viewBox', `0 0 44 ${curveHeight}`)
        dotsPathRef.current?.setAttribute('d', curvePath)
        litPathRef.current?.setAttribute('d', curvePath)
        return
      }
      const plane = head.querySelector('.plan-plane')
      if (!plane || !svgRef.current) return
      const pr = plane.getBoundingClientRect()
      const rr = rail.getBoundingClientRect()
      const width = Math.max(cornerSpan, pr.left + pr.width / 2 - (rr.left + rr.width / 2))
      railH = cornerSpan
      const d = bentPath(width)
      svgRef.current.setAttribute('viewBox', `0 0 ${width + 1} ${cornerSpan}`)
      svgRef.current.style.width = `${width + 1}px`
      svgRef.current.style.height = `${cornerSpan}px`
      dotsPathRef.current?.setAttribute('d', d)
      litPathRef.current?.setAttribute('d', d)
    }

    const measure = () => {
      layoutCurve()
      pathLen = litPath.getTotalLength() || 118
      railH = rail.offsetHeight
      originY = root.getBoundingClientRect().top + window.scrollY
      dots = [...track.querySelectorAll('.tl-dot')].map((el) => {
        const r = el.getBoundingClientRect()
        return {
          el,
          y: r.top + r.height / 2 + window.scrollY,
          lit: el.classList.contains('is-lit'),
        }
      })
    }

    const paint = () => {
      frame = 0
      const delta = target - shown
      shown = Math.abs(delta) < 0.0002 ? target : shown + delta * smooth
      const along = shown * (pathLen + railH)
      const curveP = Math.min(1, Math.max(0, along / pathLen))
      const railP = railH ? Math.min(1, Math.max(0, (along - pathLen) / railH)) : 0
      root.style.setProperty('--curve-p', curveP.toFixed(4))
      root.style.setProperty('--rail-p', railP.toFixed(4))
      const tipY = originY + railH * curveP + railH * railP
      for (const dot of dots) {
        const on = dot.y <= tipY
        if (on !== dot.lit) {
          dot.lit = on
          dot.el.classList.toggle('is-lit', on)
        }
      }
      if (shown !== target) frame = requestAnimationFrame(paint)
    }

    const onScroll = () => {
      target = scrollProgress()
      if (!frame) frame = requestAnimationFrame(paint)
    }

    const onResize = () => {
      measure()
      onScroll()
    }

    measure()
    shown = target = scrollProgress()
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(document.body)
    track.addEventListener('animationend', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [trackRef])

  return (
    <div className="folio-path" ref={rootRef} aria-hidden>
      <svg className="path-curve" viewBox="0 0 44 110" fill="none" ref={svgRef}>
        <path className="pc-dots" d={curvePath} ref={dotsPathRef} />
        <path className="pc-lit" d={curvePath} pathLength={1} ref={litPathRef} />
      </svg>
      <div className="path-rail" ref={railRef}>
        <div className="path-lit" />
      </div>
      <svg className="path-tip" viewBox="0 0 7 3" fill="none">
        <path d="M0.5 0.5 3.5 2.5 6.5 0.5" />
      </svg>
    </div>
  )
}
