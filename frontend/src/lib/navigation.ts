import type { MouseEvent } from 'react'
import { NAV_EVENT } from '../config'

export const currentPath = () =>
  window.location.pathname.replace(/\/+$/, '') || '/'

export function navigate(path: string) {
  if (path === currentPath()) return
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event(NAV_EVENT))
}

export function onNavigate(listener: () => void) {
  window.addEventListener('popstate', listener)
  window.addEventListener(NAV_EVENT, listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener(NAV_EVENT, listener)
  }
}

export function spaLink(path: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return
    }
    e.preventDefault()
    navigate(path)
  }
}
