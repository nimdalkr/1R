import { createCommerce } from './commerce.mjs';
import assets from 'one-r:public-assets';

// Env is supplied by Sites per isolate. Never copy runtime secrets into the build.
const handlers = new WeakMap();
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.coupang.com https://*.coupangcdn.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};
function secure(response, pathname) {
  const result = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) result.headers.set(key, value);
  if (pathname.startsWith('/admin')) result.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return result;
}
export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    if (url.pathname === '/api/commerce') {
      let handle = handlers.get(env);
      if (!handle) { handle = createCommerce({ env }); handlers.set(env, handle); }
      // Cloudflare owns this header. Do not use visitor-supplied proxy headers
      // for the per-client budget on Sites.
      const forwarded = new Headers(request.headers);
      forwarded.delete('x-vercel-forwarded-for');
      forwarded.delete('x-forwarded-for');
      forwarded.set('x-forwarded-for', request.headers.get('cf-connecting-ip') || 'unknown');
      return secure(await handle(new Request(request, { headers: forwarded })), url.pathname);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return secure(new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } }), url.pathname);
    }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { return secure(new Response('Bad request', { status: 400 }), url.pathname); }
    if (pathname === '/admin') pathname = '/admin/index.html';
    else if (pathname.endsWith('/')) pathname += 'index.html';
    const asset = Object.hasOwn(assets, pathname) ? assets[pathname] : null;
    return secure(asset
      ? new Response(request.method === 'HEAD' ? null : asset.body, { headers: { 'Content-Type': asset.type } })
      : new Response('Not found', { status: 404 }), pathname);
  },
};
