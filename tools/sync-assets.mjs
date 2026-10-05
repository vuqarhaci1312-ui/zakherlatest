import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public_html')
const origin = process.env.ASSET_ORIGIN
const checkOnly = process.argv.includes('--check')

if (!origin) {
  console.error('Set ASSET_ORIGIN to the demo host URL before running sync-assets.')
  process.exit(1)
}

const css = fs.readFileSync(path.join(root, 'frontend', 'src', 'styles', 'site.css'), 'utf8')
const fontPaths = [...css.matchAll(/url\((\/assets\/[^)]+)\)/g)].map((m) => m[1])

const studies = JSON.parse(
  fs.readFileSync(path.join(root, 'frontend', 'src', 'data', 'studies.json'), 'utf8'),
)

function walkMedia(node, acc) {
  if (!node || typeof node !== 'object') return
  if (typeof node.src === 'string') acc.add(node.src)
  if (typeof node.before === 'string') acc.add(node.before)
  if (typeof node.after === 'string') acc.add(node.after)
  if (typeof node.poster === 'string') acc.add(node.poster)
  if (Array.isArray(node)) node.forEach((n) => walkMedia(n, acc))
  else Object.values(node).forEach((v) => walkMedia(v, acc))
}

const paths = new Set([
  '/cloud.png',
  '/CirrusCloud.png',
  '/waternormals.jpg',
  '/window-back.webp',
  '/window-front.webp',
  '/window-shutter.webp',
  '/og-image.jpg',
  '/favicon.svg',
  '/folio/device.png',
  '/folio/boarding-pass.png',
  '/folio/boarding-pass-back.png',
  ...fontPaths,
])

walkMedia(studies, paths)

const flightPlan = fs.readFileSync(
  path.join(root, 'frontend', 'src', 'data', 'flightPlan.ts'),
  'utf8',
)
for (const m of flightPlan.matchAll(/'(\/folio\/[^']+)'/g)) paths.add(m[1])

async function download(rel) {
  const url = new URL(rel, origin).href
  const dest = path.join(outDir, rel.replace(/^\//, '').split('/').join(path.sep))
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  if (fs.existsSync(dest)) return { rel, status: 'skip' }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
      if (!res.ok) return { rel, status: 'fail', code: res.status }
      const buf = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(dest, buf)
      return { rel, status: 'ok' }
    } catch (err) {
      if (attempt === 2) return { rel, status: 'fail', err: String(err) }
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
    }
  }
  return { rel, status: 'fail' }
}

const list = [...paths].sort()
if (checkOnly) {
  const missing = list.filter((rel) => !fs.existsSync(path.join(outDir, rel.slice(1))))
  console.log(missing.length ? `Missing ${missing.length} assets` : 'All tracked assets present')
  if (missing.length) console.log(missing.slice(0, 20).join('\n'))
  process.exit(missing.length ? 1 : 0)
}

console.log(`Syncing ${list.length} files to public_html…`)
const results = []
for (const rel of list) {
  const r = await download(rel)
  results.push(r)
  if (r.status === 'ok') process.stdout.write('.')
}
console.log('')
const failed = results.filter((r) => r.status === 'fail')
console.log(
  `Done: ${results.filter((r) => r.status === 'ok').length} downloaded, ${results.filter((r) => r.status === 'skip').length} skipped, ${failed.length} failed`,
)
if (failed.length) {
  console.error('Failed:', failed.slice(0, 15).map((f) => f.rel).join(', '))
  process.exit(1)
}
