/* 1R v1.3 — user-facing copy and chrome cleanup. Keeps planner/commerce logic untouched. */
'use strict';
(()=>{
 const $=s=>document.querySelector(s);
 const textNode=(label,text)=>{if(!label)return;const n=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(n)n.textContent=text;};
 function updateChrome(){
  const state=window.OneR?.getState?.();
  const selected=window.OneR?.getSelected?.();
  const project=$('#projectTitle'),save=$('#saveState'),title=$('#propTitle');
  if(project)project.textContent=state?.name||'내 원룸';
  if(save)save.textContent='이 브라우저에 저장됨';
  if(title)title.textContent=selected?.name||'방 설정';
  const empty=$('#prop .empty');if(empty)empty.textContent='가구를 선택하세요.';
  const find=$('#findProducts');if(find)find.textContent='상품 찾기';
 }
 function cleanShop(){
  const panel=$('.shop-panel');if(!panel)return;
  const kicker=panel.querySelector('.shop-kicker');if(kicker)kicker.hidden=true;
  const h2=panel.querySelector('.shop-top h2');if(h2)h2.textContent='가구 찾기';
  const intro=panel.querySelector('.shop-top p');if(intro)intro.textContent='규격 확인 상품';
  const tabs=panel.querySelectorAll('[data-tab]');
  const names={recommend:'추천',search:'검색',list:'구매 목록'};tabs.forEach(b=>{if(names[b.dataset.tab])b.textContent=names[b.dataset.tab];});
  const pills=panel.querySelectorAll('#shopStatus .pill');
  if(pills[0]){const m=pills[0].textContent.match(/(\d+)/);pills[0].textContent=`상품 ${m?.[1]||0}개`;}
  if(pills[1])pills[1].hidden=true;
  textNode(panel.querySelector('#shopQuery')?.closest('label'),'검색');
  textNode(panel.querySelector('#shopCategory')?.closest('label'),'상품군');
  const sort=panel.querySelector('#shopSort');if(sort){const best=[...sort.options].find(o=>o.value==='best');if(best)best.textContent='베스트 참고순';}
  panel.querySelectorAll('.shop-caption').forEach(p=>{if(p.textContent.includes('A 추천과 B 검색')||p.textContent.includes('쿠팡 전체 실시간 검색'))p.hidden=true;});
  const owned=panel.querySelector('.empty-catalog h3');
  if(owned?.textContent.includes('이미 가진 물건')){owned.textContent='보유 중';const p=owned.parentElement.querySelector('p');if(p)p.textContent='필요하면 교체 상품을 찾아볼 수 있습니다.';}
  const empty=panel.querySelector('.empty-catalog h3');
  if(empty?.textContent.includes('검수된 상품')){empty.textContent='상품 추천 준비 중';const p=empty.parentElement.querySelector('p');if(p)p.textContent='가구 배치는 계속할 수 있습니다.';}
  panel.querySelectorAll('a[href="/admin/"]').forEach(a=>a.hidden=true);
 }
 function observe(){
  const bodyObserver=new MutationObserver(()=>{updateChrome();cleanShop();});
  bodyObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
  updateChrome();cleanShop();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
 addEventListener('1r:change',()=>requestAnimationFrame(updateChrome));
})();
