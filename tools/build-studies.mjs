import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bundlePath = process.argv[2] ?? process.env.REFERENCE_BUNDLE_PATH
if (!bundlePath) {
  console.error('Usage: node build-studies.mjs <path-to-reference-bundle.js>')
  process.exit(1)
}

const js = fs.readFileSync(bundlePath, 'utf8')
const startMarker = 'Tt = ['
const endMarker = '],\n    Dh ='
const start = js.indexOf(startMarker)
const end = js.indexOf(endMarker, start)
if (start < 0 || end < 0) throw new Error('Could not find studies array in bundle')
const arraySrc = js.slice(start + 'Tt = '.length, end + 1)

const fn = new Function(`
const ee = (folder, files) => files.map((f) => (f ? { src: \`/case/\${folder}/\${f}\` } : {}));
const Ah = (row, idx, demo) => row.map((cell, j) => (j === idx ? { ...cell, demo } : cell));
const Fr = (folder, name, ext = "mp4") => ({
  before: \`/case/\${folder}/\${name}-before.\${ext}\`,
  after: \`/case/\${folder}/\${name}-after.\${ext}\`,
});
const Fh = (row) => row.map((cell) => ({ ...cell, bare: true }));
return ${arraySrc};
`)

const out = path.join(__dirname, '..', 'frontend', 'src', 'data', 'studies.json')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(fn(), null, 2))
console.log('Wrote', out)
