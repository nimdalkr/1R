import {CATEGORIES,categoryOf,verifiedOptions,recommend,eligibility,bindingMatches,placementWarnings,boxCapacity,safeAffiliateUrl,safeProductImage,httpsUrl} from '/shared/catalog.mjs';
if(document.readyState==='loading') await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));
const planner=window.OneR,$=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={open:false,tab:'recommend',options:[],status:null,loading:false,loaded:false,error:'',query:'',category:'',sort:'fit',includeOwned:false,maxWidth:'',maxDepth:'',maxHeight:'',box:{w:'',d:'',h:'',count:10},offers:new Map(),offerErrors:new Map(),busy:new Set(),selectedId:null,selectedOwnership:null};
const panel=document.createElement('aside');panel.className='shop-panel';panel.setAttribute('aria-label','규격 확인 상품');panel.inert=true;
panel.innerHTML=`<div class="shop-top"><button class="shop-close" aria-label="상품 패널 닫기">×</button><div class="shop-kicker">1R / VERIFIED CATALOG</div><h2>방에 맞는 실제 상품</h2><p>정확한 옵션과 조립 후 규격이 확인된 상품만.<br>내가 가진 물건은 그대로, 필요한 물건만 찾아보세요.</p></div><div class="shop-tabs" role="tablist"><button data-tab="recommend" role="tab">가구별 추천</button><button data-tab="search" role="tab">조건 검색</button><button data-tab="list" role="tab">구매 목록</button></div><div class="shop-scroll"><div class="shop-status" id="shopStatus"></div><div id="shopSelection"></div><div id="shopControls"></div><div id="shopResults"></div><div class="shop-feedback" id="shopFeedback" role="status"></div></div><div class="shop-footer">규격은 제조사·판매자 표기를 확인한 정보이며 직접 실측한 값이 아닙니다. 단순 3D 모델은 실제 외형과 다를 수 있습니다.<br><a class="muted-link" href="/admin/" target="_blank" rel="noopener">운영자 검수 도구</a> · <a class="muted-link" href="/docs/product-policy.html" target="_blank" rel="noopener">상품 정보 기준</a></div>`;
document.body.append(panel);
const modal=document.createElement('dialog');modal.className='shop-modal';document.body.append(modal);
const format=n=>new Intl.NumberFormat('ko-KR').format(n),cm=o=>`${o.widthCm} × ${o.depthCm} × ${o.heightCm} cm`;
function say(message){$('#shopFeedback').textContent=message;}
async function api(action,body=null) {
  const response=await fetch('/api/commerce?action='+encodeURIComponent(action),{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(14000),cache:'no-store'});
  let data;try{data=await response.json();}catch{throw Error('상품 서버를 찾을 수 없습니다. npm start 또는 Vercel에서 실행하세요.');}
  if(!response.ok)throw Error(data.error?.message||'요청을 처리하지 못했습니다.');return data;
}
function currentOffer(id){const o=state.offers.get(id);return o&&Date.now()-Date.parse(o.checkedAt)<300000?o:null;}
async function loadCatalog() {
  state.loading=true;state.error='';renderResults();
  try {
    const result=await api('catalog');state.options=verifiedOptions({schemaVersion:1,options:result.options});state.loaded=true;
    state.status=await api('status').catch(()=>null);
  }catch(error){state.error=error.message;}
  state.loading=false;render();updateBinding();
}
function open(tab='recommend') {
  state.open=true;state.tab=tab;panel.inert=false;panel.classList.add('open');
  const selected=planner?.getSelected();syncSelected(selected);render();if(!state.loaded&&!state.loading)loadCatalog();panel.querySelector('.shop-close').focus();
}
function close(){state.open=false;panel.classList.remove('open');panel.inert=true;$('#openShop')?.focus();}
function syncSelected(sel) {
  if((sel?.id??null)===state.selectedId&&(sel?.ownership||'unknown')===state.selectedOwnership)return false;
  const newId=(sel?.id??null)!==state.selectedId;state.selectedId=sel?.id??null;state.selectedOwnership=sel?.ownership||'unknown';state.includeOwned=false;
  if(newId){state.maxWidth=sel?String(sel.w):'';state.maxDepth=sel?String(sel.d):'';state.maxHeight='';}return true;
}
$('#openShop').onclick=()=>open('search');panel.querySelector('.shop-close').onclick=close;
addEventListener('1r:shop-open',e=>open(e.detail?.mode||'recommend'));
addEventListener('1r:change',()=>{const changedSelection=syncSelected(planner?.getSelected());updateBinding();if(state.open){renderSelection();if(changedSelection)renderControls();renderResults();}});
addEventListener('keydown',e=>{if(e.key==='Escape'&&state.open&&!modal.open)close();});
panel.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render();});
function render(){
 panel.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===state.tab);b.setAttribute('aria-selected',String(b.dataset.tab===state.tab));});
 $('#shopStatus').innerHTML=`<span class="pill">규격 확인 ${state.options.length} / 200</span><span class="pill ${state.status?.configured?'':'warn'}">${state.status?.configured?'서버 키 설정됨 · 연결 검증 별도':'API 키 미등록 또는 서버 미연결'}</span>`;
 renderSelection();renderControls();renderResults();
}
function renderSelection(){
 const o=planner?.getSelected();let html='';
 if(state.tab==='recommend')html=o?`<div class="shop-selection"><strong>${esc(o.name)}</strong>${o.w} × ${o.d} × ${o.h} cm · ${['owned','fixed'].includes(o.ownership)?'보유/기존 물건':'새 상품 검토'}<br><small>현재 위치를 유지하고, 선택한 상품의 실제 표기 규격으로 교체합니다.</small></div>`:'<div class="shop-selection"><strong>먼저 가구를 선택하세요</strong>평면도에서 책상·선반 등 물건을 선택하면 크기 조건을 가져옵니다.</div>';
 $('#shopSelection').innerHTML=html;
}
function renderControls(){
 const box=$('#shopControls');if(state.tab==='list'){box.innerHTML='';return;}
 const selected=planner?.getSelected(),owned=selected&&['owned','fixed'].includes(selected.ownership);
 box.innerHTML=`${state.tab==='recommend'&&owned?`<label class="owned-prompt"><input type="checkbox" id="shopOwned" ${state.includeOwned?'checked':''}> 이미 가진 물건입니다. 교체 상품도 찾아보기</label>`:''}<div class="shop-controls"><label>카탈로그 검색어<input id="shopQuery" type="search" maxlength="120" placeholder="예: 1800 책상, 좁은 선반" value="${esc(state.query)}"></label>${state.tab==='search'?`<label>상품군<select id="shopCategory"><option value="">전체 상품군</option>${CATEGORIES.map(c=>`<option value="${c.id}" ${state.category===c.id?'selected':''}>${c.name}</option>`).join('')}</select></label>`:''}<div class="shop-dims">${[['maxWidth','가로 상한'],['maxDepth','깊이 상한'],['maxHeight','높이 상한']].map(([k,l])=>`<label>${l} cm<input data-limit="${k}" type="number" min="1" max="2000" placeholder="제한 없음" value="${esc(state[k])}"></label>`).join('')}</div><label>정렬<select id="shopSort"><option value="fit">배치 치수 적합순</option><option value="best">베스트 출처 우선 (판매순 아님)</option><option value="name">상품명</option></select></label></div><p class="shop-caption">A 추천과 B 검색 모두 같은 검수 기준을 적용합니다. 쿠팡 전체 실시간 검색이 아닙니다. 가로·깊이 방향을 바꾸려면 상한값도 바꿔 확인하세요.</p>`;
 $('#shopSort').value=state.sort;
 $('#shopQuery').oninput=e=>{state.query=e.target.value;renderResults();};
 $('#shopCategory')?.addEventListener('change',e=>{state.category=e.target.value;renderResults();});
 $('#shopSort').onchange=e=>{state.sort=e.target.value;renderResults();};
 $('#shopOwned')?.addEventListener('change',e=>{state.includeOwned=e.target.checked;renderResults();});
 box.querySelectorAll('[data-limit]').forEach(e=>e.oninput=()=>{state[e.dataset.limit]=e.value;renderResults();});
}
function abstractImage(option){
 const d=option.dimensions;return `<svg viewBox="0 0 200 100" aria-label="상품 사진이 아닌 규격 예시"><path d="M32 33 112 12 172 40 91 66Z" fill="#dde6d1" stroke="#809171"/><path d="M32 33v29l59 28V66M172 40v29l-81 21" fill="#c6d3b7" stroke="#809171"/><path d="M23 72 81 99M100 98 185 76" stroke="#9dad8e" stroke-dasharray="3 3"/></svg><span class="model-tag">규격 모델 · 상품 사진 아님</span>`;
}
function card(option){
 const {product:p,dimensions:d}=option,offer=currentOffer(option.id),busy=state.busy.has(option.id),error=state.offerErrors.get(option.id);
 const image=safeProductImage(offer?.image),best=option.popularity?.source==='bestcategories';
 return `<article class="product-card" data-option="${option.id}"><div class="product-hero">${image?`<img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer">`:abstractImage(option)}</div><div class="product-body"><span class="pill">표기 규격 확인</span>${best?'<span class="pill">쿠팡 베스트 수집</span>':''}<h3 class="product-name">${esc(p.name)}</h3><div class="product-option">${esc(p.brand)} · ${esc(p.model)}<br>선택 옵션: ${esc(p.optionLabel)}</div><div class="product-dimensions">${cm(d)}</div><p class="product-reason">${d.geometry?.kind==='l'?`${d.geometry.side==='left'?'좌형':'우형'} · 주 상판 깊이 ${d.geometry.mainDepthCm}cm · 날개 폭 ${d.geometry.returnWidthCm}cm`:'조립 후 외곽 치수 · 선택한 조건 내 상품'}</p><div class="product-price">${offer?.price?`${format(offer.price)}원`:'가격 미확인'}<small>${offer?'확인 '+new Date(offer.checkedAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):'조회 시 동일 옵션만 매칭'}</small></div>${offer?`<p class="shop-caption">${esc(offer.notice)}</p>`:''}${error?`<div class="shop-feedback">${esc(error)}</div>`:''}<div class="product-buttons"><button data-price="${option.id}" ${busy?'disabled':''}>${busy?'확인 중…':'가격·사진 확인'}</button><button class="primary" data-preview="${option.id}">${state.tab==='recommend'&&planner.getSelected()?'교체 미리보기':'방에 배치'}</button><button data-buy="${option.id}" ${busy?'disabled':''}>쿠팡에서 보기</button></div><p class="product-disclosure">쿠팡 구매 링크는 파트너스 활동의 일환으로 일정액의 수수료를 제공받을 수 있습니다. 최종 가격·배송비·재고는 쿠팡에서 확인하세요.</p><details><summary>정확한 옵션 · 규격 근거</summary><p>옵션 ID: ${esc(p.itemId)} / 판매 옵션: ${esc(p.vendorItemId)}<br>규격 확인: ${esc(option.review.reviewedAt?.slice(0,10))} · 판매 상태 확인: ${esc(option.availability.checkedAt?.slice(0,10))}</p>${option.review.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${s.kind==='manufacturer'?'제조사':'판매자'} 규격 출처</a><br>${esc(s.note)}</p>`).join('')}${option.storage?.verified?'<p>내부 수납칸 정보 있음 (하중·적재 방식 별도 확인)</p>':'<p>내부 유효 치수 미확인: 박스 수납 가능 여부는 확정하지 않습니다.</p>'}</details></div></article>`;
}
function renderResults(){
 if(!state.open)return;
 if(state.tab==='list'){renderList();return;}
 const el=$('#shopResults'),selected=planner?.getSelected();
 if(state.loading){el.innerHTML='<div class="empty-catalog"><p>검수된 카탈로그를 불러오는 중입니다…</p></div>';return;}
 if(state.error){el.innerHTML=`<div class="empty-catalog"><h3>상품 서버에 연결하지 못했습니다</h3><p>${esc(state.error)}</p><button class="shop-retry" id="retryCatalog">다시 확인</button></div>`;$('#retryCatalog').onclick=loadCatalog;return;}
 if(state.tab==='recommend'&&selected&&['owned','fixed'].includes(selected.ownership)&&!state.includeOwned){el.innerHTML='<div class="empty-catalog"><h3>이미 가진 물건은 다시 권하지 않아요</h3><p>구매 목록에서도 제외됩니다. 교체가 필요할 때 위의 체크를 켜세요.</p></div>';return;}
 if(state.tab==='recommend'&&!selected){el.innerHTML='';return;}
 if(!state.options.length){el.innerHTML='<div class="empty-catalog"><div class="empty-mark">0</div><h3>검수된 상품을 준비하고 있습니다</h3><p>미확인 상품이나 가상의 상품으로 채우지 않습니다. API 키를 등록하면 운영자가 베스트·검색 후보를 수집할 수 있고, 정확한 옵션과 치수를 확인한 뒤 공개합니다.</p><a href="/admin/" target="_blank" rel="noopener">운영자 상품 검수 열기 →</a></div>';return;}
 const constraints={query:state.query,category:state.tab==='search'?state.category:'',type:state.tab==='recommend'?selected?.type:'',sort:state.sort};
 for(const k of ['maxWidth','maxDepth','maxHeight']){const n=Number(state[k]);constraints[k]=Number.isFinite(n)&&n>0?n:null;}
 const rows=recommend(state.options,constraints);
 el.innerHTML=`<div class="shop-count"><span>${rows.length}개 옵션 · 미확인 상품 제외</span><button id="refreshCatalog">새로 확인</button></div>${rows.length?`<div class="product-grid">${rows.map(card).join('')}</div>`:'<div class="empty-catalog"><h3>조건에 맞는 규격 확인 상품이 없습니다</h3><p>치수 상한이나 상품군을 조정해 보세요. 규격 미확인 상품을 대신 추천하지는 않습니다.</p></div>'}`;
 $('#refreshCatalog').onclick=loadCatalog;wireCards(el);
}
function wireCards(el){
 el.querySelectorAll('[data-price]').forEach(b=>b.onclick=()=>getOffer(b.dataset.price));
 el.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));
 el.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>preview(b.dataset.preview));
 el.querySelectorAll('img').forEach(img=>img.onerror=()=>{img.alt='상품 이미지를 불러오지 못했습니다';img.removeAttribute('src');});
}
async function getOffer(id){
 if(state.busy.has(id))return;state.busy.add(id);state.offerErrors.delete(id);renderResults();
 try{state.offers.set(id,await api('offer',{optionId:id}));}
 catch(error){state.offerErrors.set(id,error.message);say(error.message);}
 finally{state.busy.delete(id);renderResults();}
}
async function buy(id){
 if(state.busy.has(id))return;
 state.busy.add(id);const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;
 try{const link=await api('link',{optionId:id}),safe=safeAffiliateUrl(link.url);if(!safe)throw Error('안전한 구매 링크를 확인하지 못했습니다.');if(popup)popup.location=safe;else {say('팝업이 차단되었습니다. 아래 링크를 눌러주세요.');const a=document.createElement('a');a.href=safe;a.target='_blank';a.rel='sponsored noopener noreferrer';a.textContent='쿠팡 구매 링크 열기';$('#shopFeedback').append(' ',a);}}
 catch(error){popup?.close();say(error.message);}
 finally{state.busy.delete(id);}
}
function preview(id){
 const option=state.options.find(o=>o.id===id);if(!option||!eligibility(option).eligible){say('이 옵션은 재확인이 필요합니다.');return;}
 const selected=state.tab==='recommend'?planner.getSelected():null,doc=planner.getState(),d=option.dimensions;
 const candidate={...(selected||{id:'preview',x:doc.room.w/2,z:doc.room.d/2,r:0}),type:option.type,name:option.product.name,w:d.widthCm,d:d.depthCm,h:d.heightCm,geometry:d.geometry};
 const warnings=placementWarnings(candidate,doc.objects,doc.room);
 modal.innerHTML=`<div class="preview-inner"><div class="shop-kicker">EXACT OPTION / PLACEMENT</div><h3>${selected?'상품 교체 미리보기':'상품 배치 미리보기'}</h3><p>${esc(option.product.name)}<br>${esc(option.product.optionLabel)}</p><div class="preview-compare">${selected?`현재: ${selected.w} × ${selected.d} × ${selected.h} cm<br>`:''}<b>적용: ${cm(d)}</b></div>${warnings.length?`<div class="preview-warnings">${warnings.map(w=>esc(w)).join('<br>')}</div>`:'<p>현재 입력한 외곽 치수상 중첩을 찾지 못했습니다.</p>'}<p>위치와 방 구조는 바꾸지 않습니다. 통로·문 열림·걸레받이·반입 경로는 별도 확인하세요. 미리보기는 단순 형상이며 설치를 보장하지 않습니다.</p><div class="preview-actions"><button id="cancelProduct">취소</button><button id="confirmProduct" class="primary">${warnings.length?'겹침을 확인했고 적용':'이 규격으로 적용'}</button></div></div>`;
 modal.showModal();$('#cancelProduct').onclick=()=>modal.close();$('#confirmProduct').onclick=()=>{
   try{planner.applyProduct(option,selected?.id);modal.close();say('실제 옵션 규격을 적용했습니다. 위치와 방 구조는 유지했습니다.');const undo=document.createElement('button');undo.textContent='상품 적용 되돌리기';undo.onclick=()=>{planner.undoProduct();say('상품 적용을 되돌렸습니다.');};$('#shopFeedback').append(' ',undo);}
   catch(error){modal.close();say(error.message);}
 };
}
function updateBinding(){
 const o=planner?.getSelected(),box=$('#bindingStatus');if(!box)return;
 if(!o?.commerce){box.textContent='';return;}
 const match=bindingMatches(o),current=state.options.find(p=>p.id===o.commerce.optionId);
 box.className='commerce-binding'+(!match||!current?' warn':'');
 box.textContent=!match?'사용자 수정 치수 · 연결한 실제 상품 규격과 다릅니다.':!state.loaded?'연결된 상품 · 현재 검수 상태 확인 전':!current?'연결된 상품 · 판매/규격 재확인 필요':'연결된 상품의 표기 규격과 일치';
}
function renderList(){
 const rows=planner.getState().objects.filter(o=>o.ownership==='planned'&&o.commerce),el=$('#shopResults');
 let subtotal=0,unknown=0;
 const html=rows.map(o=>{
   const p=state.options.find(p=>p.id===o.commerce.optionId),bound=bindingMatches(o),offer=currentOffer(p?.id),ok=!!p&&bound;
   if(ok&&offer?.price)subtotal+=offer.price;else unknown++;
   return `<div class="shopping-row"><b>${esc(o.commerce.productName)}</b>${esc(o.commerce.optionLabel)}<br>${o.w} × ${o.d} × ${o.h} cm<br><span class="pill ${ok?'':'warn'}">${!bound?'규격 변경됨 · 구매 전 재확인':!p?'검수 상태 재확인 필요':'구매 예정 · 규격 일치'}</span><p>${ok&&offer?.price?format(offer.price)+'원':'가격 미확인'}</p>${ok?`<button data-price="${p.id}">가격 확인</button><button data-buy="${p.id}">쿠팡에서 보기</button>`:''}<button data-owned="${o.id}">이미 보유로 변경</button></div>`;
 }).join('');
 el.innerHTML=`<div class="shopping-summary">확인된 옵션 가격 소계<br><strong>${format(subtotal)}원</strong><br>가격/규격 미확인 ${unknown}개 제외 · 배송비 별도<br>이미 보유하거나 집에 있던 가구는 포함하지 않습니다.</div>${rows.length?html:'<div class="empty-catalog"><h3>아직 연결한 구매 상품이 없습니다</h3><p>규격 확인 상품을 방에 배치하면 이곳에 모입니다. 기존 가구를 구매 예정으로만 바꿔도, 실제 상품을 연결하기 전에는 가격을 추정하지 않습니다.</p></div>'}<p class="product-disclosure">쿠팡 구매 링크는 파트너스 활동의 일환으로 일정액의 수수료를 제공받을 수 있습니다. 최종 가격·배송비·재고는 쿠팡에서 확인하세요.</p>`;
 wireCards(el);el.querySelectorAll('[data-owned]').forEach(b=>b.onclick=()=>planner.setOwnership(Number(b.dataset.owned),'owned'));
}
// No browsing, dragging, keystroke or startup event calls the Coupang upstream API.
// Only explicit price/link buttons and authenticated admin sourcing do so.
setInterval(()=>{if(state.open&&state.offers.size)renderResults();},60000);
