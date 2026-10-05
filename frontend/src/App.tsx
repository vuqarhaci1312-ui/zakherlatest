import { useEffect, useRef, useState } from 'react'
import { PASS_KEY, SITE_TITLE } from './config'
import { prefersReducedMotion } from './lib/webgl'
import { runBootPreload } from './lib/preload'
import { Splash } from './components/splash/Splash'
import { HomePage, clearAccessState, showResetControl } from './components/home/HomePage'
import AccessPass from './components/pass/AccessPass'

const SPLASH_MIN_MS = 140
const SPLASH_LEAVE_MS = 120

type Phase = 'splash' | 'pass' | 'site'

function isUnlocked() {
  try {
    return localStorage.getItem(PASS_KEY) === '1'
  } catch {
    return false
  }
}

function grantAccess() {
  try {
    localStorage.setItem(PASS_KEY, '1')
  } catch {
    /* ignore */
  }
}

function initialPhase(): Phase {
  if (isUnlocked()) return 'site'
  return 'splash'
}

export default function App() {
  const unlocked = isUnlocked()
  const needsPass = !unlocked && !prefersReducedMotion()
  const [phase, setPhase] = useState<Phase>(initialPhase)
  const [splashVisible, setSplashVisible] = useState(() => !isUnlocked())
  const mainRef = useRef<HTMLElement>(null)
  const covered = phase !== 'site'

  useEffect(() => {
    document.documentElement.classList.toggle('is-covered', covered)
    return () => document.documentElement.classList.remove('is-covered')
  }, [covered])

  useEffect(() => {
    document.title = SITE_TITLE
  }, [])

  useEffect(() => {
    if (phase !== 'splash') return

    let cancelled = false
    let leaveTimer: number | undefined
    let hideTimer: number | undefined
    const started = performance.now()

    runBootPreload().then(() => {
      if (cancelled) return
      const elapsed = performance.now() - started
      leaveTimer = window.setTimeout(() => {
        if (cancelled) return
        setPhase(needsPass ? 'pass' : 'site')
        hideTimer = window.setTimeout(() => {
          if (!cancelled) setSplashVisible(false)
        }, SPLASH_LEAVE_MS)
      }, Math.max(0, SPLASH_MIN_MS - elapsed))
    })

    return () => {
      cancelled = true
      if (leaveTimer) clearTimeout(leaveTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [needsPass, phase])

  const enterSite = () => {
    grantAccess()
    setPhase('site')
    setSplashVisible(false)
  }

  const shellProps = {
    booting: covered,
    'aria-hidden': covered ? true : undefined,
    inert: covered ? ('' as const) : undefined,
  }

  return (
    <>
      <HomePage
        ref={mainRef}
        onReset={showResetControl() ? clearAccessState : undefined}
        {...shellProps}
      />
      {needsPass && phase === 'pass' && (
        <AccessPass onGranted={enterSite} onSkip={enterSite} />
      )}
      {splashVisible && <Splash leaving={phase !== 'splash'} />}
    </>
  )
}
