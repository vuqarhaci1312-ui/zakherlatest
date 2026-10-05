import { useState } from 'react'

const layout = [
  { x: -55.8, y: 0.2, r: -7.65 },
  { x: -26.1, y: -1.7, r: -3 },
  { x: 0, y: -2.1, r: 0 },
  { x: 26.2, y: -1.4, r: 3 },
  { x: 55.9, y: 0.2, r: 7.54 },
]
const spread = 9
const falloff = 0.5

type Item = { src: string; caption?: string; turned?: boolean }

export function Memories({ items }: { items: Item[] }) {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div className="memories" onPointerLeave={() => setActive(null)}>
      {items.map((item, i) => {
        const base = layout[i] ?? layout[layout.length - 1]
        const isActive = active === i
        const offset =
          active == null ? 0 : (i - active) * spread * Math.pow(falloff, Math.abs(i - active) - 1)
        const sign = offset === 0 ? 0 : Math.sign(offset)
        const x = base.x + (sign === 0 ? 0 : sign * spread * Math.pow(falloff, Math.abs(i - (active ?? 0)) - 1))
        return (
          <span
            key={item.src}
            className={`mem-card${isActive ? ' is-active' : ''}`}
            onPointerEnter={() => setActive(i)}
            style={{
              ['--x' as string]: `${x.toFixed(2)}px`,
              ['--y' as string]: `${(isActive ? base.y - 11 : base.y).toFixed(2)}px`,
              ['--r' as string]: `${(isActive ? base.r * 0.3 : base.r).toFixed(2)}deg`,
              ['--s' as string]: isActive ? '1.12' : '1',
              zIndex: isActive ? 10 : layout.length - i,
            }}
          >
            <img
              className={item.turned ? 'is-turned' : undefined}
              src={item.src}
              alt={item.caption ?? ''}
              draggable={false}
            />
            {isActive && item.caption && (
              <span className="mem-tip" aria-hidden>
                {item.caption}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
