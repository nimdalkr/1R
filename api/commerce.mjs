// Vercel Node.js Web Handler. API credentials are read at runtime, never bundled into the browser.
import { handleCommerce } from '../server/commerce.mjs';
export default { fetch: handleCommerce };
