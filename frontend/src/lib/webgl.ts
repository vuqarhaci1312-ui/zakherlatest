const softwareRenderer = /swiftshader|llvmpipe|softwarepipe|basic render|generic renderer/i

let cached: boolean | undefined

export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function lowEndDevice() {
  const cores = navigator.hardwareConcurrency
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (!cores || !memory) return false
  return cores <= 2 && memory <= 2
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    if (info) {
      const renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '')
      if (softwareRenderer.test(renderer)) return false
    }
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return true
  } catch {
    return false
  }
}

export function canRunRichScene() {
  if (cached !== undefined) return cached
  if (typeof window === 'undefined') {
    cached = false
    return cached
  }
  cached = !prefersReducedMotion() && !lowEndDevice() && hasWebGL()
  return cached
}
