function waitFrames(count: number) {
  return new Promise<void>((resolve) => {
    const step = (n: number) => {
      if (n <= 0) resolve()
      else requestAnimationFrame(() => step(n - 1))
    }
    step(count)
  })
}

/** One frame so the splash can paint, then continue. */
export function runBootPreload() {
  return waitFrames(1)
}
