import { THEME_KEY } from '../config'

const veilFadeMs = 300
const recolourMs = 520
let veilEl: HTMLDivElement | null = null
let isDark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
let recolourTimer = 0

export function readCabinDark() {
  return isDark
}

function veilElement() {
  if (veilEl || typeof document === 'undefined') return veilEl
  veilEl = document.createElement('div')
  veilEl.setAttribute('aria-hidden', 'true')
  veilEl.style.cssText =
    'position:fixed;inset:0;z-index:4;pointer-events:none;opacity:0'
  document.body.appendChild(veilEl)
  return veilEl
}

function veilColour(dark: boolean) {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(dark ? '--veil-dark' : '--veil-light')
      .trim() || (dark ? '#191817' : '#faf5f5')
  )
}

function flashRecolour() {
  const root = document.documentElement
  root.classList.remove('is-recolouring')
  void root.offsetWidth
  root.classList.add('is-recolouring')
  clearTimeout(recolourTimer)
  recolourTimer = window.setTimeout(
    () => root.classList.remove('is-recolouring'),
    recolourMs + 60,
  )
}

export function setCabinDark(next: boolean) {
  if (next === isDark) return
  isDark = next
  flashRecolour()
  const root = document.documentElement
  if (next) root.dataset.theme = 'dark'
  else delete root.dataset.theme
  try {
    if (next) localStorage.setItem(THEME_KEY, '1')
    else localStorage.removeItem(THEME_KEY)
  } catch {
    /* ignore */
  }
  const veil = veilElement()
  if (veil) {
    veil.style.transition = `opacity ${veilFadeMs}ms var(--ease-out, ease-out)`
    veil.style.opacity = '0'
    window.setTimeout(() => {
      if (veilEl) veilEl.style.transition = ''
    }, veilFadeMs + 40)
  }
}

export function onShadeProgress(shade: number, settled: boolean) {
  const veil = veilElement()
  if (!veil) return
  if (settled) {
    if (shade >= 0.999) setCabinDark(true)
    else if (shade <= 0.001) setCabinDark(false)
  }
  veil.style.transition = ''
  veil.style.backgroundColor = veilColour(!isDark)
  veil.style.opacity = String((isDark ? 1 - shade : shade) * 1)
}
