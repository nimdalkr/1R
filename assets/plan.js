import {footprint,rotate,STRUCTURAL} from '../shared/planner-model.mjs';
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Math.round(v*100)/100;
/* All symbols stay in the same local furniture axes as the mesh renderer. */
export function symbol(o){
 const {w,d}=o,c=o.color||'#d2c9b9',stroke='#737e71',base=`fill="${c}" stroke="${stroke}" stroke-width="1.2" vector-effect="non-scaling-stroke"`;
 const rect=(x,z,ww,dd,fill=c,r=2)=>`<rect x="${x*w}" y="${z*d}" width="${ww*w}" height="${dd*d}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width=".8" vector-effect="non-scaling-stroke"/>`;
 const line=(x,z,xx,zz)=>`<path d="M${x*w} ${z*d} L${xx*w} ${zz*d}" fill="none" stroke="${stroke}" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
 const outer=rect(-.5,-.5,1,1);
 switch(o.type){
 case 'bed':return outer+rect(-.45,-.45,.9,.9,'#eee9df',5)+rect(-.43,-.1,.86,.53,c,3)+rect(-.33,-.36,.66,.18,'#faf8f1',6);
 case 'desk':case 'table':return rect(-.5,-.5,1,1,c,4)+line(-.44,.42,.44,.42);
 case 'ldesk':{const ps=footprint({...o,x:0,z:0,r:0});return `<polygon points="${ps.map(p=>`${p.x},${p.z}`).join(' ')}" ${base}/>`;}
 case 'chair':return rect(-.45,-.36,.9,.76,c,12)+rect(-.4,.26,.8,.16,'#53635b',6)+line(-.49,-.1,-.49,.27)+line(.49,-.1,.49,.27);
 case 'sofa':return rect(-.5,-.5,1,1,c,10)+rect(-.39,-.24,.38,.62,'#eee7da',6)+rect(.01,-.24,.38,.62,'#eee7da',6)+rect(-.5,-.48,1,.21,c,4);
 case 'wardrobe':case 'drawers':case 'fridge':return outer+line(0,-.46,0,.46)+line(-.04,.22,-.04,.37)+line(.04,.22,.04,.37);
 case 'bookshelf':case 'shelf':case 'cart':return outer+rect(-.44,-.4,.88,.8,'#eae4d7')+line(-.43,-.12,.43,-.12)+line(-.43,.17,.43,.17);
 case 'rack':return rect(-.5,-.5,1,1,'#f0efe7')+line(-.45,0,.45,0)+line(-.45,-.45,-.45,.45)+line(.45,-.45,.45,.45);
 case 'box':return outer+rect(-.06,-.5,.12,1,'#dbc79e',0)+rect(-.34,-.15,.26,.3,'#efe6d2');
 case 'monitor':case 'standby':return `<ellipse cx="0" cy="0" rx="${Math.min(w*.35,d*.42)}" ry="${d*.42}" fill="#dfded4" stroke="${stroke}"/>`+rect(-.5,-.08,1,.16,o.type==='monitor'?'#47564d':'#f3f1e8',3)+`<path d="M0 ${d*.13}v${d*.27}m0 0l-6 -7m6 7l6 -7" fill="none" stroke="#3b7154" stroke-width="1.7" vector-effect="non-scaling-stroke"/>`;
 case 'laptop':return outer+rect(-.46,-.49,.92,.13,'#485f50')+rect(-.33,-.16,.66,.46,'#b9c2b8');
 case 'partition':case 'curtain':return outer+Array.from({length:10},(_,i)=>line(-.46+i*.1,-.35,-.46+i*.1,.35)).join('');
 case 'window':return rect(-.5,-.5,1,1,'#d3e5e4',0)+line(-.48,-.16,.48,-.16)+line(-.48,.16,.48,.16);
 case 'door':return `<rect x="${-w/2}" y="${-d/2}" width="${w}" height="${d}" fill="#f6f4ed"/><path d="M${-w/2} ${d/2}h${w}m${-w} 0v${w}a${w} ${w} 0 0 0 ${w} ${-w}" fill="none" stroke="#ac9068" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
 case 'kitchen':return outer+rect(-.22,-.29,.27,.58,'#a8b5aa',4)+rect(.21,-.29,.22,.58,'#5e685f',3)+line(-.4,.2,-.4,.4);
 case 'bath':return rect(-.5,-.5,1,1,'#d7dfd8')+rect(-.41,-.41,.31,.2,'#f5f3ed',4)+`<ellipse cx="${w*.24}" cy="${-d*.15}" rx="${w*.12}" ry="${d*.16}" fill="#f6f4ed" stroke="#9aa99a"/>`;
 case 'plant':return `<circle r="${Math.min(w,d)*.48}" fill="#a3b59a" stroke="#74896c"/><path d="M0 0l${-w*.25} ${-d*.28}M0 0l${w*.3} ${-d*.2}M0 0v${d*.37}" stroke="#5f7855"/>`;
 case 'lamp':return `<circle r="${Math.min(w,d)*.48}" fill="#eee3c7" stroke="#b6a27d"/><circle r="${Math.min(w,d)*.12}" fill="#7e826d"/>`;
 case 'rug':return rect(-.5,-.5,1,1,c,3)+rect(-.46,-.46,.92,.92,c,2);
 default:return outer;
 }
}
function objectMarkup(o,selected,labels){const s=String(selected)===String(o.id),hasLabel=labels&&Math.min(o.w,o.d)>25;return `<g data-object="${esc(o.id)}" transform="translate(${n(o.x)} ${n(o.z)}) rotate(${n(o.r)})" class="plan-object${s?' selected':''}">${symbol(o)}${s?`<polygon points="${footprint({...o,x:0,z:0,r:0}).map(p=>`${n(p.x)},${n(p.z)}`).join(' ')}" fill="none" stroke="#23724e" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`:''}${hasLabel?`<text x="0" y="${o.type==='bed'?o.d*.12:4}" text-anchor="middle" class="object-label">${esc(o.name.slice(0,12))}</text>`:''}</g>`;}
export function planContents(doc,{selected=null,dimensions=false,labels=false,sight=null,interactive=true}={}){
 const {w,d}=doc.room;let out=`<rect x="0" y="0" width="${w}" height="${d}" fill="#f8f5ec" stroke="#747b6d" stroke-width="6"/>`;
 const objects=doc.objects.filter(o=>o.placed!==false).sort((a,b)=>((a.type==='rug'?-100:STRUCTURAL.has(a.type)?-10:0)+(a.e||0))-((b.type==='rug'?-100:STRUCTURAL.has(b.type)?-10:0)+(b.e||0)));
 for(const o of objects)out+=objectMarkup(o,selected,labels);
 if(sight){const {from:a,to:b}=sight,color=sight.blocked.length||sight.behind?'#b3742e':'#2c8056';out+=`<path d="M${a.x} ${a.z}L${b.x} ${b.z}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="7 5" vector-effect="non-scaling-stroke" pointer-events="none"/><circle cx="${a.x}" cy="${a.z}" r="5" fill="${color}"/>`;}
 const o=objects.find(o=>String(o.id)===String(selected));if(o&&dimensions){const locked=o.locked||(doc.room.structureLocked&&STRUCTURAL.has(o.type));out+=`<g transform="translate(${o.x} ${o.z}) rotate(${o.r})"><path d="M${-o.w/2} ${o.d/2+13}h${o.w}m${-o.w} -4v8m${o.w} -8v8M${o.w/2+13} ${-o.d/2}v${o.d}m-4 ${-o.d}h8m-8 ${o.d}h8" fill="none" stroke="#4c7656" stroke-width="1" vector-effect="non-scaling-stroke"/><text x="0" y="${o.d/2+29}" text-anchor="middle" class="dimension-label">${o.w} cm</text><text x="${o.w/2+23}" y="0" class="dimension-label">${o.d} cm</text>${interactive&&!locked?`<rect data-resize="${esc(o.id)}" x="${o.w/2-6}" y="${o.d/2-6}" width="12" height="12" class="size-grip" rx="2"/>`:''}</g>`;}
 return out;
}
export function thumb(doc){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 ${doc.room.w+40} ${doc.room.d+40}" preserveAspectRatio="xMidYMid meet" aria-label="방 구조 미리보기" role="img">${planContents(doc,{interactive:false})}</svg>`;}
