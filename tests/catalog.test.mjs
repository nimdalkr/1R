import {test} from 'node:test';import assert from 'node:assert/strict';
import {POLICY,catalogErrors,verifiedOptions,verificationErrors,eligibility,recommend,parseProductUrl,trackingIdentity,sameOption,safeAffiliateUrl,safeProductImage,boxCapacity,placementWarnings,bindingMatches} from '../shared/catalog.mjs';
import {NOW,option,catalog,clone} from './fixtures/catalog.mjs';
test('only approved complete current options are published',()=>assert.equal(verifiedOptions(catalog(),NOW).length,1));
for(const [label,change] of [
 ['pending',o=>o.review.status='pending'],['retired',o=>o.review.status='retired'],['recheck',o=>o.review.status='needs_review'],
 ['no dimensions',o=>o.dimensions.depthCm=null],['packaging only',o=>o.dimensions.basis='package'],
 ['no sources',o=>o.review.sources=[]],['no reviewer',o=>o.review.reviewer=''],['unconfirmed option',o=>o.review.optionConfirmed=false],
 ['wrong variant URL',o=>o.product.url=o.product.url.replace('999990002','42')],
 ['unknown inventory',o=>o.availability.status='unknown'],['sold out',o=>o.availability.status='unavailable'],
 ['old availability',o=>o.availability.checkedAt=new Date(NOW-8*86400000).toISOString()],
 ['old source',o=>o.review.sources[0].observedAt=new Date(NOW-91*86400000).toISOString()],
 ['old review',o=>o.review.reviewedAt=new Date(NOW-91*86400000).toISOString()],
 ['future review',o=>o.review.reviewedAt=new Date(NOW+86400000).toISOString()]
])test('exclude '+label,()=>{const o=option();change(o);assert.equal(eligibility(o,NOW).eligible,false);assert.equal(verifiedOptions(catalog([o]),NOW).length,0);});
test('public reviewer is not an operator personal name',()=>assert.equal(verifiedOptions(catalog(),NOW)[0].review.reviewer,'1R 검수'));
test('empty real catalog is valid (no fictitious products)',()=>assert.deepEqual(catalogErrors(catalog([])),[]));
test('overall limit 200 enforced',()=>assert.ok(catalogErrors(catalog(Array.from({length:201},(_,i)=>({id:'x-'+i,review:{status:'pending'}})))).some(x=>x.includes('200'))));
test('group limit enforced',()=>{const list=Array.from({length:36},(_,i)=>{let o=option({id:'desk-'+i});o.product.itemId=String(10000+i);o.product.url=o.product.url.replace('999990002',o.product.itemId);o.availability.sourceUrl=o.product.url;return o;});assert.ok(catalogErrors(catalog(list)).some(x=>x.includes('35')));});
test('duplicate exact purchase option rejected',()=>assert.ok(catalogErrors(catalog([option(),option({id:'second-id'})])).some(x=>x.includes('중복 구매'))));
for(const url of ['javascript:alert(1)','http://www.coupang.com/vp/products/1?itemId=2&vendorItemId=3','https://www.coupang.com.evil.test/vp/products/1?itemId=2&vendorItemId=3','https://www.coupang.com/vp/products/1','https://www.coupang.com/vp/products/1?itemId=2&itemId=3&vendorItemId=4','https://secret@www.coupang.com/vp/products/1?itemId=2&vendorItemId=3'])test('reject unsafe/ambiguous option url '+url,()=>assert.equal(parseProductUrl(url),null));
test('canonical URL retains both variant IDs; strips unrelated tracking',()=>assert.equal(parseProductUrl(option().product.url+'&junk=yes').url,option().product.url));
test('different vendor item is not same option',()=>assert.equal(sameOption(option().product,{...option().product,vendorItemId:'42'}),false));
test('external image hosts are not accepted',()=>assert.equal(safeProductImage('https://evil.test/a.png'),null));
test('affiliate target must be allowlisted',()=>assert.equal(safeAffiliateUrl('https://evil.test/redirect'),null));
test('fit dimensions exclude popular oversize item',()=>{const o=option();o.popularity={source:'bestcategories',observedAt:new Date(NOW).toISOString()};assert.equal(recommend([o],{maxWidth:150},NOW).length,0);});
test('fits exact boundary without inflation',()=>assert.equal(recommend([option()],{type:'desk',maxWidth:160,maxDepth:70},NOW).length,1));
test('search never publishes pending candidate',()=>{const o=option();o.review.status='pending';assert.equal(recommend([o],{query:'샘플'},NOW).length,0);});
test('L shape requires side and return dimensions',()=>{const o=option({type:'ldesk'});assert.ok(verificationErrors(o).some(e=>e.includes('ㄱ자')));o.dimensions.geometry={kind:'l',side:'left',mainDepthCm:50,returnWidthCm:40};assert.deepEqual(verificationErrors(o),[]);});
test('box capacity unknown without inside dimensions',()=>assert.equal(boxCapacity(option(),{w:50,d:40,h:35},NOW),null));
test('box capacity uses inside bins, not outer volume',()=>{const o=option();o.storage={verified:true,reviewedAt:new Date(NOW).toISOString(),compartments:[{widthCm:100,depthCm:45,heightCm:35,count:5}]};assert.equal(boxCapacity(o,{w:50,d:40,h:35},NOW),10);assert.equal(boxCapacity(o,{w:101,d:40,h:35},NOW),0);});
test('rotated furniture overlap detected',()=>{const a={id:1,type:'desk',name:'책상',x:100,z:100,w:100,d:50,h:74,r:90},b={id:2,type:'chair',name:'의자',x:110,z:100,w:40,d:40,h:90,r:0};assert.ok(placementWarnings(a,[b],{w:400,d:500}).some(x=>x.includes('의자')));});
test('L inner opening is not a solid rectangle',()=>{const a={id:1,type:'ldesk',name:'ㄱ자',x:150,z:150,w:200,d:150,h:74,r:0,geometry:{kind:'l',side:'right',mainDepthCm:50,returnWidthCm:50}},b={id:2,type:'chair',name:'의자',x:125,z:175,w:30,d:30,h:50,r:0};assert.deepEqual(placementWarnings(a,[b],{w:500,d:500}),[]);});
test('outside room checked',()=>assert.ok(placementWarnings({id:1,type:'desk',x:0,z:0,w:100,d:60,h:74,r:0},[],{w:400,d:500}).length));
test('editing dimensions invalidates exact product badge, moving does not',()=>{const d=option().dimensions;const o={type:'desk',w:160,d:70,h:74,x:0,commerce:{type:'desk',dimensions:d}};assert.equal(bindingMatches(o),true);o.x=200;assert.equal(bindingMatches(o),true);o.w=159;assert.equal(bindingMatches(o),false);});

test('malformed source collection is ineligible, not a runtime exception',()=>{const o=option();o.review.sources={url:'https://example.com'};assert.equal(eligibility(o,NOW).eligible,false);});
test('duplicate affiliate identity query is rejected',()=>assert.equal(trackingIdentity('https://link.coupang.com/re/AFFSDP?pageKey=1&itemId=2&vendorItemId=3&itemId=4'),null));
