# 1R Studio — Sites deployment

Source baseline: `b6758df68627d9d72610a31e7655e8b773b9f314` (latest main when deployment work began, rechecked before publication).

## Compatibility and scope

- The original `index.html`, `assets/`, `shared/`, and production catalog are unchanged. All six Studio workflows remain in the same application.
- Sites uses a Cloudflare Worker with a default `fetch(request, env)` export. The existing commerce handler is bundled with esbuild 0.25.12 and receives runtime environment bindings. `nodejs_compat` retains the existing HMAC and constant-time administrator-token comparison.
- The unchanged public build allowlist (20 resources) is embedded in the Worker. No filesystem, TCP listener, external CDN, database, asset binding, photo upload, or API key is needed to open the editor. The Worker is approximately 244 KiB before compression, below the 128 MiB isolate memory limit.
- Runtime secrets are not read by the build. Browser files, private server code, and runtime configuration are not served from an arbitrary filesystem path. Unknown paths return 404. Existing CSP, no-store API responses, administrator authentication, origin checking and body limits remain in place.
- Sites uses Cloudflare's client IP header for the per-client budget, ignoring client-supplied Vercel/proxy IP headers.
- `vercel.json` retains the original hosting path through `npm run build:web`.

## Commands

```bash
npm ci
npm test
npm run build
```

`npm run build` first produces the original public allowlist, then packages it into `dist/server/index.js`, `dist/server/wrangler.json`, and `dist/.openai/hosting.json`. Only this generated output is submitted to Sites. Rebuild after the final source commit so `/build-info.json` contains the same full commit as the saved Sites version.

`npm run dev` previews that Worker through the existing Node HTTP server. `--host` and `--port` are supported. `/__qa/mobile` is a development-only 390×844 iframe for responsive inspection. Its same-origin frame allowance exists only in the local server; neither this route nor the allowance is in the production Worker.

Existing GitHub browser CI now installs the pinned build dependency and serves the Worker output for the original 48-check browser suite.

## Commerce setup later

No live keys were configured for this deployment. `/api/commerce?action=status` reports `configured:false`, `verifiedCount:0`, and `adminEnabled:false`. The empty catalog displays **상품 추천 준비 중**, while all editing remains available.

Later set `COUPANG_ACCESS_KEY`, `COUPANG_SECRET_KEY` and an independent `CATALOG_ADMIN_TOKEN` of at least 24 random characters as Sites server secrets. Optional `COUPANG_SUB_ID` and Upstash REST settings retain their existing behavior. Republish to apply runtime changes. Product review/approval remains required; adding keys alone does not create recommended products. Never enter a Coupang secret into the browser administrator-token field.

## Validation record — 2026-09-19

- Existing Node suite: **143 passed, 0 failed**.
- Actual workerd runtime through Miniflare **4.20260730.0**, compatibility date **2026-08-01**, `nodejs_compat`: startup, root and commerce routes, private-file 404s, no-key status and empty catalog verified.
- Additional Worker checks: **15 passed**, including exact public-file contents, administrator-token authentication, no-key probe rejection, cross-origin POST rejection, body limit and **zero external API calls**.
- Desktop Chromium: structure lock disables geometry inputs; ten independent unplaced boxes; placement changes counters; rendered 3D; entry/bed/orbit cameras; StanbyME target selection and facing adjustment; saved/current layout comparison with two rendered canvases; empty recommendation panel returns to editing.
- Mobile Chromium at **390×844**: rendered 3D, no horizontal overflow, inventory placement, property-sheet editing, 2D switch and empty recommendation panel inspected through the same Worker preview.
- Source-tree image check found no raster room photos. The public bundle excludes `.env*`, drafts, test fixtures and source maps; private paths and the development-only QA route return 404 in the Worker.

These checks cover Chromium desktop and a mobile-sized viewport, not physical iOS/Safari, Android device drivers or live Coupang authentication. Production URL, access mode and exact commit must be confirmed from the successful Sites deployment and `/build-info.json`.
