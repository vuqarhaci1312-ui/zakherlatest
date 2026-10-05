import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  CanvasTexture,
  Plane,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Group,
  type PerspectiveCamera,
  type Texture,
} from 'three'

type PassProps = {
  onGranted: () => void
  onSkip: () => void
}

type Status = 'idle' | 'near' | 'error' | 'granted'
type Mode = 'hover' | 'drag' | 'rest' | 'fall'

/** World units for the gate card mesh (texture: /zakherbilet.png). */
const CARD_W = 3.2
const BOARDING_PASS_TEX_W = 1835
const BOARDING_PASS_TEX_H = 857
const CARD_H = +((CARD_W * BOARDING_PASS_TEX_H) / BOARDING_PASS_TEX_W).toFixed(4)
const HOVER_Y = 0.9
const READER_Y = -1.2
const SLOT_Y = -1.05
const SLOT_TOL = 0.15
const TRAVERSE = 2.6
const READER_TILT = 0.22
const SEAT_Y = SLOT_Y + CARD_H / 2
const MOUTH = CARD_W / 2 + CARD_W / 2

const hitPlane = new Plane(new Vector3(0, 0, 1), 0)
const hitPoint = new Vector3()

function pixelsPerUnit(width: number, height: number) {
  const raw = Math.min(width / 6, height / 6.6)
  return Math.max(55, Math.min(132, raw))
}

function FrameCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  useLayoutEffect(() => {
    const scale = pixelsPerUnit(size.width, size.height)
    const worldH = size.height / scale
    const y = -25 / scale
    const z = worldH / (2 * Math.tan((12.5 * Math.PI) / 180))
    camera.fov = 25
    camera.position.set(0, y, z)
    camera.rotation.set(0, 0, 0)
    camera.updateProjectionMatrix()
    const readerBottom = READER_Y - 0.92 / 2
    const px = size.height / 2 - (readerBottom - y) * scale
    document.documentElement.style.setProperty('--reader-bottom-px', `${px}px`)
  }, [camera, size])
  return null
}

function lcdTexture(label: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0d0f0d'
  ctx.fillRect(0, 0, 512, 128)
  for (let y = 0; y < 128; y += 4) {
    ctx.fillStyle = 'rgba(255,255,255,0.025)'
    ctx.fillRect(0, y, 512, 1)
  }
  ctx.font = '400 62px "MB LCD", "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 16
  ctx.fillStyle = color
  ctx.fillText(label, 262, 70)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

function Reader({ status }: { status: Status }) {
  const maps = useMemo(
    () => ({
      idle: lcdTexture('READY', '#7d857c'),
      near: lcdTexture('READING', '#d9a013'),
      error: lcdTexture('ERROR', '#e0483a'),
      granted: lcdTexture('SUCCESS', '#35c56d'),
    }),
    [],
  )
  const led =
    status === 'granted' ? '#1e9e52' : status === 'near' ? '#d9a013' : status === 'error' ? '#e0483a' : '#b3aea1'
  const shell = '#d7cbaf'
  const cap = '#e8ddc6'

  return (
    <group position={[0, READER_Y, 0]} rotation={[READER_TILT, 0, 0]}>
      <RoundedBox args={[3.2, 0.92, 0.255]} radius={0.07} smoothness={6} position={[0, 0.01, 0.1725]} castShadow receiveShadow>
        <meshStandardMaterial color={shell} roughness={1} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[3.2, 0.92, 0.305]} radius={0.08} smoothness={6} position={[0, 0.01, -0.3175]} castShadow receiveShadow>
        <meshStandardMaterial color={shell} roughness={1} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[2.94, 0.123, 0.09]} radius={0.02} smoothness={5} position={[0, 0.4065, 0.287]} castShadow>
        <meshStandardMaterial color={cap} roughness={1} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[2.94, 0.215, 0.1]} radius={0.022} smoothness={5} position={[0, 0.2375, 0.3]} castShadow>
        <meshStandardMaterial color={cap} roughness={1} metalness={0.02} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.69, 0.5, 0.1]}
          radius={0.022}
          smoothness={5}
          position={[side * 1.125, -0.15, 0.3]}
          castShadow
        >
          <meshStandardMaterial color={cap} roughness={1} metalness={0.02} />
        </RoundedBox>
      ))}
      {[-1, 1].map((side) => (
        <group key={`vents-${side}`}>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[side * (0.72 + i * 0.056), 0.457, 0.195]}>
              <boxGeometry args={[0.018, 0.03, 0.185]} />
              <meshStandardMaterial color="#5b5341" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[side * 1.47, 0.464, 0.175]}>
            <boxGeometry args={[0.014, 0.02, 0.25]} />
            <meshStandardMaterial color="#8c8267" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.15, -0.06]}>
        <boxGeometry args={[3.14, 0.6, 0.27]} />
        <meshStandardMaterial color="#1c1b19" roughness={0.7} />
      </mesh>
      <RoundedBox args={[1.46, 0.44, 0.1]} radius={0.03} smoothness={4} position={[0, -0.14, 0.265]}>
        <meshStandardMaterial color="#232322" roughness={0.5} metalness={0.1} />
      </RoundedBox>
      <mesh position={[0, -0.14, 0.318]}>
        <planeGeometry args={[1.32, 0.33]} />
        <meshBasicMaterial map={maps[status]} toneMapped={false} />
      </mesh>
      <group position={[1.35, -0.14, 0.35]}>
        <mesh position={[0, 0, 0.002]}>
          <circleGeometry args={[0.066, 32]} />
          <meshStandardMaterial color="#141412" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.018]}>
          <sphereGeometry args={[0.038, 24, 24]} />
          <meshPhysicalMaterial
            color={led}
            emissive={led}
            emissiveIntensity={status === 'idle' ? 0.2 : 2.6}
            roughness={0.12}
            clearcoat={1}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}

