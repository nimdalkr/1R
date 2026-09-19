import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.join(project,'dist');
const sites=process.argv.includes('--sites');
if(fs.existsSync(path.join(project,'.env.local')))process.loadEnvFile(path.join(project,'.env.local'));
if(!sites&&!fs.existsSync(path.join(root,'index.html')))await import('./build.mjs');
const argument=name=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;};
const port=Number(argument('--port')||process.env.PORT||4173),host=argument('--host')||process.env.HOST||'127.0.0.1';
const local=['127.0.0.1','localhost','::1'].includes(host);
if(!process.env.CATALOG_ADMIN_TOKEN&&local) {process.env.CATALOG_ADMIN_TOKEN=randomBytes(24).toString('base64url');console.log('Local-only admin token (not a Coupang key): '+process.env.CATALOG_ADMIN_TOKEN);}
const {handleCommerce}=await import('../server/commerce.mjs');
const worker=sites?(await import('../dist/server/index.js')).default:null;
const server=http.createServer(async(req,res)=>{
 try {
  const origin=`http://${req.headers.host||'localhost'}`,url=new URL(req.url,origin);
  // Development-only responsive QA viewport; never part of the Worker build.
  if(sites&&url.pathname==='/__qa/mobile') {
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
   res.end('<!doctype html><html><head><title>1R responsive QA</title></head><body style="margin:0;background:#ddd"><iframe title="1R mobile viewport" src="/?__qa=frame" style="display:block;border:0;width:390px;height:844px"></iframe></body></html>');return;
  }
  if(sites||url.pathname==='/api/commerce') {
   const chunks=[];let length=0;
   for await(const chunk of req){length+=chunk.length;if(length>524288){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'요청 크기 초과'}}));return;}chunks.push(chunk);}
   const request=new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
   const response=worker?await worker.fetch(request,process.env):await handleCommerce(request);
   // Permit only this local same-origin QA frame; production keeps DENY/none.
   if(sites&&url.searchParams.get('__qa')==='frame') {
    response.headers.set('X-Frame-Options','SAMEORIGIN');
    response.headers.set('Content-Security-Policy',response.headers.get('Content-Security-Policy').replace("frame-ancestors 'none'","frame-ancestors 'self'"));
   }
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
  if(name.endsWith('/'))name+='index.html';else if(name==='/admin')name='/admin/index.html';
  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{
   if(error){res.writeHead(404);res.end('Not found');return;}
   const mime={'.html':'text/html; charset=utf-8','.json':'application/json','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:data);
  });
 }catch{if(!res.headersSent)res.writeHead(500);res.end('Request failed');}
});
server.requestTimeout=20000;server.headersTimeout=10000;
server.listen(port,host,()=>console.log(`1R: http://${host}:${server.address().port} · admin: /admin/ · Ctrl+C to stop`));
