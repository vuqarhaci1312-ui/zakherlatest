import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { prefersReducedMotion } from '../lib/webgl'

const SPRING_STIFFNESS = 190
const SPRING_DAMPING = 26
const VELOCITY_STOP = 0.002
const POSITION_STOP = 0.001
const FLING_VELOCITY = 1.6
const SNAP_MID = 0.5
const SNAP_ZONE = 0.1
const ARM_THRESHOLD = 0.1
const MIN_ANIM_MS = 260
const MAX_ANIM_MS = 900

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

type Options = {
  travel: number
  initial?: number
  onChange?: (value: number, settled: boolean) => void
}

export function useShadeDrag({ travel, initial = 0, onChange }: Options) {
  const [shade, setShade] = useState(initial)
  const [settled, setSettled] = useState(true)
  const [dragging, setDragging] = useState(false)

  const valueRef = useRef(initial)
  const spring = useRef({ v: 0, target: null as number | null, raf: 0, dragging: false })
  const dragRef = useRef<{
    y: number
    from: number
    t: number
    armed: boolean
  } | null>(null)
  const lastUp = useRef(0)

  const cancelAnim = useCallback(() => {
    if (spring.current.raf) cancelAnimationFrame(spring.current.raf)
    spring.current.raf = 0
    spring.current.target = null
  }, [])

  const springTo = useCallback(
    (target: number) => {
      cancelAnim()
      if (prefersReducedMotion()) {
        valueRef.current = target
        setShade(target)
        setSettled(true)
        spring.current.v = 0
        return
      }
      spring.current.target = target
      let last = performance.now()
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 1 / 30)
        last = now
        const current = valueRef.current
        const goal = spring.current.target!
        const accel = SPRING_STIFFNESS * (goal - current) - SPRING_DAMPING * spring.current.v
        spring.current.v += accel * dt
        const next = current + spring.current.v * dt
        if (
          Math.abs(spring.current.v) < VELOCITY_STOP &&
          Math.abs(goal - next) < POSITION_STOP
        ) {
          valueRef.current = goal
          setShade(goal)
          setSettled(true)
          spring.current.v = 0
          spring.current.raf = 0
          spring.current.target = null
          return
        }
        valueRef.current = Math.max(0, Math.min(1, next))
        setShade(valueRef.current)
        spring.current.raf = requestAnimationFrame(tick)
      }
      spring.current.raf = requestAnimationFrame(tick)
    },
    [cancelAnim],
  )

  const animateTo = useCallback(
    (target: number, duration = MAX_ANIM_MS) => {
      cancelAnim()
      if (prefersReducedMotion()) {
        valueRef.current = target
        setShade(target)
        setSettled(true)
        return
      }
      const from = valueRef.current
      const delta = target - from
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        valueRef.current = from + delta * easeInOutCubic(p)
        setShade(valueRef.current)
        if (p < 1) spring.current.raf = requestAnimationFrame(step)
        else {
          valueRef.current = target
          setShade(target)
          setSettled(true)
          spring.current.raf = 0
        }
      }
      spring.current.raf = requestAnimationFrame(step)
    },
    [cancelAnim],
  )

  useEffect(() => () => cancelAnim(), [cancelAnim])
  useEffect(() => {
    onChange?.(shade, settled)
  }, [shade, settled, onChange])

  const snapTo = useCallback(
    (target: 0 | 1, duration?: number) => {
      const ms = duration ?? Math.max(MIN_ANIM_MS, MAX_ANIM_MS * Math.abs(target - valueRef.current))
      animateTo(target, ms)
    },
    [animateTo],
  )

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0) return
      cancelAnim()
      e.currentTarget.setPointerCapture(e.pointerId)
      spring.current.dragging = true
      setDragging(true)
      setSettled(false)
      spring.current.v = 0
      dragRef.current = {
        y: e.clientY,
        from: valueRef.current,
        t: performance.now(),
        armed: false,
      }
    },
    [cancelAnim],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || !spring.current.dragging) return
      const next = Math.max(0, Math.min(1, drag.from + (e.clientY - drag.y) / travel))
      const finish = (target: 0 | 1) => {
        spring.current.dragging = false
        setDragging(false)
        dragRef.current = null
        valueRef.current = next
        setShade(next)
        snapTo(target, Math.max(MIN_ANIM_MS, MAX_ANIM_MS * Math.abs(target - next)))
      }

      if (!drag.armed && Math.abs(next - drag.from) > ARM_THRESHOLD) drag.armed = true
      if (drag.armed) {
        if (next <= SNAP_ZONE) return finish(0)
        if (next >= 1 - SNAP_ZONE) return finish(1)
      }

      const fromLow = drag.from < SNAP_MID ? 1 : 0
      if (fromLow === 1 ? next >= SNAP_MID : next <= SNAP_MID) {
        return finish(fromLow as 0 | 1)
      }

      const now = performance.now()
      const dt = (now - drag.t) / 1000
      if (dt > 0) spring.current.v = (next - valueRef.current) / dt
      if (next === 0 || next === 1) spring.current.v = 0
      drag.t = now
      valueRef.current = next
      setShade(next)
    },
    [snapTo, travel],
  )

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      lastUp.current = performance.now()
      if (!dragRef.current) return
      spring.current.dragging = false
      setDragging(false)
      dragRef.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      if (spring.current.v > FLING_VELOCITY) return springTo(1)
      if (spring.current.v < -FLING_VELOCITY) return springTo(0)
      springTo(valueRef.current > SNAP_MID ? 1 : 0)
    },
    [springTo],
  )

  const onClick = useCallback(() => {
    if (performance.now() - lastUp.current < 500) return
    setSettled(false)
    snapTo(valueRef.current > SNAP_MID ? 0 : 1)
  }, [snapTo])

  return {
    shade,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClick,
    },
  }
}