function BoardingCard({
  status,
  onZone,
  onSwiped,
  onError,
}: {
  status: Status
  onZone: (near: boolean) => void
  onSwiped: () => void
  onError: () => void
}) {
  const group = useRef<Group>(null)
  const mode = useRef<Mode>('hover')
  const grab = useRef(new Vector3())
  const pos = useRef(new Vector3(0, HOVER_Y, 0))
  const rot = useRef({ x: 0, z: 0 })
  const vel = useRef(new Vector3())
  const spin = useRef(new Vector3())
  const span = useRef<{ min: number; max: number } | null>(null)
  const granted = useRef(false)
  const wasSeated = useRef(false)
  const [front, setFront] = useState<Texture | null>(null)
  const { raycaster, gl } = useThree()

  useEffect(() => {
    new TextureLoader().load('/zakherbilet.png?v=zakher', (tex) => {
      tex.colorSpace = SRGBColorSpace
      setFront(tex)
    })
  }, [])

  const apply = () => {
    const g = group.current
    if (!g) return
    g.position.copy(pos.current)
    g.rotation.set(rot.current.x, 0, rot.current.z)
  }

  useFrame((state, dt) => {
    if (granted.current) return
    const step = Math.min(dt, 0.05)
    const t = state.clock.elapsedTime
    if (mode.current === 'hover') {
      pos.current.set(Math.sin(t * 0.5) * 0.05, HOVER_Y + Math.sin(t * 1.2) * 0.1, 0)
      rot.current.x = Math.sin(t * 0.7) * 0.09
      rot.current.z = Math.sin(t * 0.9) * 0.08
      group.current?.rotation.set(rot.current.x, Math.sin(t * 0.4) * 0.06, rot.current.z)
      group.current?.position.copy(pos.current)
      return
    }
    if (mode.current === 'drag') {
      if (raycaster.ray.intersectPlane(hitPlane, hitPoint)) {
        let x = hitPoint.x - grab.current.x
        let y = hitPoint.y - grab.current.y
        const prevY = pos.current.y
        let seated = false
        if (Math.abs(x) < MOUTH && y < SEAT_Y) {
          if (prevY >= SEAT_Y - 0.12) {
            y = SEAT_Y
            seated = true
          } else {
            x = Math.sign(x || 1) * Math.max(Math.abs(x), MOUTH)
          }
        }
        const dx = x - pos.current.x
        let tilt = seated
          ? Math.abs(x) - CARD_W / 2 > 0
            ? -Math.sign(x) * Math.min((Math.abs(x) - CARD_W / 2) * 0.9, 0.85)
            : 0
          : Math.max(-0.35, Math.min(0.35, grab.current.x * 0.28)) + Math.max(-0.3, Math.min(0.3, -dx * 4))
        const dip = seated && Math.abs(x) > CARD_W / 2 ? (Math.abs(x) - CARD_W / 2) * 0.36 : 0
        pos.current.set(x, y - dip, seated ? (y - READER_Y) * Math.tan(READER_TILT) : 0)
        rot.current.z += (tilt - rot.current.z) * Math.min(1, step * (seated ? 8 : 4.5))
        rot.current.x += ((seated ? READER_TILT : 0) - rot.current.x) * Math.min(1, step * 10)
        const inSlot = Math.abs(y - CARD_H / 2 - SLOT_Y) < SLOT_TOL
        if (inSlot && !granted.current && status !== 'granted') {
          if (!span.current) span.current = { min: x, max: x }
          span.current.min = Math.min(span.current.min, x)
          span.current.max = Math.max(span.current.max, x)
          if (span.current.max - span.current.min > TRAVERSE) {
            granted.current = true
            onSwiped()
          }
        } else if (wasSeated.current && !inSlot) {
          span.current = null
          onError()
        }
        wasSeated.current = inSlot
        onZone(inSlot)
      }
      apply()
      return
    }
    if (mode.current === 'rest') {
      apply()
      return
    }
    vel.current.y -= 14 * step
    pos.current.addScaledVector(vel.current, step)
    rot.current.x += spin.current.x * step
    rot.current.z += spin.current.z * step
    apply()
    if (pos.current.y < -4.2) {
      mode.current = 'hover'
      vel.current.set(0, 0, 0)
      span.current = null
      wasSeated.current = false
    }
  })

  return (
    <group ref={group} position={[0, HOVER_Y, 0]}>
      <mesh
        castShadow
        position={[0, 0, 0.007]}
        onPointerOver={() => {
          document.body.style.cursor = mode.current === 'drag' ? 'grabbing' : 'grab'
        }}
        onPointerOut={() => {
          if (mode.current !== 'drag') document.body.style.cursor = 'auto'
        }}
        onPointerDown={(e) => {
          if (granted.current || status === 'granted') return
          e.stopPropagation()
          mode.current = 'drag'
          document.body.style.cursor = 'grabbing'
          try {
            gl.domElement.setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
          grab.current.set(e.point.x - pos.current.x, e.point.y - pos.current.y, 0)
          span.current =
            Math.abs(pos.current.y - CARD_H / 2 - SLOT_Y) < SLOT_TOL
              ? { min: pos.current.x, max: pos.current.x }
              : null
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          if (mode.current !== 'drag') return
          try {
            gl.domElement.releasePointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
          document.body.style.cursor = 'grab'
          const inSlot = Math.abs(pos.current.y - CARD_H / 2 - SLOT_Y) < SLOT_TOL
          if (!granted.current && span.current && inSlot && span.current.max - span.current.min > TRAVERSE) {
            granted.current = true
            onSwiped()
          }
          span.current = null
          onZone(false)
          if (inSlot) {
            mode.current = 'rest'
            rot.current.x = READER_TILT
            rot.current.z = 0
            pos.current.z = (pos.current.y - READER_Y) * Math.tan(READER_TILT)
          } else {
            mode.current = 'fall'
            vel.current.set(-rot.current.z * 1.6, 0.3, 0)
            spin.current.set(0.9, 0, (Math.random() - 0.5) * 1.4)
          }
        }}
      >
        <planeGeometry args={[CARD_W, CARD_H]} />
        {front ? (
          <meshBasicMaterial map={front} toneMapped={false} alphaTest={0.5} />
        ) : (
          <meshStandardMaterial color="#f7f4ee" roughness={0.8} />
        )}
      </mesh>
    </group>
  )
}

export default function AccessPass({ onGranted, onSkip }: PassProps) {
  const [status, setStatus] = useState<Status>('idle')
  const done = useRef(false)
  const errTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => clearTimeout(errTimer.current), [])

  const handleSwiped = useCallback(() => {
    if (done.current) return
    done.current = true
    setStatus('granted')
    window.setTimeout(onGranted, 1000)
  }, [onGranted])

  const handleZone = useCallback((near: boolean) => {
    setStatus((s) => {
      if (s === 'granted' || done.current) return 'granted'
      if (s === 'error' && !near) return s
      return near ? 'near' : 'idle'
    })
  }, [])

  const handleError = useCallback(() => {
    if (done.current) return
    setStatus('error')
    clearTimeout(errTimer.current)
    errTimer.current = window.setTimeout(() => {
      setStatus((s) => (s === 'error' ? 'idle' : s))
    }, 1800)
  }, [])

  return (
    <div className="pass-stage" style={{ background: '#faf5f5' }}>
      <div className="pass-canvas">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 13], fov: 25 }}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#faf5f5']} />
          <FrameCamera />
          <ambientLight intensity={0.72} />
          <directionalLight
            position={[4, 6, 6]}
            intensity={1.55}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <Reader status={status} />
          <BoardingCard status={status} onZone={handleZone} onSwiped={handleSwiped} onError={handleError} />
        </Canvas>
      </div>
      <p className={`pass-hint${status === 'granted' ? '' : ' shimmer'}`} aria-hidden>
        {status === 'granted' ? 'Access granted' : 'Swipe boarding pass to enter'}
      </p>
      <button type="button" className="skip-link" onClick={onSkip}>
        Skip
      </button>
      <div className={`pass-fade${status === 'granted' ? ' on' : ''}`} />
    </div>
  )
}
