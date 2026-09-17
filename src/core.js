/* 1R — geometry and document model. Coordinates are centimetres.
   x: screen right / east; z: screen down / south; y: height. Angles clockwise in plan. */
'use strict';
window.RS = window.RS || {};
(function(R){
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)), rad=d=>d*Math.PI/180;
const uid=()=>globalThis.crypto?.randomUUID?.() || 'o'+Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rot=(x,z,r)=>{const a=rad(r);return{x:x*Math.cos(a)-z*Math.sin(a),z:x*Math.sin(a)+z*Math.cos(a)}};
const cat=[
 ['bed','침대','가구',110,200,55,'#919c88','bed'],
 ['desk','일자 책상','가구',180,75,74,'#d5bd99','desk'],
 ['ldesk','ㄱ자 책상','가구',180,125,74,'#d5bd99','desk'],
 ['chair','업무용 의자','가구',62,62,112,'#667068','chair'],
 ['sofa','2인 소파','가구',140,78,80,'#b2ac9b','sofa'],
 ['table','낮은 테이블','가구',85,50,38,'#bb956c','table'],
 ['bookshelf','책장','수납',80,32,200,'#e3dfd1','shelf'],
 ['wardrobe','옷장','수납',100,58,205,'#deddd2','shelf'],
 ['rack','옷걸이 행거','수납',120,50,175,'#404941','rack'],
 ['drawers','3단 서랍장','수납',40,45,62,'#e9e5dc','shelf'],
 ['cart','수납 카트','수납',40,45,90,'#e7e4db','cart'],
 ['boxStack','박스 10개','수납',100,45,175,'#b98d58','boxes'],
 ['box','박스 1개','수납',50,40,35,'#b98d58','box'],
 ['shelf','낮은 선반','수납',110,35,80,'#d7c09c','shelf'],
 ['monitor','모니터','업무',60,20,43,'#303a35','monitor'],
 ['laptop','노트북','업무',34,25,23,'#697478','laptop'],
 ['pc','데스크탑 본체','업무',24,46,48,'#323a37','pc'],
 ['standby','스탠바이미','업무',68,44,140,'#e9e5dc','tv'],
 ['partition','슬랫 파티션','공간분리',120,12,180,'#bd9b73','partition'],
 ['curtain','커튼 파티션','공간분리',180,8,225,'#dfd7c4','curtain'],
 ['rug','러그','공간분리',160,200,1,'#b8b39d','rug'],
 ['zone','동선 확보 구역','공간분리',80,150,1,'#b5c8b0','zone'],
 ['kitchen','싱크대 세트','구조',220,60,225,'#e2dfd6','kitchen'],
 ['bathroom','화장실','구조',150,170,240,'#d5d1c8','bath'],
 ['wall','내부 벽','구조',150,10,240,'#e8e4d9','wall'],
 ['door','출입문','구조',85,10,210,'#b6a990','door'],
 ['window','창문','구조',160,10,115,'#b7cccf','window'],
 ['microwave','전자레인지','생활',47,37,28,'#e9e6dd','pc'],
 ['fridge','냉장고','생활',55,60,150,'#deded8','shelf'],
 ['drying','접이식 건조대','생활',110,65,105,'#dbdfd9','rack'],
 ['plant','작은 화분','생활',32,32,65,'#718763','plant'],
 ['custom','직접 만든 가구','가구',60,60,70,'#b5b3a4','box']
].map(([type,name,category,w,d,h,color,icon])=>({type,name,category,w,d,h,color,icon}));
const def=t=>cat.find(a=>a.type===t)||cat[cat.length-1];
function object(type,x,z,extra={}){const a=def(type);return{id:uid(),type,name:a.name,x,z,w:a.w,d:a.d,h:a.h,r:0,e:0,color:a.color,visible:true,locked:false,ownership:'신규 / 미확정',parent:null,note:'',...extra};}
function defaults(){
 const objects=[];const put=(t,x,z,e={})=>{let o=object(t,x,z,e);objects.push(o);return o;};
 put('bathroom',75,85,{name:'화장실 · 정면',ownership:'기존 구조',locked:true});
 put('kitchen',30,306,{w:225,d:58,r:90,name:'싱크대 · 왼쪽',ownership:'기존 구조',locked:true});
 put('door',115,520,{name:'현관문',edge:2,t:0.7444,r:180,ownership:'기존 구조',locked:true,open:85});
 put('window',450,214,{name:'창문 · 오른쪽 벽',w:180,e:88,h:115,edge:1,t:0.41154,r:90,ownership:'기존 구조',locked:true});
 put('bed',316,82,{w:110,d:200,r:90,name:'기존 침대',ownership:'기존 방 가구'});
 put('shelf',188,82,{w:38,d:90,h:68,name:'침대 옆 선반',ownership:'기존 방 가구'});
 put('shelf',310,14,{w:240,d:24,h:44,e:126,name:'벽 선반',ownership:'기존 방 가구'});
 put('rack',412,218,{w:125,d:48,r:90,name:'옷가지 / 행거',ownership:'보유 / 기존'});
 put('bookshelf',431,351,{w:110,d:30,h:200,r:90,name:'기존 책장',ownership:'기존 방 가구'});
 put('cart',245,493,{w:40,d:42,h:93,name:'현관 오른쪽 카트',ownership:'기존 방 가구'});
 put('wardrobe',408,469,{w:82,d:60,h:195,r:90,name:'기존 옷장 · 위치 조정',ownership:'기존 방 가구'});
 put('boxStack',322,494,{w:100,d:40,h:175,count:10,columns:2,name:'보관 박스 10개',ownership:'내 짐'});
 const desk=put('desk',303,345,{w:180,d:75,name:'업무 책상 1800',ownership:'신규 검토'});
 [-61,0,61].forEach((dx,i)=>put('monitor',desk.x+dx,desk.z-20,{name:'모니터 '+(i+1),w:58,d:16,h:42,e:75,parent:desk.id,ownership:'내 짐'}));
 put('laptop',desk.x+56,desk.z+17,{e:75,parent:desk.id,ownership:'내 짐'});
 put('pc',desk.x+65,desk.z+2,{parent:desk.id,ownership:'내 짐'});
 put('chair',desk.x,425,{ownership:'내 짐'});
 put('standby',188,201,{r:270,name:'스탠바이미',ownership:'내 짐'});
 return{format:'room-studio-v1',version:1,name:'내 원룸 · 배치 초안',unit:'cm',createdAt:new Date().toISOString(),modifiedAt:new Date().toISOString(),room:{points:[{x:0,z:0},{x:450,z:0},{x:450,z:520},{x:0,z:520}],height:240,thickness:10,wallColor:'#e8e4d9',floorColor:'#d4c3a4',floor:'oak',verified:false,measured:false},objects,measurements:[],notes:'기준 도면의 방향: 현관 왼쪽 아래, 싱크대 왼쪽 중간, 화장실 왼쪽 위. 침대는 위쪽 가로, 창문은 오른쪽 벽. 초기 치수와 가구 위치는 미확정이며 실측 후 수정합니다.',inventory:[{type:'pc',name:'데스크탑',target:1},{type:'monitor',name:'모니터',target:3},{type:'laptop',name:'노트북',target:1},{type:'chair',name:'보유 의자',target:1},{type:'standby',name:'스탠바이미',target:1},{type:'box',name:'보관할 박스',target:10},{type:'rack',name:'옷 수납',target:1}],layoutVerified:false};
}
function rectangle(o){return [[-o.w/2,-o.d/2],[o.w/2,-o.d/2],[o.w/2,o.d/2],[-o.w/2,o.d/2]].map(([x,z])=>{const p=rot(x,z,o.r);return{x:o.x+p.x,z:o.z+p.z}})}
function inPoly(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.z>p.z)!=(b.z>p.z))&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside;}return inside;}
function area(poly){let a=0;poly.forEach((p,i)=>{const q=poly[(i+1)%poly.length];a+=p.x*q.z-q.x*p.z});return Math.abs(a/2)}
function bounds(poly){return{minX:Math.min(...poly.map(p=>p.x)),minZ:Math.min(...poly.map(p=>p.z)),maxX:Math.max(...poly.map(p=>p.x)),maxZ:Math.max(...poly.map(p=>p.z))}}
function nearestEdge(p,pts){let out={dist:Infinity};pts.forEach((a,i)=>{const b=pts[(i+1)%pts.length],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(!len)return;const t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(len*len),0,1),x=a.x+t*dx,z=a.z+t*dz,dist=Math.hypot(p.x-x,p.z-z);if(dist<out.dist)out={x,z,t,dist,edge:i,r:Math.atan2(dz,dx)*180/Math.PI,length:len};});return out;}
function attachOpening(o,room){if(o.type!=='door'&&o.type!=='window')return;const pts=room.points;const a=pts[o.edge],b=pts[(o.edge+1)%pts.length];if(!a||!b)return;const len=Math.hypot(b.x-a.x,b.z-a.z);if(len<10)return;o.w=Math.min(o.w,len-4);const margin=o.w/(2*len);o.t=clamp(o.t||0.5,margin,1-margin);o.x=a.x+(b.x-a.x)*o.t;o.z=a.z+(b.z-a.z)*o.t;o.r=Math.atan2(b.z-a.z,b.x-a.x)*180/Math.PI;}
function syncOpenings(s){s.objects.forEach(o=>attachOpening(o,s.room))}
function overlap(a,b,epsilon=1){for(const poly of[a,b])for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],nx=-(q.z-p.z),nz=q.x-p.x,ln=Math.hypot(nx,nz)||1;const ap=a.map(v=>(v.x*nx+v.z*nz)/ln),bp=b.map(v=>(v.x*nx+v.z*nz)/ln);if(Math.max(...ap)<=Math.min(...bp)+epsilon||Math.max(...bp)<=Math.min(...ap)+epsilon)return false;}return true;}
function isRelated(a,b,objs){if(a.id===b.parent||b.id===a.parent)return true;if(a.parent&&a.parent===b.parent)return true;if(a.group&&a.group===b.group)return true;return false;}
const nonSolid=['window','door','rug','zone','plant'];
function checks(s){const alerts=[];const os=s.objects.filter(o=>o.visible&&!nonSolid.includes(o.type));for(const o of os){if(!rectangle(o).every(p=>inPoly(p,s.room.points)||nearestEdge(p,s.room.points).dist<2))alerts.push({ids:[o.id],text:o.name+'이 방 외곽을 벗어납니다.',kind:'outside'});}for(let i=0;i<os.length;i++)for(let j=i+1;j<os.length;j++){const a=os[i],b=os[j];if(a.type==='bathroom'||b.type==='bathroom'){/* footprints include bathroom walls; useful, conservative warning */}if(isRelated(a,b,os))continue;if(a.e+a.h<=b.e+2||b.e+b.h<=a.e+2)continue;if(overlap(rectangle(a),rectangle(b),2))alerts.push({ids:[a.id,b.id],text:a.name+' / '+b.name+' 배치 영역이 겹칩니다.',kind:'overlap'});}return alerts;}
function countType(s,t){return s.objects.filter(o=>o.visible).reduce((n,o)=>n+(t==='box'?(o.type==='box'?1:o.type==='boxStack'?(o.count||10):0):t==='rack'?(['rack','wardrobe'].includes(o.type)?1:0):o.type===t?1:0),0)}
function validate(s){if(!s||s.format!=='room-studio-v1')throw Error('1R의 JSON 파일을 선택해 주세요.');if(!s.room||!Array.isArray(s.room.points)||s.room.points.length<3||s.room.points.length>40)throw Error('방 외곽선이 올바르지 않습니다.');if(!Array.isArray(s.objects)||s.objects.length>250)throw Error('최대 250개의 물건을 불러올 수 있습니다.');const num=(n,lo,hi)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi;for(const p of s.room.points)if(!num(p.x,-3000,5000)||!num(p.z,-3000,5000))throw Error('외곽 좌표 범위를 벗어났습니다.');if(!num(s.room.height,100,600)||!num(s.room.thickness,2,100))throw Error('벽 높이 / 두께가 올바르지 않습니다.');if(area(s.room.points)<10000)throw Error('방 면적이 너무 작습니다.');const cross=(a,b,p)=>(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x);const ps=s.room.points;for(let i=0;i<ps.length;i++)for(let j=i+2;j<ps.length;j++){if((j+1)%ps.length===i)continue;const a=ps[i],b=ps[(i+1)%ps.length],c=ps[j],d=ps[(j+1)%ps.length];if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)throw Error('방 외곽선이 교차합니다.');}
 const ids=new Set();s.name=String(s.name||'불러온 방').slice(0,100);s.notes=String(s.notes||'').slice(0,10000);s.room.wallColor=/^#[a-f0-9]{6}$/i.test(s.room.wallColor)?s.room.wallColor:'#e8e4d9';s.room.floorColor=/^#[a-f0-9]{6}$/i.test(s.room.floorColor)?s.room.floorColor:'#d4c3a4';s.room.floor=['oak','tile','concrete'].includes(s.room.floor)?s.room.floor:'oak';
 for(const o of s.objects){if(!o.id||ids.has(o.id)||typeof o.id!=='string'||o.id.length>120)throw Error('중복 또는 잘못된 물건 ID입니다.');ids.add(o.id);if(!cat.some(a=>a.type===o.type))throw Error('지원하지 않는 가구 종류입니다.');for(const k of['x','z'])if(!num(o[k],-3000,5000))throw Error('물건 위치가 올바르지 않습니다.');for(const k of['w','d','h'])if(!num(o[k],1,2000))throw Error('물건 크기가 올바르지 않습니다.');if(!num(o.e,0,1500)||!num(o.r,-36000,36000))throw Error('높이 / 각도가 올바르지 않습니다.');o.name=String(o.name||def(o.type).name).slice(0,100);o.note=String(o.note||'').slice(0,2000);o.color=/^#[a-f0-9]{6}$/i.test(o.color)?o.color:def(o.type).color;o.visible=o.visible!==false;o.locked=!!o.locked;o.parent=typeof o.parent==='string'?o.parent:null;o.group=typeof o.group==='string'?o.group.slice(0,100):null;o.count=clamp(Math.round(Number(o.count)||10),1,60);o.columns=clamp(Math.round(Number(o.columns)||2),1,6);if(['door','window'].includes(o.type)){if(!Number.isInteger(o.edge)||o.edge<0||o.edge>=s.room.points.length){const ed=nearestEdge(o,s.room.points);o.edge=ed.edge;o.t=ed.t}o.t=clamp(Number(o.t)||.5,0,1);o.open=clamp(Number(o.open)||85,0,160);}}
 for(const o of s.objects)if(!ids.has(o.parent))o.parent=null;
 if(s.referenceImage && (typeof s.referenceImage!=='string'||s.referenceImage.length>3000000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s.referenceImage)))delete s.referenceImage;
 s.measurements=Array.isArray(s.measurements)?s.measurements.filter(m=>m?.a&&m?.b&&[m.a.x,m.a.z,m.b.x,m.b.z].every(v=>num(v,-3000,5000))).slice(0,100):[];s.inventory=defaults().inventory;s.layoutVerified=!!s.layoutVerified;s.room.verified=!!s.room.verified;s.room.measured=!!s.room.measured;syncOpenings(s);return s;
}
function fromLegacy(old,scale=.6){if(old.format!=='room-layout-editor-v1'||!Array.isArray(old.objects)||!old.outline?.points)throw Error('이전 편집판의 JSON이 아닙니다.');if(!Number.isFinite(scale)||scale<=0||scale>10)throw Error('축척을 확인해 주세요.');const s=defaults();s.name=String(old.title||'이전 배치 가져오기');s.room.points=old.outline.points.map(p=>({x:p.x*scale,z:p.y*scale}));s.objects=[];const types={sink:'kitchen',bath:'bathroom',entrance:'door',boxes:'boxStack',shelves:'shelf',closet:'wardrobe',tv:'standby',storage:'shelf',desk:'desk',ldesk:'ldesk',cart:'cart',bed:'bed',chair:'chair',wardrobe:'wardrobe',bookshelf:'bookshelf',window:'window',rack:'rack',bathroom:'bathroom',kitchen:'kitchen',door:'door',shelf:'shelf',wall:'wall',partition:'partition'};
 for(const a of old.objects.slice(0,250)){const t=types[a.type]||'custom';const o=object(t,(a.x+a.w/2)*scale,(a.y+a.h/2)*scale,{w:Math.max(2,a.w*scale),d:Math.max(2,a.h*scale),r:a.angle||0,name:a.label||def(t).name,locked:false,note:a.note||''});if(t==='door'||t==='window'){const ed=nearestEdge(o,s.room.points);o.edge=ed.edge;o.t=ed.t;o.w=Math.max(o.w,o.d);o.d=10}if(t==='window'){o.e=88;o.h=115}if(t==='wall')o.h=s.room.height;s.objects.push(o)}s.notes='이전 편집판 좌표를 '+scale+' cm/도면 단위로 변환했습니다. 실측 축척은 아직 확인하지 않았습니다.\n'+(old.notes||'');s.room.verified=false;s.room.measured=false;return validate(s)}
function triangulate(points){const pts=points.map((p,i)=>({...p,i}));let signed=0;pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];signed+=p.x*q.z-q.x*p.z});if(signed<0)pts.reverse();const out=[];let guard=0;const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);while(pts.length>3&&guard++<1000){let cut=false;for(let i=0;i<pts.length;i++){const a=pts[(i+pts.length-1)%pts.length],b=pts[i],c=pts[(i+1)%pts.length];if(cross(a,b,c)<=.001)continue;if(pts.some(p=>p!==a&&p!==b&&p!==c&&cross(a,b,p)>=0&&cross(b,c,p)>=0&&cross(c,a,p)>=0))continue;out.push([a,b,c]);pts.splice(i,1);cut=true;break}if(!cut)break}if(pts.length===3)out.push([...pts]);return out;}
Object.assign(R,{clamp,rad,uid,clone,esc,rot,cat,def,object,defaults,rectangle,inPoly,area,bounds,nearestEdge,attachOpening,syncOpenings,overlap,checks,countType,validate,fromLegacy,triangulate});
})(window.RS);
