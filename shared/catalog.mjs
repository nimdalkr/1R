/** Shared catalog rules. No API credentials, network calls or fabricated product data. */
export const POLICY = Object.freeze({ maxOptions: 200, dimensionReviewDays: 90, availabilityReviewDays: 7, popularityDays: 30 });
export const CATEGORIES = Object.freeze([
  { id:'desk', name:'책상 · 작업 테이블', limit:35, types:['desk','ldesk','table'] },
  { id:'storage', name:'선반 · 서랍 · 카트', limit:45, types:['bookshelf','shelf','drawers','cart','box'] },
  { id:'clothing', name:'옷장 · 행거', limit:25, types:['wardrobe','rack'] },
  { id:'divider', name:'파티션 · 커튼', limit:25, types:['partition','curtain'] },
  { id:'seating', name:'침대 · 의자 · 소파', limit:35, types:['bed','chair','sofa'] },
  { id:'decor', name:'조명 · 러그 · 소품', limit:35, types:['lamp','rug','mirror','plant','decor'] }
]);
const DAY = 86400000;
export const categoryOf = type => CATEGORIES.find(c=>c.types.includes(type))?.id || '';
export const fresh = (value, days, now=Date.now()) => {
  const t = Date.parse(value || '');
  return Number.isFinite(t) && t <= now + 300000 && now-t <= days*DAY;
};
const positive = n => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 2000;
export function httpsUrl(value) {
  try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password && u.port==='' ? u.href : null; } catch { return null; }
}
export function parseProductUrl(value) {
  const safe=httpsUrl(value); if(!safe) return null;
  const u=new URL(safe);
  if(!['www.coupang.com','coupang.com','m.coupang.com'].includes(u.hostname)) return null;
  const m=u.pathname.match(/^\/(?:vp|vm)\/products\/(\d+)\/?$/); if(!m) return null;
  const itemId=u.searchParams.get('itemId'), vendorItemId=u.searchParams.get('vendorItemId');
  if(!/^\d{1,20}$/.test(m[1]) || !/^\d{1,20}$/.test(itemId||'') || !/^\d{1,20}$/.test(vendorItemId||'')) return null;
  if(u.searchParams.getAll('itemId').length!==1 || u.searchParams.getAll('vendorItemId').length!==1) return null;
  return { productId:m[1], itemId, vendorItemId,
    url:`https://www.coupang.com/vp/products/${m[1]}?itemId=${itemId}&vendorItemId=${vendorItemId}` };
}
export function trackingIdentity(value) {
  const safe=httpsUrl(value); if(!safe) return null;
  const direct=parseProductUrl(safe); if(direct) return direct;
  const u=new URL(safe); if(u.hostname!=='link.coupang.com') return null;
  const productId=u.searchParams.get('pageKey'), itemId=u.searchParams.get('itemId'), vendorItemId=u.searchParams.get('vendorItemId');
  if(![productId,itemId,vendorItemId].every(v=>/^\d{1,20}$/.test(v||''))) return null;
  if(['pageKey','itemId','vendorItemId'].some(k=>u.searchParams.getAll(k).length!==1)) return null;
  return {productId,itemId,vendorItemId};
}
export function sameOption(a,b) {
  return !!a && !!b && ['productId','itemId','vendorItemId'].every(k=>String(a[k])===String(b[k]));
}
export function safeAffiliateUrl(value) {
  const safe=httpsUrl(value); if(!safe) return null;
  const h=new URL(safe).hostname;
  return ['link.coupang.com','coupa.ng'].includes(h) ? safe : null;
}
export function safeProductImage(value) {
  const safe=httpsUrl(value); if(!safe) return null;
  const h=new URL(safe).hostname;
  return ['coupang.com','coupangcdn.com'].some(d=>h===d||h.endsWith('.'+d)) ? safe : null;
}
export function verificationErrors(o) {
  const errors=[];
  if(!o || typeof o!=='object') return ['상품 객체가 아닙니다.'];
  if(!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(o.id||'')) errors.push('옵션 ID가 올바르지 않습니다.');
  if(!CATEGORIES.some(c=>c.id===o.category&&c.types.includes(o.type))) errors.push('상품군과 가구 종류가 일치하지 않습니다.');
  const p=o.product||{}, identity=parseProductUrl(p.url);
  if(!identity || !sameOption(identity,p)) errors.push('상품·itemId·vendorItemId와 정확한 옵션 URL이 필요합니다.');
  for(const k of ['name','brand','model','optionLabel','searchKeyword']) {
    if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>(k==='searchKeyword'?120:200)) errors.push(`상품 ${k}를 입력하세요(최대 200자).`);
  }
  const d=o.dimensions||{};
  if(!['widthCm','depthCm','heightCm'].every(k=>positive(d[k]))) errors.push('조립 후 가로·깊이·높이(cm)가 필요합니다.');
  if(d.basis!=='assembled') errors.push('포장 치수가 아닌 조립 후 치수만 허용됩니다.');
  if(o.type==='ldesk') {
    const g=d.geometry||{};
    if(g.kind!=='l'||!['left','right'].includes(g.side)||!positive(g.mainDepthCm)||!positive(g.returnWidthCm)||g.mainDepthCm>=d.depthCm||g.returnWidthCm>=d.widthCm)
      errors.push('ㄱ자 책상은 주 상판 깊이·날개 폭·좌/우형을 확인해야 합니다.');
  } else if(d.geometry&&d.geometry.kind!=='rect') errors.push('지원되지 않는 형상입니다.');
  const r=o.review||{};
  if(r.optionConfirmed!==true||r.dimensionsConfirmed!==true) errors.push('정확한 옵션과 조립 후 규격 확인에 체크하세요.');
  if(typeof r.reviewer!=='string'||!r.reviewer.trim()||r.reviewer.length>100) errors.push('검수자를 기록하세요.');
  if(!Number.isFinite(Date.parse(r.reviewedAt||''))) errors.push('검수 일자가 필요합니다.');
  if(!Array.isArray(r.sources)||!r.sources.length||r.sources.length>10) errors.push('규격 출처를 1~10개 기록하세요.');
  else if(r.sources.some(s=>!s||!httpsUrl(s.url)||!['manufacturer','seller'].includes(s.kind)||typeof s.note!=='string'||!s.note.trim()||!Number.isFinite(Date.parse(s.observedAt||'')))) errors.push('제조사/판매자 출처 URL·확인일·옵션과 치수를 확인한 내용을 입력하세요.');
  const a=o.availability||{};
  if(!['available','unavailable','unknown'].includes(a.status)) errors.push('판매 상태를 선택하세요.');
  if(a.status==='available'&&(!sameOption(parseProductUrl(a.sourceUrl),p)||!Number.isFinite(Date.parse(a.checkedAt||'')))) errors.push('선택 옵션의 판매 상태 확인 URL과 일자가 필요합니다.');
  if(o.storage?.verified) {
    const s=o.storage;
    if(!httpsUrl(s.sourceUrl)||!Number.isFinite(Date.parse(s.reviewedAt||''))||!Array.isArray(s.compartments)||!s.compartments.length||s.compartments.length>30) errors.push('수납 내부 치수의 출처·확인일·칸 정보가 필요합니다.');
    else if(s.compartments.some(c=>!c||!['widthCm','depthCm','heightCm'].every(k=>positive(c[k]))||!Number.isInteger(c.count)||c.count<1||c.count>100)) errors.push('각 수납칸의 내부 치수와 개수를 확인하세요.');
  }
  return errors;
}
export function eligibility(o,now=Date.now()) {
  const reasons=[];
  if(o?.review?.status!=='verified') reasons.push('규격 검수 미승인');
  reasons.push(...verificationErrors(o));
  if(!fresh(o?.review?.reviewedAt,POLICY.dimensionReviewDays,now)) reasons.push('규격 재확인 필요');
  if(Array.isArray(o?.review?.sources)&&o.review.sources.some(s=>!s||!fresh(s.observedAt,POLICY.dimensionReviewDays,now))) reasons.push('규격 출처 재확인 필요');
  if(o?.availability?.status!=='available') reasons.push('구매 가능 상태 미확인');
  if(!fresh(o?.availability?.checkedAt,POLICY.availabilityReviewDays,now)) reasons.push('판매 상태 재확인 필요');
  return {eligible:reasons.length===0,reasons:[...new Set(reasons)]};
}
export function catalogErrors(doc) {
  if(!doc||doc.schemaVersion!==1||!Array.isArray(doc.options)) return ['schemaVersion: 1, options 배열이 필요합니다.'];
  const errors=[], ids=new Set(), tuples=new Set();
  if(doc.options.length>POLICY.maxOptions) errors.push(`카탈로그는 최대 ${POLICY.maxOptions}개 옵션입니다.`);
  for(const o of doc.options) {
    if(!o||typeof o!=='object'){errors.push('상품 객체가 올바르지 않습니다.');continue;}
    if(!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(o.id||'')) errors.push('유효한 옵션 ID가 필요합니다.');
    if(ids.has(o.id)) errors.push(`중복 옵션 ID: ${o.id}`); ids.add(o.id);
    const key=o.product?['productId','itemId','vendorItemId'].map(k=>o.product[k]).join(':'):'';
    if(key && !key.includes('undefined')) { if(tuples.has(key)) errors.push(`중복 구매 옵션: ${o.id}`);tuples.add(key); }
    if(!['pending','verified','needs_review','retired'].includes(o.review?.status)) errors.push(`${o.id}: 검수 상태 오류`);
    if(o.review?.status==='verified') errors.push(...verificationErrors(o).map(e=>`${o.id}: ${e}`));
  }
  for(const c of CATEGORIES) if(doc.options.filter(o=>o?.category===c.id&&o.review?.status==='verified').length>c.limit) errors.push(`${c.name} 승인 상한 ${c.limit}개 초과`);
  return errors;
}
export function publicOption(o) {
  return {
    id:o.id,category:o.category,type:o.type,product:{...o.product},dimensions:structuredClone(o.dimensions),
    review:{...o.review,reviewer:'1R 검수',notes:undefined},availability:{...o.availability},
    popularity:o.popularity?{...o.popularity}:null,storage:o.storage?structuredClone(o.storage):null
  };
}
export function verifiedOptions(catalog,now=Date.now()) {
  if(catalogErrors(catalog).length) return [];
  return catalog.options.filter(o=>eligibility(o,now).eligible).map(publicOption);
}
export function recommend(options,{type='',category='',query='',maxWidth=null,maxDepth=null,maxHeight=null,sort='fit'}={},now=Date.now()) {
  const q=query.toLocaleLowerCase('ko').trim();
  const rows=options.filter(o=>eligibility(o,now).eligible&&(!type||o.type===type)&&(!category||o.category===category)).filter(o=>!q||[o.product.name,o.product.brand,o.product.model,o.product.optionLabel].join(' ').toLocaleLowerCase('ko').includes(q)).filter(o=> {
    const d=o.dimensions;return (!maxWidth||d.widthCm<=maxWidth)&&(!maxDepth||d.depthCm<=maxDepth)&&(!maxHeight||d.heightCm<=maxHeight);
  });
  const delta=o=>['widthCm','depthCm','heightCm'].reduce((s,k,i)=>{const lim=[maxWidth,maxDepth,maxHeight][i];return s+(lim?Math.abs(lim-o.dimensions[k])/lim:0);},0);
  const best=o=>o.popularity?.source==='bestcategories'&&fresh(o.popularity.observedAt,POLICY.popularityDays,now)?1:0;
  rows.sort((a,b)=> {
    if(sort==='name') return a.product.name.localeCompare(b.product.name,'ko');
    // No sales ranking claim; best-category membership is only a source signal.
    return (sort==='fit'?delta(a)-delta(b):0)||best(b)-best(a)||a.product.name.localeCompare(b.product.name,'ko');
  });
  return rows;
}
export function boxCapacity(option,box,now=Date.now()) {
  const s=option.storage;
  if(!s?.verified||!fresh(s.reviewedAt,POLICY.dimensionReviewDays,now)||!['w','d','h'].every(k=>positive(box[k]))) return null;
  // Axis-aligned uniform arrangement only, not an optimal bin-packing or load guarantee.
  return s.compartments.reduce((n,c)=>n+Math.floor(c.widthCm/box.w)*Math.floor(c.depthCm/box.d)*Math.floor(c.heightCm/box.h)*c.count,0);
}
export function footprint(o) {
  const g=o.geometry;
  const pts=o.type==='ldesk'&&g?.kind==='l'?[
    [-o.w/2,-o.d/2],[o.w/2,-o.d/2],[o.w/2,o.d/2],
    [o.w/2-g.returnWidthCm,o.d/2],[o.w/2-g.returnWidthCm,-o.d/2+g.mainDepthCm],[-o.w/2,-o.d/2+g.mainDepthCm]
  ]:[[-o.w/2,-o.d/2],[o.w/2,-o.d/2],[o.w/2,o.d/2],[-o.w/2,o.d/2]];
  if(o.type==='ldesk'&&g?.side==='left') pts.forEach(p=>p[0]=-p[0]);
  const a=(o.r||0)*Math.PI/180;
  return pts.map(([x,z])=>({x:o.x+x*Math.cos(a)-z*Math.sin(a),z:o.z+x*Math.sin(a)+z*Math.cos(a)}));
}
function sat(a,b) {
  for(const p of [a,b]) for(let i=0;i<p.length;i++) {
    const next=p[(i+1)%p.length],x=-(next.z-p[i].z),z=next.x-p[i].x;
    const aa=a.map(v=>v.x*x+v.z*z),bb=b.map(v=>v.x*x+v.z*z);
    if(Math.max(...aa)<=Math.min(...bb)+0.01||Math.max(...bb)<=Math.min(...aa)+0.01) return false;
  } return true;
}
function parts(o) {
  if(o.type!=='ldesk'||o.geometry?.kind!=='l') return [footprint(o)];
  const g=o.geometry,a=(o.r||0)*Math.PI/180;
  const sub=(x,z,w,d)=>({ ...o,type:'desk',geometry:null,w,d,x:o.x+x*Math.cos(a)-z*Math.sin(a),z:o.z+x*Math.sin(a)+z*Math.cos(a) });
  return [footprint(sub(0,-o.d/2+g.mainDepthCm/2,o.w,g.mainDepthCm)),footprint(sub((g.side==='left'?-1:1)*(o.w/2-g.returnWidthCm/2),g.mainDepthCm/2,g.returnWidthCm,o.d-g.mainDepthCm))];
}
export function placementWarnings(candidate,objects,room) {
  const warnings=[];
  if(footprint(candidate).some(p=>p.x<0||p.z<0||p.x>room.w||p.z>room.d)) warnings.push('방 외곽을 벗어납니다.');
  for(const o of objects) {
    if(o.id===candidate.id||['rug','door','window'].includes(o.type)||['rug','lamp','decor'].includes(candidate.type)) continue;
    const ae=candidate.e||0,be=o.e||0;
    if(ae+candidate.h<=be||be+o.h<=ae) continue;
    if(parts(candidate).some(a=>parts(o).some(b=>sat(a,b)))) warnings.push(`${o.name}의 배치 영역과 겹칩니다.`);
  }
  return warnings;
}
export function bindingMatches(o) {
  const b=o.commerce?.dimensions;
  if(!b||o.commerce?.type!==o.type) return false;
  return ['w','d','h'].every((k,i)=>Math.abs(o[k]-b[['widthCm','depthCm','heightCm'][i]])<0.01)&&JSON.stringify(o.geometry||null)===JSON.stringify(b.geometry||null);
}
