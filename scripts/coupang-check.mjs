import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createCoupang,settings} from '../server/coupang.mjs';
const envfile=fileURLToPath(new URL('../.env.local',import.meta.url));if(fs.existsSync(envfile))process.loadEnvFile(envfile);
if(!settings().configured){console.error('COUPANG_ACCESS_KEY and COUPANG_SECRET_KEY are not configured in .env.local / server environment.');process.exit(1);}
if(!process.argv.includes('--live')){console.log('Keys are set. To explicitly consume one real search call: npm run coupang:check -- --live');process.exit(0);}
try {await createCoupang().search('원룸 책상',1);console.log('PASS: one authenticated Coupang search call. No API keys or response data were saved.');}
catch(e){console.error(`${e.code||'ERROR'}: ${e.message}`);process.exit(1);}
