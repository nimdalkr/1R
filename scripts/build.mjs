import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
for(const [tag,file] of Object.entries({CSS:'style.css',CORE:'core.js',ICONS:'icons.js',ENGINE:'engine.js',REFS:'refs.js',TEMPLATES:'templates.js',APP:'app.js'})){
 let text=fs.readFileSync(path.join(root,'src',file),'utf8');
 if(tag!=='CSS')text=text.replace(/<\/script/gi,'<\\/script');
 html=html.replace('/*__'+tag+'__*/',()=>text);
}
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
console.log(`Built dist/index.html (${Math.round(Buffer.byteLength(html)/1024)} KB). No CDN or runtime dependencies.`);
