# Portfolio cabin (React + Hestia)

React (Vite) front-end with a deploy folder shaped for **Hestia `public_html`**. PHP API is reserved under `public_html/api/` for later use.

## Layout

- `frontend/` — source (Node.js build)
- `public_html/` — upload **this folder’s contents** to your domain `public_html`
- `tools/` — asset sync and case-study data extraction helpers

## Local development

```bash
cd frontend
npm install
```

Optional: proxy missing static files from a demo host during dev (set in `frontend/.env.local`):

```env
VITE_STATIC_ORIGIN=https://your-demo-origin.example
```

```bash
npm run dev
```

## Production build

```bash
cd frontend
npm run build
```

Output is written to `public_html/` (`index.html`, `assets/`, `theme.js`, etc.).

### Static media

After build, sync images/video/fonts into `public_html`:

```powershell
$env:ASSET_ORIGIN="https://your-demo-origin.example"
node ..\tools\sync-assets.mjs
```

Check only:

```powershell
node ..\tools\sync-assets.mjs --check
```

## Hestia deploy

1. Run `npm run build` in `frontend/`.
2. Run `sync-assets.mjs` if media is not already in `public_html/`.
3. Upload everything inside `public_html/` to the domain’s `public_html` on the server.
4. Ensure Apache **AllowOverride** allows `.htaccess` (SPA fallback is included).

### Nginx (if not Apache)

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Regenerating case study JSON

If you update the reference bundle path:

```bash
node tools/build-studies.mjs path\to\index-*.js
```

## Customisation

- Site copy and links: `frontend/src/config.ts`, `frontend/src/data/flightPlan.ts`
- Case studies: `frontend/src/data/studies.json` (generated)
- Theme flash before paint: `frontend/public/theme.js` (keep `THEME_KEY` in sync with `config.ts`)

Replace demo text, images, and third-party links before public launch.
