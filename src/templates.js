/* 1R — common Korean studio / officetel starter templates.
   These are generalized planning templates, not measured plans of a specific property. */
'use strict';
window.RS = window.RS || {};
(function(R){
const T=[];
const rect=(w,d)=>[{x:0,z:0},{x:w,z:0},{x:w,z:d},{x:0,z:d}];
const sqM=(points)=>R.area(points)/10000;
function O(type,x,z,extra={}){return{type,x,z,...extra}}
function add(id,name,group,w,d,description,tags,objects,opts={}){
 const points=opts.points||rect(w,d), area=sqM(points), pyeong=area/3.3058;
 T.push({id,name,group,w,d,description,tags,objects,points,height:opts.height||240,starter:opts.starter||'standard',pyeong:+pyeong.toFixed(1),area:+area.toFixed(1)});
}
// 4–6평: 작은 원룸에서 흔한 현관 주방 + 욕실 집중형.
add('micro-4-8-long','4.8평 세로형 · 주방 왼쪽','4–6평',300,530,'폭이 좁고 깊은 구축·소형 원룸을 단순화한 형태. 현관에서 주방과 욕실을 먼저 지나 생활공간으로 들어갑니다.',['세로형','현관주방','소형'],[
 O('kitchen',30,380,{w:230,d:58,r:90,name:'일자 주방'}),O('bathroom',220,435,{w:140,d:150,name:'욕실'}),O('door',150,530,{w:85,name:'현관문'}),O('window',150,0,{w:180,name:'창문'}),O('wardrobe',270,250,{w:90,d:58,r:90,name:'붙박이장'})
],{starter:'long'});
add('micro-5-0-mirror','5.0평 세로형 · 주방 오른쪽','4–6평',305,545,'현관 우측에 일자 주방, 반대편에 욕실이 붙는 좁은 직사각형 원룸.',['세로형','미러형','소형'],[
 O('kitchen',275,385,{w:230,d:58,r:90,name:'일자 주방'}),O('bathroom',80,442,{w:145,d:155,name:'욕실'}),O('door',155,545,{w:85,name:'현관문'}),O('window',155,0,{w:180,name:'창문'}),O('wardrobe',35,250,{w:90,d:58,r:90,name:'붙박이장'})
],{starter:'long-mirror'});
add('micro-5-2-wide','5.2평 가로형 · 창가 생활존','4–6평',390,440,'세로 길이가 짧아 침대와 책상을 창가 쪽에서 나란히 배치하기 쉬운 소형 타입.',['가로형','와이드창','소형'],[
 O('kitchen',35,330,{w:190,d:58,r:90,name:'현관 주방'}),O('bathroom',305,350,{w:145,d:145,name:'욕실'}),O('door',195,440,{w:85,name:'현관문'}),O('window',195,0,{w:230,name:'와이드 창'}),O('wardrobe',360,190,{w:95,d:58,r:90,name:'붙박이장'})
],{starter:'wide'});
add('micro-5-6-bath-front','5.6평 · 욕실 정면형','4–6평',340,545,'현관 정면에 욕실문이 보이고 한쪽 벽에 주방이 이어지는 한국 소형 원룸에서 자주 보는 구성.',['욕실정면','주방일자','소형'],[
 O('bathroom',170,420,{w:145,d:155,name:'정면 욕실'}),O('kitchen',30,330,{w:215,d:58,r:90,name:'왼쪽 주방'}),O('door',110,545,{w:85,name:'현관문'}),O('window',220,0,{w:190,name:'창문'}),O('wardrobe',310,205,{w:90,d:58,r:90,name:'붙박이장'})
],{starter:'frontbath'});
// 6–8평: 일반적인 원룸 / 도시형생활주택.
add('studio-6-0-basic','6.0평 기본 직사각형','6–8평',365,545,'주방·욕실을 현관 쪽에 모으고 창가를 생활공간으로 비워두는 기본형.',['기본형','직사각형','창가생활'],[
 O('kitchen',32,360,{w:215,d:58,r:90,name:'일자 주방'}),O('bathroom',285,440,{w:150,d:150,name:'욕실'}),O('door',155,545,{w:85,name:'현관문'}),O('window',190,0,{w:220,name:'창문'}),O('wardrobe',335,235,{w:100,d:58,r:90,name:'붙박이장'})
],{starter:'standard'});
add('studio-6-3-frontbath','6.3평 · 현관 정면 욕실','6–8평',380,550,'현관 정면 욕실, 왼쪽 일자 싱크대, 오른쪽 수납벽을 갖는 실용적인 구조.',['욕실정면','수납벽','직사각형'],[
 O('kitchen',32,350,{w:225,d:58,r:90,name:'왼쪽 주방'}),O('bathroom',155,428,{w:150,d:165,name:'정면 욕실'}),O('door',95,550,{w:85,name:'현관문'}),O('window',250,0,{w:205,name:'창문'}),O('wardrobe',350,305,{w:100,d:58,r:90,name:'현관 수납장'}),O('bookshelf',350,200,{w:90,d:32,r:90,name:'수납 선반'})
],{starter:'frontbath'});
add('studio-6-5-windowdesk','6.5평 · 와이드 창형','6–8평',410,525,'창 폭을 넓게 쓰는 타입. 창 아래 긴 책상이나 침대+책상 병렬 배치에 유리합니다.',['와이드창','홈오피스','가로형'],[
 O('kitchen',32,385,{w:190,d:58,r:90,name:'주방'}),O('bathroom',320,420,{w:145,d:150,name:'욕실'}),O('door',190,525,{w:85,name:'현관문'}),O('window',220,0,{w:285,name:'와이드 창'}),O('wardrobe',378,250,{w:105,d:58,r:90,name:'붙박이장'})
],{starter:'windowdesk'});
add('studio-6-8-corner','6.8평 · 코너창형','6–8평',420,535,'두 면에 채광이 들어오는 코너 타입을 단순화했습니다. 창을 막지 않는 가구배치가 핵심입니다.',['코너창','채광','가로형'],[
 O('kitchen',30,390,{w:195,d:58,r:90,name:'주방'}),O('bathroom',330,435,{w:150,d:155,name:'욕실'}),O('door',175,535,{w:85,name:'현관문'}),O('window',225,0,{w:250,name:'정면 창'}),O('window',420,170,{w:170,name:'측면 창'}),O('wardrobe',390,320,{w:95,d:58,r:90,name:'붙박이장'})
],{starter:'corner'});
add('studio-7-0-longwall','7.0평 · 긴 수납벽형','6–8평',430,540,'한쪽 벽을 붙박이장·책장·행거로 길게 쓰는 타입. 짐이 많은 1인 가구에 유리합니다.',['수납벽','짐많음','직사각형'],[
 O('kitchen',32,395,{w:190,d:58,r:90,name:'주방'}),O('bathroom',120,440,{w:145,d:160,name:'욕실'}),O('door',250,540,{w:85,name:'현관문'}),O('window',215,0,{w:230,name:'창문'}),O('wardrobe',400,210,{w:130,d:58,r:90,name:'긴 붙박이장'}),O('bookshelf',400,365,{w:150,d:32,r:90,name:'수납 선반'})
],{starter:'storage'});
add('studio-7-2-lentry','7.2평 · ㄱ자 현관형','6–8평',455,535,'현관이 살짝 꺾여 생활공간이 바로 노출되지 않는 형태. 입구 수납과 파티션 계획이 쉽습니다.',['ㄱ자','현관분리','프라이버시'],[
 O('kitchen',32,395,{w:185,d:58,r:90,name:'주방'}),O('bathroom',120,430,{w:150,d:165,name:'욕실'}),O('door',165,535,{w:85,name:'현관문'}),O('wall',270,480,{w:110,d:10,r:90,name:'현관 가림벽'}),O('window',255,0,{w:250,name:'창문'}),O('wardrobe',425,330,{w:110,d:58,r:90,name:'붙박이장'})
],{starter:'lentry'});
add('studio-7-5-userlike','7.5평 · 싱크대 왼쪽 / 욕실 정면','6–8평',455,555,'현관 왼쪽에 싱크대, 정면에 욕실, 오른쪽으로 바로 생활공간이 열리는 타입.',['욕실정면','왼쪽주방','생활공간우측'],[
 O('kitchen',32,405,{w:225,d:58,r:90,name:'왼쪽 싱크대'}),O('bathroom',150,445,{w:150,d:165,name:'정면 화장실'}),O('door',78,555,{w:85,name:'현관문'}),O('window',455,210,{w:205,name:'오른쪽 창문'}),O('wardrobe',425,325,{w:95,d:58,r:90,name:'붙박이장'}),O('bookshelf',425,435,{w:110,d:32,r:90,name:'책장'})
],{starter:'userlike'});
// 7–10평 오피스텔: 현관 집중형 + 붙박이장.
add('officetel-7-8-corridor','7.8평 오피스텔 · 현관 복도형','오피스텔',410,630,'현관에서 주방·욕실·수납이 이어지고 안쪽 창가에 넓은 생활존이 남는 전형적인 오피스텔형.',['오피스텔','복도형','붙박이장'],[
 O('kitchen',32,460,{w:250,d:60,r:90,name:'빌트인 주방'}),O('bathroom',320,520,{w:155,d:170,name:'욕실'}),O('door',205,630,{w:90,name:'현관문'}),O('window',205,0,{w:260,name:'창문'}),O('wardrobe',378,360,{w:150,d:60,r:90,name:'붙박이장'}),O('fridge',65,540,{name:'빌트인 냉장고'})
],{starter:'officetel'});
add('officetel-8-0-galley','8.0평 오피스텔 · 양면 현관수납','오피스텔',430,615,'현관 양쪽에 수납과 주방을 두고, 중앙 동선을 길게 확보하는 타입.',['오피스텔','양면수납','세로형'],[
 O('kitchen',32,455,{w:235,d:60,r:90,name:'빌트인 주방'}),O('bathroom',335,505,{w:155,d:170,name:'욕실'}),O('door',210,615,{w:90,name:'현관문'}),O('window',215,0,{w:270,name:'창문'}),O('wardrobe',398,360,{w:175,d:60,r:90,name:'현관 붙박이장'}),O('fridge',70,545,{name:'냉장고'})
],{starter:'officetel'});
add('officetel-8-5-wide','8.5평 오피스텔 · 와이드형','오피스텔',500,565,'폭이 넓어 침대와 업무공간을 좌우로 나누기 쉬운 오피스텔 타입.',['오피스텔','와이드','홈오피스'],[
 O('kitchen',35,415,{w:210,d:60,r:90,name:'빌트인 주방'}),O('bathroom',405,455,{w:165,d:170,name:'욕실'}),O('door',235,565,{w:90,name:'현관문'}),O('window',265,0,{w:320,name:'와이드 창'}),O('wardrobe',468,275,{w:140,d:60,r:90,name:'붙박이장'}),O('fridge',72,510,{name:'냉장고'})
],{starter:'wide'});
add('officetel-9-0-square','9.0평 정방형 오피스텔','오피스텔',545,545,'정방형에 가까워 침실·업무·휴식 3개 존으로 나누기 쉬운 구조.',['정방형','오피스텔','3존'],[
 O('kitchen',35,395,{w:200,d:60,r:90,name:'주방'}),O('bathroom',445,430,{w:170,d:170,name:'욕실'}),O('door',250,545,{w:90,name:'현관문'}),O('window',280,0,{w:330,name:'와이드 창'}),O('wardrobe',510,275,{w:145,d:60,r:90,name:'붙박이장'}),O('fridge',75,490,{name:'냉장고'})
],{starter:'square'});
add('officetel-9-0-wide','9.0평 가로형 오피스텔','오피스텔',620,480,'가로폭이 넓어 창가 데스크와 침대를 분리하기 쉬운 와이드 타입.',['가로형','오피스텔','와이드창'],[
 O('kitchen',35,340,{w:185,d:60,r:90,name:'주방'}),O('bathroom',520,370,{w:175,d:170,name:'욕실'}),O('door',285,480,{w:90,name:'현관문'}),O('window',335,0,{w:390,name:'와이드 창'}),O('wardrobe',588,250,{w:150,d:60,r:90,name:'붙박이장'}),O('fridge',75,425,{name:'냉장고'})
],{starter:'wide'});
// 1.5룸 / 반분리형: 내부 벽으로 침실 또는 주방을 느슨하게 분리.
add('onehalf-8-8-bedzone','8.8평 반분리형 · 침대존','1.5룸',470,620,'짧은 내벽으로 침대만 가려 원룸의 개방감과 1.5룸의 분리감을 동시에 노리는 타입.',['1.5룸','침대분리','파티션'],[
 O('kitchen',35,450,{w:230,d:60,r:90,name:'주방'}),O('bathroom',375,510,{w:160,d:170,name:'욕실'}),O('door',205,620,{w:90,name:'현관문'}),O('window',235,0,{w:280,name:'창문'}),O('wardrobe',438,330,{w:140,d:60,r:90,name:'붙박이장'}),O('wall',175,190,{w:180,d:10,r:90,name:'침대 가림벽'})
],{starter:'semi'});
add('onehalf-9-5-slider','9.5평 1.5룸 · 침실 분리','1.5룸',500,630,'침실을 한쪽 코너로 분리하고 나머지를 거실·업무존으로 쓰는 1.5룸형.',['1.5룸','침실분리','거실존'],[
 O('kitchen',35,460,{w:235,d:60,r:90,name:'주방'}),O('bathroom',405,520,{w:165,d:170,name:'욕실'}),O('door',220,630,{w:90,name:'현관문'}),O('window',250,0,{w:300,name:'창문'}),O('wardrobe',468,350,{w:135,d:60,r:90,name:'붙박이장'}),O('wall',205,180,{w:240,d:10,r:90,name:'침실 분리벽'}),O('door',205,265,{w:80,name:'침실 슬라이딩문'})
],{starter:'semi'});
add('onehalf-10-kitchen','10.0평 1.5룸 · 주방 반분리','1.5룸',520,635,'주방을 짧은 벽 뒤로 숨기고 생활공간을 넓게 확보하는 타입.',['1.5룸','주방분리','와이드'],[
 O('kitchen',70,500,{w:240,d:60,name:'반분리 주방'}),O('bathroom',430,525,{w:165,d:170,name:'욕실'}),O('door',250,635,{w:90,name:'현관문'}),O('window',260,0,{w:330,name:'창문'}),O('wardrobe',488,330,{w:150,d:60,r:90,name:'붙박이장'}),O('wall',185,465,{w:190,d:10,name:'주방 가림벽'})
],{starter:'square'});
add('onehalf-10-5-cornerbed','10.5평 1.5룸 · 코너 침실','1.5룸',540,645,'코너 침실을 반투명 파티션이나 커튼으로 나누기 좋은 형태.',['1.5룸','코너침실','파티션'],[
 O('kitchen',35,475,{w:230,d:60,r:90,name:'주방'}),O('bathroom',445,535,{w:170,d:170,name:'욕실'}),O('door',230,645,{w:90,name:'현관문'}),O('window',270,0,{w:330,name:'창문'}),O('wardrobe',508,360,{w:150,d:60,r:90,name:'붙박이장'}),O('wall',210,190,{w:220,d:10,r:90,name:'침실 경계벽'}),O('wall',130,300,{w:160,d:10,name:'침실 경계벽'})
],{starter:'semi'});
// 넓은 원룸 / 특수형.
add('large-11-wide','11.0평 와이드 원룸','10평+',650,560,'업무존·침실존·휴식존을 분리해도 중앙 동선을 확보하기 쉬운 넓은 원룸.',['와이드','3존','10평+'],[
 O('kitchen',40,405,{w:200,d:60,r:90,name:'주방'}),O('bathroom',545,450,{w:175,d:175,name:'욕실'}),O('door',300,560,{w:95,name:'현관문'}),O('window',340,0,{w:400,name:'와이드 창'}),O('wardrobe',617,280,{w:165,d:60,r:90,name:'붙박이장'}),O('fridge',80,505,{name:'냉장고'})
],{starter:'large'});
add('large-12-square','12.0평 정방형 원룸','10평+',700,570,'큰 책상·소파·박스 수납까지 한 공간에 넣기 쉬운 정방형 대형 원룸.',['정방형','10평+','짐많음'],[
 O('kitchen',40,405,{w:205,d:60,r:90,name:'주방'}),O('bathroom',595,455,{w:180,d:175,name:'욕실'}),O('door',325,570,{w:95,name:'현관문'}),O('window',365,0,{w:430,name:'와이드 창'}),O('wardrobe',665,295,{w:175,d:60,r:90,name:'붙박이장'}),O('bookshelf',665,125,{w:130,d:32,r:90,name:'수납 선반'}),O('fridge',82,515,{name:'냉장고'})
],{starter:'large'});
add('special-7-veranda','7.0평 · 창가 확장존형','특수형',440,530,'창가 쪽을 작업·식사·건조 등 유연한 확장존으로 남기는 배치용 템플릿.',['창가존','건조','홈오피스'],[
 O('kitchen',32,390,{w:195,d:58,r:90,name:'주방'}),O('bathroom',340,430,{w:150,d:160,name:'욕실'}),O('door',185,530,{w:85,name:'현관문'}),O('window',220,0,{w:290,name:'와이드 창'}),O('wardrobe',408,290,{w:115,d:58,r:90,name:'붙박이장'}),O('wall',220,95,{w:300,d:8,name:'창가 존 경계'})
],{starter:'windowdesk'});
add('special-8-lshape','8.0평 · ㄱ자 외곽형','특수형',500,590,'외벽이나 샤프트 때문에 한쪽이 파인 ㄱ자형 원룸을 단순화했습니다.',['ㄱ자외곽','비정형','특수형'],[
 O('kitchen',35,435,{w:220,d:60,r:90,name:'주방'}),O('bathroom',155,485,{w:155,d:175,name:'욕실'}),O('door',80,590,{w:90,name:'현관문'}),O('window',360,0,{w:250,name:'창문'}),O('wardrobe',468,320,{w:145,d:60,r:90,name:'붙박이장'})
],{points:[{x:0,z:0},{x:500,z:0},{x:500,z:590},{x:125,z:590},{x:125,z:520},{x:0,z:520}],starter:'lentry'});
add('special-8-two-window','8.0평 · 양면 창형','특수형',470,565,'정면과 측면 두 창을 살리는 가구배치를 시작하기 위한 코너형 템플릿.',['양면창','코너','채광'],[
 O('kitchen',35,415,{w:205,d:60,r:90,name:'주방'}),O('bathroom',380,460,{w:160,d:170,name:'욕실'}),O('door',210,565,{w:90,name:'현관문'}),O('window',250,0,{w:270,name:'정면 창'}),O('window',470,180,{w:190,name:'측면 창'}),O('wardrobe',438,340,{w:115,d:60,r:90,name:'붙박이장'})
],{starter:'corner'});

function opening(o,points){
 if(o.type!=='door'&&o.type!=='window')return o;
 if(Number.isInteger(o.edge))return o;
 const e=R.nearestEdge({x:o.x,z:o.z},points);o.edge=e.edge;o.t=e.t;return o;
}
function starterObjects(t){
 const b=R.bounds(t.points),w=b.maxX-b.minX,d=b.maxZ-b.minZ,items=[];
 const put=(type,x,z,extra={})=>items.push(O(type,x,z,extra));
 const left=b.minX+80,right=b.maxX-80,top=b.minZ+110,bottom=b.maxZ-100;
 const mode=t.starter;
 if(mode==='long-mirror'){
  put('bed',right-5,top+65,{r:90,name:'침대'});put('desk',left+10,top+55,{w:130,d:60,r:90,name:'컴팩트 책상'});put('chair',left+75,top+55,{name:'의자'});
 }else if(mode==='windowdesk'){
  put('desk',(b.minX+b.maxX)/2,top-55,{w:180,d:70,name:'창가 책상'});put('chair',(b.minX+b.maxX)/2,top+35,{name:'의자'});put('bed',left,top+150,{name:'침대'});
 }else if(['wide','square','large'].includes(mode)){
  put('bed',left+15,top+65,{name:'침대'});put('desk',right-40,top+35,{w:180,d:70,r:90,name:'업무 책상'});put('chair',right-120,top+35,{name:'의자'});put('standby',(b.minX+b.maxX)/2,bottom-45,{name:'스탠바이미'});
 }else if(['semi'].includes(mode)){
  put('bed',left+15,top+40,{name:'침대'});put('desk',right-55,top+70,{w:160,d:70,r:90,name:'업무 책상'});put('chair',right-135,top+70,{name:'의자'});put('sofa',right-85,bottom-90,{r:90,name:'2인 소파'});
 }else if(mode==='storage'){
  put('bed',left+10,top+70,{name:'침대'});put('desk',right-60,top+45,{w:160,d:70,r:90,name:'업무 책상'});put('chair',right-140,top+45,{name:'의자'});put('boxStack',right-35,bottom-90,{w:90,d:40,h:175,count:10,columns:2,name:'박스 10개'});
 }else if(mode==='officetel'){
  put('bed',left+20,top+70,{name:'침대'});put('desk',right-55,top+60,{w:160,d:70,r:90,name:'업무 책상'});put('chair',right-135,top+60,{name:'의자'});put('standby',(b.minX+b.maxX)/2,bottom-30,{name:'스탠바이미'});
 }else if(mode==='userlike'){
  put('bed',left+20,top+90,{r:90,name:'침대'});put('desk',right-65,top+80,{w:165,d:70,r:90,name:'업무 책상'});put('chair',right-145,top+80,{name:'의자'});put('cart',right-20,bottom-70,{r:90,name:'현관 오른쪽 카트'});
 }else{
  put('bed',left+10,top+75,{name:'침대'});put('desk',right-50,top+65,{w:150,d:65,r:90,name:'업무 책상'});put('chair',right-125,top+65,{name:'의자'});
 }
 return items;
}
function templateDocument(id,includeFurniture=false){
 const t=T.find(a=>a.id===id);if(!t)throw Error('템플릿을 찾을 수 없습니다.');
 const base=R.defaults(),objects=[];
 const put=(spec)=>{const a=R.object(spec.type,spec.x,spec.z,{...spec});delete a.edgeTmp;opening(a,t.points);if(['bathroom','kitchen','wall','window','door'].includes(a.type)){a.ownership='템플릿 구조';a.locked=false}objects.push(a);return a};
 t.objects.forEach(s=>put({...s}));
 if(includeFurniture)starterObjects(t).forEach(s=>put({...s,ownership:s.type==='standby'?'내 짐':'추천 시작 가구'}));
 const now=new Date().toISOString();
 const doc={format:'room-studio-v1',version:1,name:t.name+' · 새 프로젝트',unit:'cm',createdAt:now,modifiedAt:now,room:{points:R.clone(t.points),height:t.height,thickness:10,wallColor:'#e8e4d9',floorColor:'#d4c3a4',floor:'oak',verified:false,measured:false},objects,measurements:[],notes:`템플릿: ${t.name}. ${t.description}\n이 템플릿은 보편적인 원룸 구조를 단순화한 시작점이며 특정 건물의 실측 도면이 아닙니다. 계약서/도면 또는 직접 잰 치수로 수정하세요.`,inventory:R.clone(base.inventory),layoutVerified:false,templateId:t.id};
 R.syncOpenings(doc);return R.validate(doc);
}
function templateSvg(t){
 const b=R.bounds(t.points),pad=12,w=b.maxX-b.minX+pad*2,h=b.maxZ-b.minZ+pad*2,pts=t.points.map(p=>`${p.x},${p.z}`).join(' ');
 const shapes=t.objects.map(o=>{const a=R.def(o.type),ww=o.w||a.w,dd=o.d||a.d,rr=o.r||0,x=o.x,y=o.z;const color={bathroom:'#c9d7d4',kitchen:'#d7c6a8',wardrobe:'#d8d5ca',bookshelf:'#d9d4c3',wall:'#b8b4aa',fridge:'#cbd0cf',door:'#a9b493',window:'#a7c9ce'}[o.type]||'#dad8cf';return `<rect x="${x-ww/2}" y="${y-dd/2}" width="${ww}" height="${dd}" rx="4" fill="${color}" opacity=".9" transform="rotate(${rr} ${x} ${y})"/>`}).join('');
 return `<svg viewBox="${b.minX-pad} ${b.minZ-pad} ${w} ${h}" aria-hidden="true"><polygon points="${pts}" fill="#f6f4ec" stroke="#4d5947" stroke-width="7" stroke-linejoin="round"/>${shapes}</svg>`;
}
Object.assign(R,{roomTemplates:T,templateDocument,templateSvg});
})(window.RS);
