type SplashProps = {
  leaving: boolean
}

export function Splash({ leaving }: SplashProps) {
  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}`} aria-live="polite">
      <div className="splash-monogram">
        <span className="sr-only">Loading</span>
        <img className="splash-monogram-mark" src="/zakher-logo.png" alt="Zakher Travel" />
      </div>
    </div>
  )
}
