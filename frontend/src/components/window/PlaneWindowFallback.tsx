const clouds = [
  { left: '-30%', top: '34%', width: '105%', opacity: 0.7 },
  { left: '30%', top: '30%', width: '100%', opacity: 0.6 },
  { left: '-15%', top: '46%', width: '135%', opacity: 0.95 },
]

export function PlaneWindowFallback() {
  return (
    <>
      {clouds.map((c, i) => (
        <img
          key={i}
          src="/cloud.png"
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            ...c,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: '64% 0 0 0',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #FFFFFF 70%)',
        }}
      />
    </>
  )
}
