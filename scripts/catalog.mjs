import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalogErrors,eligibility} from '../shared/catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),target=path.join(root,'data/catalog.json');
const [action='check',input]=process.argv.slice(2);
if(!['check','import'].includes(action)){console.error('Usage: node scripts/catalog.mjs check | import path/to/catalog.json');process.exit(1);}
try {
 if(action==='import'&&!input)throw Error('가져올 catalog.json 경로를 지정하세요.');
 const file=input?path.resolve(input):target,stat=fs.statSync(file);if(stat.size>524288)throw Error('카탈로그는 512KB 이내로 제한합니다.');
 const doc=JSON.parse(fs.readFileSync(file,'utf8'));
 if(doc.draft)throw Error('작업 초안은 공개할 수 없습니다. 검수 도구의 공개 카탈로그 내보내기를 사용하세요.');
 const errors=catalogErrors(doc);if(errors.length)throw Error(errors.join('\n'));
 const states=doc.options.map(o=>({id:o.id,...eligibility(o)}));
 if(action==='import'){
  const tmp=target+'.tmp';fs.writeFileSync(tmp,JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),options:doc.options},null,2)+'\n');fs.renameSync(tmp,target);
  console.log('Imported into data/catalog.json. Review the git diff, commit, and redeploy.');
 }
 console.log(`Valid catalog: ${doc.options.length} total, ${states.filter(o=>o.eligible).length} currently eligible / 200 maximum.`);
 for(const s of states.filter(s=>!s.eligible))console.log(`${s.id}: HIDDEN — ${s.reasons.join('; ')}`);
}catch(error){console.error(error.message);process.exit(1);}
