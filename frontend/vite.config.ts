import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const publicRoot = path.resolve(process.cwd(), 'public')

/** Prefer a file in frontend/public over the remote static proxy. */
function serveLocalIfPresent(req: { url?: string }) {
  const raw = req.url ?? ''
  const pathname = decodeURIComponent(raw.split('?')[0]).replace(/^\/+/, '')
  if (!pathname || pathname.includes('..')) return
  const file = path.resolve(publicRoot, pathname)
  const hit = file.startsWith(publicRoot) && fs.existsSync(file) && fs.statSync(file).isFile()
  if (hit) return raw.split('?')[0]
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const staticOrigin = env.VITE_STATIC_ORIGIN ?? ''

  return {
    plugins: [react()],
    base: '/',
    publicDir: 'public',
    build: {
      outDir: '../public_html',
      emptyOutDir: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three') || id.includes('@react-three')) return 'three'
          },
        },
      },
    },
    server: {
      port: 5175,
      strictPort: true,
      ...(staticOrigin
        ? {
          proxy: {
            '/folio': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/case': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/cloud.png': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/CirrusCloud.png': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/waternormals.jpg': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/window-back.webp': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/window-front.webp': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/window-shutter.webp': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/og-image.jpg': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
            '/assets': { target: staticOrigin, changeOrigin: true, bypass: serveLocalIfPresent },
          },
        }
        : {}),
    },
  }
})
