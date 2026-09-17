// SYNTHETIC TEST FIXTURES ONLY. Never imported by server production catalog or build.
// The names/IDs/URLs below are invented for automated tests, not real products.
export const NOW=Date.parse('2026-09-17T09:00:00.000Z');
export function option(overrides={},now=NOW) {
  const t=new Date(now).toISOString();
  const p={productId:'999990001',itemId:'999990002',vendorItemId:'999990003',url:'https://www.coupang.com/vp/products/999990001?itemId=999990002&vendorItemId=999990003',name:'[테스트 전용 · 판매상품 아님] 샘플 책상',brand:'테스트',model:'TEST-NOT-FOR-SALE',optionLabel:'가상 테스트 옵션',color:'화이트',searchKeyword:'테스트 책상'};
  return {id:'test-only-desk',category:'desk',type:'desk',product:p,dimensions:{widthCm:160,depthCm:70,heightCm:74,basis:'assembled'},review:{status:'verified',reviewer:'자동 테스트 픽스처',reviewedAt:t,optionConfirmed:true,dimensionsConfirmed:true,sources:[{kind:'manufacturer',url:'https://manufacturer.example/test-only',observedAt:t,note:'테스트 데이터. 실제 규격 근거가 아닙니다.'}]},availability:{status:'available',checkedAt:t,sourceUrl:p.url},popularity:{source:'manual',observedAt:t},...overrides};
}
export function catalog(options=[option()]){return {schemaVersion:1,updatedAt:new Date(NOW).toISOString(),options};}
export function rawProduct(overrides={}){return {productId:999990001,productName:'테스트 상품',productPrice:120000,productImage:'https://ads-partners.coupang.com/image1/test-only.png',productUrl:'https://link.coupang.com/re/AFFSDP?pageKey=999990001&itemId=999990002&vendorItemId=999990003&lptag=TEST',rank:2,isRocket:true,isFreeShipping:false,...overrides};}
export const clone=x=>structuredClone(x);
