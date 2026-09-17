
const $=s=>document.querySelector(s), C=$('#c'),ctx=C.getContext('2d');
const defs={bed:['침대',110,200,55,'#939d8b'],desk:['책상',180,75,74,'#d2b78f'],ldesk:['ㄱ자 책상',180,125,74,'#d2b78f'],chair:['의자',62,62,110,'#68736b'],sofa:['2인 소파',140,78,80,'#b2aa98'],wardrobe:['옷장',100,58,205,'#ddd9cf'],bookshelf:['책장',80,32,200,'#ddd8ca'],rack:['행거',120,50,175,'#495248'],cart:['카트',40,45,90,'#e3e2db'],box:['박스',50,40,35,'#b98c58'],monitor:['모니터',60,20,43,'#303835'],pc:['PC 본체',24,46,48,'#343b38'],laptop:['노트북',34,25,23,'#737c7c'],standby:['스탠바이미',68,44,140,'#e8e5dd'],partition:['파티션',120,12,180,'#bf9a70'],rug:['러그',160,200,2,'#c9c4b5'],kitchen:['싱크대',220,60,90,'#dedbd1'],bath:['화장실',150,170,240,'#d2d5d0'],door:['현관문',85,10,210,'#b7aa91'],window:['창문',180,10,115,'#aac9ce']};
Object.assign(defs,{lamp:['조명',35,35,150,'#d9c6a5'],mirror:['거울',45,35,160,'#c4cfc9'],curtain:['커튼 파티션',160,10,220,'#e2d9c9'],shelf:['선반',80,35,90,'#d5bd99'],drawers:['서랍장',45,45,70,'#d7d4c8'],table:['테이블',90,60,74,'#d2b78f'],plant:['화분',30,30,70,'#859578'],decor:['소품',25,25,30,'#d2bfa4']});
let undoProduct=null;
let id=1,view='2d',sel=null,scale=1,cam={a:-.65,e:.8},pan={x:0,y:0},drag=null,doc={name:'새 원룸',room:{w:380,d:550,h:240},objects:[]};
const T=[
['4.8평 세로형','4–6평',300,530,'세로형 현관주방',[['kitchen',30,380,230,58,90],['bath',220,435,140,150,0],['door',150,525,85,10,0],['window',150,5,180,10,0],['wardrobe',270,250,90,58,90]]],
['5.0평 미러형','4–6평',305,545,'주방 오른쪽',[['kitchen',275,385,230,58,90],['bath',80,442,145,155,0],['door',155,540,85,10,0],['window',155,5,180,10,0],['wardrobe',35,250,90,58,90]]],
['5.2평 가로형','4–6평',390,440,'와이드 창',[['kitchen',35,330,190,58,90],['bath',305,350,145,145,0],['door',195,435,85,10,0],['window',195,5,230,10,0],['wardrobe',360,190,95,58,90]]],
['5.6평 욕실정면','4–6평',340,545,'욕실 정면',[['bath',170,420,145,155,0],['kitchen',30,330,215,58,90],['door',110,540,85,10,0],['window',220,5,190,10,0],['wardrobe',310,205,90,58,90]]],
['6.0평 기본형','6–8평',365,545,'직사각형',[['kitchen',32,360,215,58,90],['bath',285,440,150,150,0],['door',155,540,85,10,0],['window',190,5,220,10,0],['wardrobe',335,235,100,58,90]]],
['6.3평 욕실정면','6–8평',380,550,'왼쪽 주방 · 수납벽',[['kitchen',32,350,225,58,90],['bath',155,428,150,165,0],['door',95,545,85,10,0],['window',250,5,205,10,0],['wardrobe',350,305,100,58,90],['bookshelf',350,200,90,32,90]]],
['6.5평 와이드창','6–8평',410,525,'홈오피스형',[['kitchen',32,385,190,58,90],['bath',320,420,145,150,0],['door',190,520,85,10,0],['window',220,5,285,10,0],['wardrobe',378,250,105,58,90]]],
['6.8평 코너창','6–8평',420,535,'양면 채광',[['kitchen',30,390,195,58,90],['bath',330,435,150,155,0],['door',175,530,85,10,0],['window',225,5,250,10,0],['window',415,170,170,10,90],['wardrobe',390,320,95,58,90]]],
['7.0평 수납벽','6–8평',430,540,'짐 많은 원룸',[['kitchen',32,395,190,58,90],['bath',120,440,145,160,0],['door',250,535,85,10,0],['window',215,5,230,10,0],['wardrobe',400,210,130,58,90],['bookshelf',400,365,150,32,90]]],
['7.2평 ㄱ자현관','6–8평',455,535,'현관 분리형',[['kitchen',32,395,185,58,90],['bath',120,430,150,165,0],['door',165,530,85,10,0],['window',255,5,250,10,0],['wardrobe',425,330,110,58,90]]],
['7.5평 욕실정면','6–8평',455,555,'싱크대 왼쪽',[['kitchen',32,405,225,58,90],['bath',150,445,150,165,0],['door',78,550,85,10,0],['window',450,210,205,10,90],['wardrobe',425,325,95,58,90],['bookshelf',425,435,110,32,90]]],
['7.8평 복도형','오피스텔',410,630,'붙박이 수납',[['kitchen',32,460,250,60,90],['bath',320,520,155,170,0],['door',205,625,90,10,0],['window',205,5,260,10,0],['wardrobe',378,360,150,60,90]]],
['8.0평 양면수납','오피스텔',430,615,'현관 수납형',[['kitchen',32,455,235,60,90],['bath',335,505,155,170,0],['door',210,610,90,10,0],['window',215,5,270,10,0],['wardrobe',398,360,175,60,90]]],
['8.5평 와이드','오피스텔',500,565,'업무공간 분리',[['kitchen',35,415,210,60,90],['bath',405,455,165,170,0],['door',235,560,90,10,0],['window',265,5,320,10,0],['wardrobe',468,275,140,60,90]]],
['9.0평 정방형','오피스텔',545,545,'3존 구성',[['kitchen',35,395,200,60,90],['bath',445,430,170,170,0],['door',250,540,90,10,0],['window',280,5,330,10,0],['wardrobe',510,275,145,60,90]]],
['9.0평 가로형','오피스텔',620,480,'와이드 창',[['kitchen',35,340,185,60,90],['bath',520,370,175,170,0],['door',285,475,90,10,0],['window',335,5,390,10,0],['wardrobe',588,250,150,60,90]]],
['8.8평 침대분리','1.5룸',470,620,'반분리형',[['kitchen',35,450,230,60,90],['bath',375,510,160,170,0],['door',205,615,90,10,0],['window',235,5,280,10,0],['wardrobe',438,330,140,60,90],['partition',175,190,180,12,90]]],
['9.5평 침실분리','1.5룸',500,630,'거실존 확보',[['kitchen',35,460,235,60,90],['bath',405,520,165,170,0],['door',220,625,90,10,0],['window',250,5,300,10,0],['wardrobe',468,350,135,60,90],['partition',205,180,240,12,90]]],
['10.0평 주방반분리','1.5룸',520,635,'주방 가림벽',[['kitchen',70,500,240,60,0],['bath',430,525,165,170,0],['door',250,630,90,10,0],['window',260,5,330,10,0],['wardrobe',488,330,150,60,90],['partition',185,465,190,12,0]]],
['11.0평 와이드','10평+',650,560,'업무·침실·휴식 3존',[['kitchen',40,405,200,60,90],['bath',545,450,175,175,0],['door',300,555,95,10,0],['window',340,5,400,10,0],['wardrobe',617,280,165,60,90]]]
];
const groups=['전체','4–6평','6–8평','오피스텔','1.5룸','10평+'];let group='전체';
function obj(type,x,z,w,d,r=0){let q=defs[type]||defs.box;return{id:id++,type,name:q[0],x,z,w:w||q[1],d:d||q[2],h:q[3],r,color:q[4]}}
function applyTpl(t){doc={name:t[0],room:{w:t[2],d:t[3],h:240},objects:t[5].map(a=>obj(...a))};let w=doc.room.w,d=doc.room.d;doc.objects.push(obj('bed',w*.30,d*.25,110,200,0),obj('desk',w*.72,d*.28,180,75,0),obj('chair',w*.72,d*.45),obj('standby',w*.55,d*.70));sel=null;fit();persist();renderAll()}
function renderTemplates(){let q=$('#q').value.toLowerCase();$('#groups').innerHTML=groups.map(g=>`<button class="chip ${g===group?'active':''}" data-g="${g}">${g}</button>`).join('');$('#templates').innerHTML=T.filter(t=>(group==='전체'||t[1]===group)&&(!q||(`${t[0]} ${t[4]} ${t[1]}`).toLowerCase().includes(q))).map((t,i)=>`<button class="tpl" data-i="${T.indexOf(t)}"><b>${t[0]} <span class="badge">${(t[2]*t[3]/10000/3.3058).toFixed(1)}평</span></b><small>${t[4]}</small><div class="mini"><i style="left:7%;top:8%;width:86%;height:84%"></i></div></button>`).join('')}
$('#groups').onclick=e=>{let b=e.target.closest('[data-g]');if(b){group=b.dataset.g;renderTemplates()}};$('#templates').onclick=e=>{let b=e.target.closest('[data-i]');if(b)applyTpl(T[+b.dataset.i])};$('#q').oninput=renderTemplates;
const addTypes=['lamp','mirror','curtain','shelf','drawers','table','plant','bed','desk','ldesk','chair','sofa','wardrobe','bookshelf','rack','cart','box','monitor','pc','laptop','standby','partition','rug'];$('#catalog').innerHTML=addTypes.map(t=>`<button data-add="${t}">${defs[t][0]}</button>`).join('');$('#catalog').onclick=e=>{let b=e.target.closest('[data-add]');if(!b)return;let t=b.dataset.add;doc.objects.push(obj(t,doc.room.w/2,doc.room.d/2));sel=doc.objects.at(-1);persist();renderAll()};
function fit(){let W=C.clientWidth,H=C.clientHeight;scale=Math.max(.08,Math.min((W-70)/doc.room.w,(H-100)/doc.room.d));pan={x:(W-doc.room.w*scale)/2,y:(H-doc.room.d*scale)/2}}
function xy(x,z){return{x:pan.x+x*scale,y:pan.y+z*scale}}
function inv(x,y){return{x:(x-pan.x)/scale,z:(y-pan.y)/scale}}
function boundingRect(o){let a=o.r*Math.PI/180,c=Math.cos(a),s=Math.sin(a),hw=o.w/2,hd=o.d/2;return [[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(p=>({x:o.x+p[0]*c-p[1]*s,z:o.z+p[0]*s+p[1]*c}))}
function rr(o){
 if(o.type!=='ldesk')return boundingRect(o);
 const g=o.geometry||{kind:'l',side:'right',mainDepthCm:Math.min(65,o.d*.55),returnWidthCm:Math.min(55,o.w*.3)},a=o.r*Math.PI/180;
 const points=[[-o.w/2,-o.d/2],[o.w/2,-o.d/2],[o.w/2,o.d/2],[o.w/2-g.returnWidthCm,o.d/2],[o.w/2-g.returnWidthCm,-o.d/2+g.mainDepthCm],[-o.w/2,-o.d/2+g.mainDepthCm]];
 return points.map(([x,z])=>{if(g.side==='left')x=-x;return{x:o.x+x*Math.cos(a)-z*Math.sin(a),z:o.z+x*Math.sin(a)+z*Math.cos(a)}});
}
function polyHit(p,o){let pts=rr(o),inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){let a=pts[i],b=pts[j];if(((a.z>p.z)!=(b.z>p.z))&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside}return inside}
function resize(){C.width=C.clientWidth*devicePixelRatio;C.height=C.clientHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);render()}
function render(){ctx.clearRect(0,0,C.clientWidth,C.clientHeight);view==='2d'?render2d():render3d()}
function render2d(){ctx.save();ctx.fillStyle='#fbfaf4';ctx.strokeStyle='#55634b';ctx.lineWidth=8;let p=xy(0,0);ctx.fillRect(p.x,p.y,doc.room.w*scale,doc.room.d*scale);ctx.strokeRect(p.x,p.y,doc.room.w*scale,doc.room.d*scale);for(let o of doc.objects){let pts=rr(o).map(v=>xy(v.x,v.z));ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(v=>ctx.lineTo(v.x,v.y));ctx.closePath();ctx.fillStyle=o.color;ctx.globalAlpha=o===sel?1:.82;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=o===sel?'#375c2e':'#7f8979';ctx.lineWidth=o===sel?3:1;ctx.stroke();if(scale>0.7){ctx.fillStyle='#273027';ctx.font='11px system-ui';ctx.textAlign='center';let c=xy(o.x,o.z);ctx.fillText(o.name,c.x,c.y+4)}}ctx.restore()}
function iso(x,z,y=0){let ca=Math.cos(cam.a),sa=Math.sin(cam.a);let X=x-doc.room.w/2,Z=z-doc.room.d/2;let rx=X*ca-Z*sa,rz=X*sa+Z*ca;let s=scale*.9;return{x:C.clientWidth/2+pan.x*.12+rx*s,y:C.clientHeight*.62+pan.y*.08+(rz*Math.sin(cam.e)-y*Math.cos(cam.e))*s*.62}}
function render3d(){let floor=[iso(0,0),iso(doc.room.w,0),iso(doc.room.w,doc.room.d),iso(0,doc.room.d)];ctx.beginPath();ctx.moveTo(floor[0].x,floor[0].y);floor.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#f5f1e7';ctx.fill();ctx.strokeStyle='#79836f';ctx.lineWidth=2;ctx.stroke();let os=[...doc.objects].sort((a,b)=>(a.z+a.x)-(b.z+b.x));for(let o of os){let base=rr(o),top=base.map(p=>iso(p.x,p.z,o.h)),bot=base.map(p=>iso(p.x,p.z,0));ctx.fillStyle=o.color;ctx.globalAlpha=.9;for(let i=0;i<base.length;i++){let j=(i+1)%base.length;ctx.beginPath();ctx.moveTo(bot[i].x,bot[i].y);ctx.lineTo(bot[j].x,bot[j].y);ctx.lineTo(top[j].x,top[j].y);ctx.lineTo(top[i].x,top[i].y);ctx.closePath();ctx.fillStyle=shade(o.color,i%2?.82:.68);ctx.fill()}ctx.beginPath();ctx.moveTo(top[0].x,top[0].y);top.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fillStyle=o.color;ctx.fill();ctx.strokeStyle=o===sel?'#31592d':'#65705f';ctx.lineWidth=o===sel?3:1;ctx.stroke();ctx.globalAlpha=1}}
function shade(hex,k){let n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return`rgb(${r*k|0},${g*k|0},${b*k|0})`}
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function changed(){dispatchEvent(new CustomEvent('1r:change'));}
function renderProp(){
 if(!sel){$('#prop').innerHTML='<div class="empty">캔버스에서 물건을 선택하세요.</div>';changed();return;}
 const esc=escapeHTML;
 $('#prop').innerHTML=`<h3>${esc(sel.name)}</h3><div class="field"><label for="object-name">이름</label><input id="object-name" data-k="name" value="${esc(sel.name)}" maxlength="120"></div>
 <div class="field"><label for="object-ownership">보유 상태</label><select id="object-ownership" data-k="ownership">${[['unknown','미정'],['owned','이미 보유'],['planned','구매 예정'],['fixed','집에 있던 옵션']].map(([v,l])=>`<option value="${v}" ${(sel.ownership||'unknown')===v?'selected':''}>${l}</option>`).join('')}</select></div>
 <div class="grid2">${[['w','가로 cm'],['d','깊이 cm'],['h','높이 cm'],['r','각도 °']].map(([k,l])=>`<div class="field"><label for="object-${k}">${l}</label><input id="object-${k}" data-k="${k}" type="number" min="${k==='r'?0:1}" max="${k==='r'?359:2000}" step="0.1" value="${sel[k]}"></div>`).join('')}</div>
 <div id="bindingStatus"></div><button id="findProducts" class="primary full-width">이 가구의 실제 상품 찾기</button>
 <div class="actions"><button id="p90">90° 회전</button><button id="pdel">삭제</button></div>`;
 $('#prop').onchange=e=>{const k=e.target.dataset.k;if(!k)return;
   if(k==='name')sel.name=e.target.value.slice(0,120);
   else if(k==='ownership')sel.ownership=e.target.value;
   else {const n=Number(e.target.value);if(!Number.isFinite(n)||(k!=='r'&&(n<1||n>2000))){e.target.value=sel[k];return;}sel[k]=k==='r'?((n%360)+360)%360:n;}
   persist();render();changed();
 };
 $('#findProducts').onclick=()=>dispatchEvent(new CustomEvent('1r:shop-open',{detail:{mode:'recommend'}}));
 $('#p90').onclick=()=>{sel.r=(sel.r+90)%360;persist();renderAll()};$('#pdel').onclick=removeSel;changed();
}
function removeSel(){if(!sel)return;doc.objects=doc.objects.filter(o=>o!==sel);sel=null;persist();renderAll()}
C.onpointerdown=e=>{C.setPointerCapture(e.pointerId);let r=C.getBoundingClientRect(),p=inv(e.clientX-r.left,e.clientY-r.top);if(view==='2d'){sel=[...doc.objects].reverse().find(o=>polyHit(p,o))||null;if(sel)drag={dx:p.x-sel.x,dz:p.z-sel.z};}else drag={sx:e.clientX,sy:e.clientY,a:cam.a,e:cam.e};renderProp();render()};C.onpointermove=e=>{if(!drag)return;let r=C.getBoundingClientRect();if(view==='2d'&&sel){let p=inv(e.clientX-r.left,e.clientY-r.top);sel.x=Math.max(0,Math.min(doc.room.w,p.x-drag.dx));sel.z=Math.max(0,Math.min(doc.room.d,p.z-drag.dz));render()}else if(view==='3d'){cam.a=drag.a+(e.clientX-drag.sx)*.008;cam.e=Math.max(.25,Math.min(1.25,drag.e+(e.clientY-drag.sy)*.006));render()}};onpointerup=()=>{if(drag){persist();drag=null}};C.onwheel=e=>{e.preventDefault();scale*=Math.exp(-e.deltaY*.001);scale=Math.max(.3,Math.min(3,scale));render()};
$('#rot').onclick=()=>{if(sel){sel.r=(sel.r+90)%360;persist();renderAll()}};$('#del').onclick=removeSel;$('#fit').onclick=()=>{fit();render()};$('#v2').onclick=()=>{view='2d';$('#v2').classList.add('active');$('#v3').classList.remove('active');fit();render()};$('#v3').onclick=()=>{view='3d';$('#v3').classList.add('active');$('#v2').classList.remove('active');render()};
function persist(){try{localStorage.setItem('1r-project',JSON.stringify(doc));$('#status').textContent=`${doc.objects.length}개 물건 · 자동 저장됨`;}catch{$('#status').textContent='브라우저 저장 공간을 확인하고 JSON으로 내보내세요.';}changed();}
$('#save').onclick=persist;$('#export').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));a.download='1R-layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};$('#load').onclick=()=>$('#file').click();$('#file').onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text());doc=normalizeDocument(x);sel=null;fit();persist();renderAll()}catch{alert('1R JSON 파일을 읽지 못했습니다.')}};$('#roomH').onchange=e=>{doc.room.h=+e.target.value;persist();render()};
function renderAll(){renderTemplates();renderProp();$('#roomH').value=doc.room.h;render()}
function normalizeDocument(value){
 if(!value||!value.room||!Array.isArray(value.objects)||value.objects.length>250)throw Error('invalid document');
 const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 if(!finite(value.room.w,100,3000)||!finite(value.room.d,100,3000)||!finite(value.room.h,100,600))throw Error('invalid room');
 const ids=new Set();
 const objects=value.objects.map((o,i)=>{
  if(!o||!defs[o.type]||!['w','d','h'].every(k=>finite(o[k],1,2000))||!['x','z'].every(k=>finite(o[k],-3000,5000))||!finite(o.r,-3600,3600))throw Error('invalid object');
  const next={id:i+1,type:o.type,name:String(o.name||defs[o.type][0]).slice(0,120),x:o.x,z:o.z,w:o.w,d:o.d,h:o.h,r:((o.r%360)+360)%360,color:/^#[0-9a-f]{6}$/i.test(o.color)?o.color:defs[o.type][4],ownership:['owned','planned','fixed'].includes(o.ownership)?o.ownership:'unknown'};
  if(o.geometry?.kind==='l'&&['left','right'].includes(o.geometry.side)&&finite(o.geometry.mainDepthCm,1,o.d)&&finite(o.geometry.returnWidthCm,1,o.w))next.geometry={kind:'l',side:o.geometry.side,mainDepthCm:o.geometry.mainDepthCm,returnWidthCm:o.geometry.returnWidthCm};
  if(o.commerce&&typeof o.commerce.optionId==='string'&&o.commerce.dimensions){next.commerce={optionId:o.commerce.optionId.slice(0,80),type:String(o.commerce.type||o.type).slice(0,30),productName:String(o.commerce.productName||'').slice(0,200),optionLabel:String(o.commerce.optionLabel||'').slice(0,200),dimensions:JSON.parse(JSON.stringify(o.commerce.dimensions)),boundAt:String(o.commerce.boundAt||'')};}
  return next;
 });id=objects.length+1;
 return {name:String(value.name||'불러온 원룸').slice(0,120),room:{w:value.room.w,d:value.room.d,h:value.room.h},objects};
}
window.OneR={
 getState:()=>structuredClone(doc),getSelected:()=>sel?structuredClone(sel):null,
 select(objectId){sel=doc.objects.find(o=>o.id===objectId)||null;renderAll();},
 setOwnership(objectId,ownership){if(!['owned','planned','fixed','unknown'].includes(ownership))return;const o=doc.objects.find(o=>o.id===objectId);if(o){o.ownership=ownership;persist();renderAll();}},
 applyProduct(option,targetId){
  const d=option.dimensions;if(!d||!['widthCm','depthCm','heightCm'].every(k=>Number.isFinite(d[k])&&d[k]>0&&d[k]<=2000)||!defs[option.type])throw Error('invalid product');
  let target=targetId!=null?doc.objects.find(o=>o.id===targetId):null;
  if(targetId!=null&&!target)throw Error('선택한 가구가 삭제되었습니다. 다시 선택하세요.');
  if(target&&target.type!==option.type)throw Error('선택한 가구와 상품 종류가 다릅니다.');
  if(!target&&doc.objects.length>=250)throw Error('최대 250개 물건까지 배치할 수 있습니다.');
  undoProduct=structuredClone(doc);
  if(!target){target=obj(option.type,doc.room.w/2,doc.room.d/2);doc.objects.push(target);}
  Object.assign(target,{name:option.product.name,w:d.widthCm,d:d.depthCm,h:d.heightCm,geometry:d.geometry?structuredClone(d.geometry):undefined,ownership:'planned',commerce:{optionId:option.id,type:option.type,productName:option.product.name,optionLabel:option.product.optionLabel,dimensions:structuredClone(d),boundAt:new Date().toISOString()}});
  sel=target;persist();renderAll();
 },
 undoProduct(){if(!undoProduct)return;doc=normalizeDocument(undoProduct);undoProduct=null;sel=null;persist();renderAll();},
};
try{let s=localStorage.getItem('1r-project');if(s)doc=normalizeDocument(JSON.parse(s));else applyTpl(T[5])}catch{applyTpl(T[5])}renderTemplates();requestAnimationFrame(()=>{fit();resize();renderAll()});addEventListener('resize',()=>{resize()});
