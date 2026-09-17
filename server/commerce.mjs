import { timingSafeEqual } from 'node:crypto';
import productionCatalog from '../data/catalog.json' with { type:'json' };
import { POLICY,CATEGORIES,catalogErrors,verifiedOptions,eligibility,parseProductUrl,trackingIdentity,sameOption,safeAffiliateUrl,safeProductImage } from '../shared/catalog.mjs';
import {createCoupang,ServiceError,settings} from './coupang.mjs';
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{...HEADERS,...headers}});
const isAdmin=(request,token)=> {
  if(!token||token.length<24)return false;
  const provided=request.headers.get('x-1r-admin')||'';
  const a=Buffer.from(provided),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);
};
async function readJson(request,limit=2048) {
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ServiceError('JSON_REQUIRED','JSON 요청만 허용됩니다.',415);
  if(Number(request.headers.get('content-length'))>limit)throw new ServiceError('BODY_TOO_LARGE','요청이 너무 큽니다.',413);
  const reader=request.body?.getReader();let size=0,text='';const decoder=new TextDecoder();
  if(reader){for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new ServiceError('BODY_TOO_LARGE','요청이 너무 큽니다.',413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}
  try { const data=JSON.parse(text);if(!data||Array.isArray(data)||typeof data!=='object')throw Error();return data; }catch{throw new ServiceError('INVALID_JSON','요청 JSON이 올바르지 않습니다.',400);}
}
function canonicalIdentity(row) {
  const p=trackingIdentity(row?.productUrl);if(!p)return null;
  if(typeof row.productId==='number'&&!Number.isSafeInteger(row.productId))return null;
  if(String(row.productId)!==p.productId)return null;
  return { ...p,url:`https://www.coupang.com/vp/products/${p.productId}?itemId=${p.itemId}&vendorItemId=${p.vendorItemId}` };
}
export function candidateFrom(row,index,source,now) {
  const p=canonicalIdentity(row),pid=String(row.productId||'');
  if(!/^\d{1,20}$/.test(pid))return null;
  return {
    id:`c-${pid}-${p?.vendorItemId||index}`,
    category:'',type:'',product:{...(p||{productId:pid,itemId:'',vendorItemId:'',url:''}),name:String(row.productName||'').slice(0,200),brand:'',model:'',optionLabel:'',color:'',searchKeyword:source.keyword||String(row.productName||'').slice(0,120)},
    dimensions:{widthCm:null,depthCm:null,heightCm:null,basis:'assembled'},
    review:{status:'pending',reviewer:'',reviewedAt:null,optionConfirmed:false,dimensionsConfirmed:false,sources:[]},
    availability:{status:'unknown',checkedAt:null,sourceUrl:p?.url||''},
    popularity:{source:source.source,observedAt:new Date(now).toISOString(),...(source.source==='search'?{keyword:source.keyword,searchRank:Number.isInteger(row.rank)?row.rank:null}:{categoryId:String(source.categoryId),listPosition:index+1})}
  };
}
export function createCommerce({env=process.env,now=()=>Date.now(),catalog=productionCatalog,coupang=createCoupang({env,now})}={}) {
  const clientBuckets=new Map();
  return async function handle(request) {
    try {
      const url=new URL(request.url),action=url.searchParams.get('action')||'catalog',config=settings(env);
      const admin=action.startsWith('admin-');
      if(!['GET','POST'].includes(request.method))return response({error:{code:'METHOD_NOT_ALLOWED',message:'지원하지 않는 메서드입니다.'}},405,{Allow:'GET, POST'});
      if(request.method==='POST') {
        const origin=request.headers.get('origin');
        if((origin&&origin!==url.origin)||request.headers.get('sec-fetch-site')==='cross-site')throw new ServiceError('ORIGIN_REJECTED','같은 사이트에서만 요청할 수 있습니다.',403);
      }
      if(admin&&!isAdmin(request,config.adminToken))throw new ServiceError('ADMIN_REQUIRED','관리자 토큰이 필요합니다. API 키를 이 칸에 입력하지 마세요.',401);
      const all=verifiedOptions(catalog,now());
      if(request.method==='GET'&&action==='status')return response({configured:config.configured,connectionTested:false,verifiedCount:all.length,maxOptions:POLICY.maxOptions,limiter:config.redisUrl?'shared':'instance',adminEnabled:config.adminToken.length>=24});
      if(request.method==='GET'&&action==='catalog')return response({schemaVersion:1,options:all,policy:POLICY,categories:CATEGORIES,source:'curated_verified_only',checkedAt:new Date(now()).toISOString()});
      if(request.method==='GET'&&action==='admin-catalog')return response({catalog,errors:catalogErrors(catalog),states:catalog.options.map(o=>({id:o.id,...eligibility(o,now())}))});
      if(request.method!=='POST')throw new ServiceError('NOT_FOUND','요청을 찾을 수 없습니다.',404);
      // A small per-instance front-door limiter; shared account budget is enforced in Coupang client.
      const ip=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local',minute=Math.floor(now()/60000),key=ip.slice(0,100)+':'+minute;
      if(clientBuckets.size>5000)clientBuckets.clear();
      for(const k of clientBuckets.keys())if(!k.endsWith(':'+minute))clientBuckets.delete(k);
      const count=(clientBuckets.get(key)||0)+1;clientBuckets.set(key,count);
      if(count>(admin?30:20))throw new ServiceError('TOO_MANY_REQUESTS','요청이 너무 잦습니다.',429,60);
      const body=await readJson(request,action==='admin-validate'?524288:2048);
      if(action==='admin-validate') {
        const errors=catalogErrors(body.catalog);return response({valid:errors.length===0,errors,eligibleCount:verifiedOptions(body.catalog,now()).length},errors.length?422:200);
      }
      if(action==='admin-probe') {await coupang.search('원룸 책상',1);return response({ok:true,checkedAt:new Date(now()).toISOString(),message:'인증된 검색 API 호출 성공. 판매순·규격 데이터 제공을 의미하지 않습니다.'});}
      if(action==='admin-candidates') {
        const source=body.source;if(!['search','bestcategories'].includes(source))throw new ServiceError('INVALID_SOURCE','후보 수집 방식을 선택하세요.',400);
        const rows=source==='search'?await coupang.search(body.keyword,10):await coupang.best(body.categoryId,20);
        const seen=new Set(),options=rows.map((r,i)=>candidateFrom(r,i,body,now())).filter(o=>o&&!seen.has(o.id)&&seen.add(o.id));
        return response({schemaVersion:1,options,notice:'전부 검수 대기 후보입니다. 베스트/검색순서는 판매량 순위가 아니며 규격은 API에서 제공되지 않습니다.'});
      }
      if(!['offer','link'].includes(action))throw new ServiceError('NOT_FOUND','요청을 찾을 수 없습니다.',404);
      if(typeof body.optionId!=='string')throw new ServiceError('INVALID_OPTION','옵션 ID가 필요합니다.',400);
      const option=all.find(o=>o.id===body.optionId);
      if(!option)throw new ServiceError('OPTION_NOT_VERIFIED','현재 추천 가능한 규격 확인 옵션이 아닙니다.',404);
      if(action==='offer') {
        const rows=await coupang.search(option.product.searchKeyword,10),match=rows.find(r=>sameOption(canonicalIdentity(r),option.product));
        const price=match?.productPrice;
        return response({optionId:option.id,checkedAt:new Date(now()).toISOString(),state:match?'exact_option':'unconfirmed',
          price:match&&Number.isSafeInteger(price)&&price>0?price:null,
          image:match?safeProductImage(match.productImage):null,isRocket:match?match.isRocket===true:null,isFreeShipping:match?match.isFreeShipping===true:null,
          notice:match?'동일 옵션 ID의 조회 가격입니다. 최종 가격·배송비·재고는 쿠팡에서 확인하세요.':'동일 옵션 ID를 검색 결과에서 확인하지 못했습니다. 다른 옵션 가격을 대신 표시하지 않습니다.'});
      }
      const links=await coupang.deeplink(option.product.url);
      const link=links.find(l=>sameOption(parseProductUrl(l.originalUrl),option.product)&&sameOption(trackingIdentity(l.landingUrl),option.product)&&safeAffiliateUrl(l.landingUrl));
      if(!link)throw new ServiceError('LINK_OPTION_MISMATCH','제휴 링크의 선택 옵션이 일치하지 않아 이동을 중단했습니다.',502);
      return response({optionId:option.id,url:link.landingUrl,affiliate:true,disclosure:'이 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.'});
    } catch(error) {
      if(error instanceof ServiceError)return response({error:{code:error.code,message:error.message}},error.status,error.retryAfter?{'Retry-After':String(error.retryAfter)}:{});
      // Do not echo upstream messages, API headers, catalog drafts, or secrets.
      return response({error:{code:'INTERNAL_ERROR',message:'요청을 처리하지 못했습니다.'}},500);
    }
  };
}
export const handleCommerce=createCommerce();
