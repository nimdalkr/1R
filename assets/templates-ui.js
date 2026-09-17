/* 1R v1.3 — truthful template thumbnails and apply confirmation. */
'use strict';
(()=>{
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
 const color={kitchen:'#e4d8bf',bath:'#d8ddd8',wardrobe:'#ddd7ca',bookshelf:'#ddd7ca',partition:'#b99876',window:'#b9d6dc',door:'#b8ab94'};
 function svg(t){
  const [name,group,w,d,feature,items]=t,pad=12;
  const body=items.map(([type,x,z,rw,rd,rot=0])=>`<rect class="fixture ${type}" x="${x-rw/2}" y="${z-rd/2}" width="${rw}" height="${rd}" fill="${color[type]||'#dedfd9'}" transform="rotate(${rot} ${x} ${z})"><title>${type}</title></rect>`).join('');
  return `<svg class="template-mini-svg" viewBox="${-pad} ${-pad} ${w+pad*2} ${d+pad*2}" role="img" aria-label="${name} 구조 미리보기" preserveAspectRatio="xMidYMid meet"><rect class="room" x="0" y="0" width="${w}" height="${d}" rx="3"/>${body}</svg>`;
 }
 function decorate(){
  document.querySelectorAll('#templates [data-i]').forEach(card=>{
   const i=Number(card.dataset.i),mini=card.querySelector('.mini');if(!mini||!T[i])return;
   const marker=`${i}:${card.querySelector('b')?.textContent||''}`;if(mini.dataset.structurePreview===marker)return;
   mini.dataset.structurePreview=marker;mini.innerHTML=svg(T[i]);
  });
 }
 const dialog=document.createElement('dialog');dialog.className='template-dialog';document.body.append(dialog);
 let allowApply=false,current=null,currentCard=null;
 function openPreview(i,card){
  const t=T[i];if(!t)return;current=i;currentCard=card;
  const area=(t[2]*t[3]/10000/3.3058).toFixed(1);
  dialog.innerHTML=`<div class="template-dialog-inner"><div class="template-dialog-head"><div><h2>${t[0]}</h2><p class="template-meta">약 ${area}평 · ${t[1]} · ${t[4]}</p></div><button class="dialog-close" aria-label="닫기">×</button></div><div class="template-preview">${svg(t)}</div><div class="template-legend"><span><i style="background:${color.kitchen}"></i>주방</span><span><i style="background:${color.bath}"></i>욕실</span><span><i style="background:${color.wardrobe}"></i>수납</span><span><i style="background:${color.window}"></i>창문</span></div><div class="template-warning">예시 구조입니다. 적용한 뒤 실제 집 치수에 맞게 수정하세요.</div><div class="template-actions"><button class="cancel-template">취소</button><button class="apply-template">이 구조로 시작</button></div></div>`;
  dialog.querySelector('.dialog-close').onclick=()=>dialog.close();dialog.querySelector('.cancel-template').onclick=()=>dialog.close();
  dialog.querySelector('.apply-template').onclick=()=>{allowApply=true;dialog.close();currentCard?.click();};
  dialog.showModal();
 }
 const templates=document.querySelector('#templates');
 templates?.addEventListener('click',e=>{const card=e.target.closest('[data-i]');if(!card)return;if(allowApply){allowApply=false;return;}e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPreview(Number(card.dataset.i),card);},true);
 const observer=new MutationObserver(()=>requestAnimationFrame(decorate));if(templates)observer.observe(templates,{childList:true,subtree:true});decorate();
 const collapse=document.querySelector('#collapseStructure'),expand=document.querySelector('#expandStructure');
 function setCollapsed(value){document.body.classList.toggle('structure-collapsed',value);collapse?.setAttribute('aria-pressed',String(value));requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));}
 collapse?.addEventListener('click',()=>setCollapsed(true));expand?.addEventListener('click',()=>setCollapsed(false));
})();
