import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.join(project,'dist');
if(fs.existsSync(path.join(project,'.env.local')))process.loadEnvFile(path.join(project,'.env.local'));
if(!fs.existsSync(path.join(root,'index.html')))await import('./build.mjs');
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const local=['127.0.0.1','localhost','::1'].includes(host);
if(!process.env.CATALOG_ADMIN_TOKEN&&local) {process.env.CATALOG_ADMIN_TOKEN=randomBytes(24).toString('base64url');console.log('Local-only admin token (not a Coupang key): '+process.env.CATALOG_ADMIN_TOKEN);}
const {handleCommerce}=await import('../server/commerce.mjs');
const server=http.createServer(async(req,res)=>{
 try {
  const origin=`http://${req.headers.host||'localhost'}`,url=new URL(req.url,origin);
  if(url.pathname==='/api/commerce') {
   const chunks=[];let length=0;
   for await(const chunk of req){length+=chunk.length;if(length>524288){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'요청 크기 초과'}}));return;}chunks.push(chunk);}
   const request=new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
   const response=await handleCommerce(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
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
