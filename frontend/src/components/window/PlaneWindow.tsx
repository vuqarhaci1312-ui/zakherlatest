import { lazy, Suspense, useState } from 'react'
import { readCabinDark } from '../../lib/themeVeil'
import { canRunRichScene } from '../../lib/webgl'
import { useShadeDrag } from '../../hooks/useShadeDrag'
import { onShadeProgress } from '../../lib/themeVeil'
import { PlaneWindowFallback } from './PlaneWindowFallback'

const PlaneWindowScene = lazy(() => import('./PlaneWindowScene'))

const frameW = 600
const frameH = 900
const inset = { top: 132, bottom: 716, left: 79, right: 520 }
const radius = 170
const innerInset = { top: 179, bottom: 653, left: 118, right: 481 }
const innerRadius = 150
const shadeScale = (723 - 210) / 900
const shutterTravel = 300 * shadeScale

const clip = (
  box: typeof inset,
  r: number,
  pad: number,
) =>
  `inset(${(box.top - pad) / frameH * 100}% ${(frameW - box.right - pad) / frameW * 100}% ${(frameH - box.bottom - pad) / frameH * 100}% ${(box.left - pad) / frameW * 100}% round ${(r + pad) / 3}px)`

const outerClip = clip(innerInset, innerRadius, 2)
const glassClip = clip(inset, radius, 6)
const hitClip = clip(inset, radius, 0)
const xo = shutterTravel
const shutterMaskPos = (shade: number) =>
  `${-inset.left / 3}px ${-inset.top / 3 - (1 - shade) * xo}px`

const skyGradient =
  'linear-gradient(to bottom, #5CADF4 0%, #94CCFB 33%, #C8E6FB 45%, #FFFFFF 50%)'

function LayerImg({
  src,
  shade,
  dim,
  style,
}: {
  src: string
  shade: number
  dim: number
  style?: React.CSSProperties
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        pointerEvents: 'none',
        filter: `brightness(${1 - shade * dim})`,
        ...style,
      }}
    />
  )
}

type Props = {
  paused?: boolean
}

export function PlaneWindow({ paused = false }: Props) {
  const rich = useState(canRunRichScene)[0]
  const { shade, dragging, handlers } = useShadeDrag({
    travel: shutterTravel,
    initial: readCabinDark() ? 1 : 0,
    onChange: (v, settled) => onShadeProgress(v, settled),
  })
  const shutterUp = shade > 0.92

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        width: 200,
        height: 300,
        margin: '0 auto',
        isolation: 'isolate',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: outerClip,
          WebkitClipPath: outerClip,
          background: skyGradient,
        }}
      >
        {rich ? (
          <Suspense fallback={<PlaneWindowFallback />}>
            <PlaneWindowScene paused={paused || shutterUp} />
          </Suspense>
        ) : (
          <PlaneWindowFallback />
        )}
      </div>
      <LayerImg src="/window-back.webp" shade={shade} dim={0.86} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: glassClip,
          WebkitClipPath: glassClip,
          pointerEvents: 'none',
        }}
      >
        <LayerImg
          src="/window-shutter.webp"
          shade={shade}
          dim={0.82}
          style={{
            transform: `translate3d(0, ${-(1 - shade) * shadeScale * 100}%, 0)`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: `${inset.left / 3}px`,
            top: `${inset.top / 3}px`,
            width: `${(inset.right - inset.left) / 3}px`,
            height: `${(inset.bottom - inset.top) / 3}px`,
            borderRadius: `${radius / 3}px`,
            pointerEvents: 'none',
            boxShadow:
              'inset 0 0 11px rgba(28, 25, 22, 0.42), inset 0 0 3px rgba(28, 25, 22, 0.30)',
            maskImage: 'url(/window-shutter.webp)',
            WebkitMaskImage: 'url(/window-shutter.webp)',
            maskSize: '200px 300px',
            WebkitMaskSize: '200px 300px',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: shutterMaskPos(shade),
            WebkitMaskPosition: shutterMaskPos(shade),
          }}
        />
      </div>
      <LayerImg src="/window-front.webp" shade={shade} dim={0.8} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          maskImage: 'url(/window-front.webp)',
          WebkitMaskImage: 'url(/window-front.webp)',
          maskSize: 'cover',
          WebkitMaskSize: 'cover',
          maskRepeat: 'no-repeat',
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
          opacity: shade * 0.55,
          background: 'linear-gradient(to bottom, #6a6e78 0%, #878b95 38%, #a2a7ae 100%)',
        }}
      />
      <button
        type="button"
        {...handlers}
        aria-pressed={shade > 0.5}
        title={shade > 0.5 ? 'Open the window shade' : 'Close the window shade'}
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: hitClip,
          WebkitClipPath: hitClip,
          background: 'none',
          border: 0,
          padding: 0,
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        <span className="sr-only">
          {shade > 0.5 ? 'Open the window shade' : 'Close the window shade'}
        </span>
      </button>
    </div>
  )
}
