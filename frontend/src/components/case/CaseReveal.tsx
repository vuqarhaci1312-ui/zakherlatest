import { useEffect, useRef, useState } from 'react'

type Props = {
  className?: string
  delay?: number
  children: React.ReactNode
}

export function CaseReveal({ className = '', delay = 0, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const threshold = window.innerHeight * 0.92
    const check = () => {
      const rect = el.getBoundingClientRect()
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom || rect.top < threshold) {
        setInView(true)
        return true
      }
      return false
    }
    if (check()) return
    const onScroll = () => check() && window.removeEventListener('scroll', onScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [inView])

  return (
    <div
      ref={ref}
      className={`cs-reveal${inView ? ' is-in' : ''}${done ? ' is-done' : ''} ${className}`.trim()}
      style={delay ? { ['--reveal-delay' as string]: `${delay}ms` } : undefined}
      onAnimationEnd={() => setDone(true)}
    >
      {children}
    </div>
  )
}
