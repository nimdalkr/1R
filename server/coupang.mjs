import { createHmac } from 'node:crypto';
import { parseProductUrl } from '../shared/catalog.mjs';
export const BASE='https://api-gateway.coupang.com';
export const PREFIX='/v2/providers/affiliate_open_api/apis/openapi';
export class ServiceError extends Error {
  constructor(code,message,status=500,retryAfter=0){super(message);this.code=code;this.status=status;this.retryAfter=retryAfter;}
}
const integer=(s,f,min,max)=>Number.isInteger(Number(s))&&Number(s)>=min&&Number(s)<=max?Number(s):f;
export function settings(env=process.env) {
  const accessKey=(env.COUPANG_ACCESS_KEY||'').trim(),secretKey=(env.COUPANG_SECRET_KEY||'').trim();
  const invalid=/[\r\n]/.test(accessKey+secretKey)||accessKey.length>500||secretKey.length>500;
  return {accessKey,secretKey,configured:!!(accessKey&&secretKey&&!invalid),
    subId:(env.COUPANG_SUB_ID||'').trim(),timeoutMs:integer(env.COUPANG_TIMEOUT_MS,7000,1000,10000),
    searchLimit:integer(env.COUPANG_SEARCH_LIMIT_HOUR,8,1,3000),linkLimit:integer(env.COUPANG_LINK_LIMIT_HOUR,100,1,5000),
    adminToken:env.CATALOG_ADMIN_TOKEN||'',redisUrl:env.UPSTASH_REDIS_REST_URL||'',redisToken:env.UPSTASH_REDIS_REST_TOKEN||''};
}
export function signedDate(date=new Date()) { return date.toISOString().slice(2,19).replace(/[-:]/g,'')+'Z'; }
export function sign(method,path,query,accessKey,secretKey,date=new Date()) {
  const stamp=signedDate(date), signature=createHmac('sha256',secretKey).update(stamp+method.toUpperCase()+path+query,'utf8').digest('hex');
  return `CEA algorithm=HmacSHA256,access-key=${accessKey},signed-date=${stamp},signature=${signature}`;
}
export class Budget {
  constructor({env=process.env,fetchImpl=globalThis.fetch,now=()=>Date.now()}={}) {this.env=env;this.fetch=fetchImpl;this.now=now;this.buckets=new Map();this.blockedUntil=0;}
  async take(kind) {
    const config=settings(this.env),now=this.now();
    if(now<this.blockedUntil) throw new ServiceError('UPSTREAM_COOLDOWN','쿠팡 호출이 잠시 중지되어 있습니다.',429,Math.ceil((this.blockedUntil-now)/1000));
    const limit=kind==='search'?config.searchLimit:config.linkLimit;
    const window=Math.floor(now/3600000),ttl=3600-(Math.floor(now/1000)%3600),key=`1r:coupang:${kind}:${window}`;
    let count;
    if(config.redisUrl||config.redisToken) {
      if(!/^https:\/\/[^/]+\.upstash\.io\/?$/.test(config.redisUrl)||!config.redisToken) throw new ServiceError('LIMITER_CONFIG','공유 호출 제한 설정을 확인하세요.',503);
      try {
        const script="local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n";
        const result=await this.fetch(config.redisUrl,{method:'POST',headers:{Authorization:`Bearer ${config.redisToken}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',script,1,key,ttl+10]),signal:AbortSignal.timeout(2000),redirect:'error'});
        const data=await result.json();count=data.result;
        if(!result.ok||!Number.isInteger(count)||count<1) throw Error('limiter');
      } catch { throw new ServiceError('LIMITER_UNAVAILABLE','공유 호출 제한 서비스에 연결할 수 없어 외부 호출을 중단했습니다.',503); }
    } else {
      for(const [k,v] of this.buckets) if(v.expire<now) this.buckets.delete(k);
      const b=this.buckets.get(key)||{count:0,expire:now+ttl*1000};count=++b.count;this.buckets.set(key,b);
    }
    if(count>limit) throw new ServiceError('API_BUDGET_EXHAUSTED','설정한 쿠팡 호출 예산을 모두 사용했습니다. 잠시 후 다시 확인하세요.',429,ttl);
  }
  pause(seconds){this.blockedUntil=Math.max(this.blockedUntil,this.now()+seconds*1000);}
}
export function createCoupang({env=process.env,fetchImpl=globalThis.fetch,now=()=>Date.now(),budget=new Budget({env,fetchImpl,now})}={}) {
  async function request(method,endpoint,params={},body=null,kind='search') {
    const c=settings(env);
    if(!c.configured) throw new ServiceError('COUPANG_NOT_CONFIGURED','서버에 쿠팡 파트너스 Access Key와 Secret Key를 등록하세요.',503);
    await budget.take(kind);
    if(c.subId&&method==='GET') params={...params,subId:c.subId};
    // URL and signature use exactly the same percent-encoded query string, without '?'.
    const query=Object.entries(params).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(String(v))).join('&');
    const path=PREFIX+endpoint,url=BASE+path+(query?'?'+query:'');
    let response;
    try { response=await fetchImpl(url,{method,headers:{Authorization:sign(method,path,query,c.accessKey,c.secretKey,new Date(now())),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(c.timeoutMs),redirect:'error'}); }
    catch {throw new ServiceError('COUPANG_NETWORK','쿠팡 API 연결에 실패했습니다. 잠시 후 다시 확인하세요.',502);}
    if(response.status===429||response.status===403) {
      const retry=Math.min(3600,Math.max(60,Number(response.headers.get('retry-after'))||300));budget.pause(retry);
      throw new ServiceError(response.status===403?'COUPANG_FORBIDDEN':'COUPANG_RATE_LIMIT','쿠팡이 호출을 제한했습니다. 승인·키·호출 제한을 확인하세요.',response.status===403?502:429,retry);
    }
    if(response.status===401) throw new ServiceError('COUPANG_AUTH_FAILED','쿠팡 인증에 실패했습니다. 서버 키와 승인 상태를 확인하세요.',502);
    if(!response.ok) throw new ServiceError('COUPANG_UPSTREAM','쿠팡 API 응답이 정상적이지 않습니다.',502);
    let data;
    try {const text=await response.text();if(text.length>2000000)throw Error();data=JSON.parse(text);}catch{throw new ServiceError('COUPANG_INVALID_RESPONSE','쿠팡 API 응답을 읽을 수 없습니다.',502);}
    if(String(data.rCode)!=='0') {
      if(['403','429'].includes(String(data.rCode)))budget.pause(300);
      throw new ServiceError('COUPANG_API_ERROR','쿠팡 API가 요청을 처리하지 못했습니다. 키·승인 및 요청 조건을 확인하세요.',502);
    }
    return data.data;
  }
  return {
    async search(keyword,limit=10) {
      if(typeof keyword!=='string'||!keyword.trim()||keyword.length>120)throw new ServiceError('INVALID_KEYWORD','검색어는 1~120자여야 합니다.',400);
      const data=await request('GET','/products/search',{keyword:keyword.trim(),limit:Math.max(1,Math.min(10,limit))});
      if(!Array.isArray(data?.productData)) throw new ServiceError('COUPANG_INVALID_RESPONSE','상품 검색 응답 형식이 다릅니다.',502);
      return data.productData;
    },
    async best(categoryId,limit=20) {
      if(!/^\d{4}$/.test(String(categoryId)))throw new ServiceError('INVALID_CATEGORY','공식 문서의 4자리 카테고리 코드를 입력하세요.',400);
      const data=await request('GET',`/products/bestcategories/${categoryId}`,{limit:Math.max(1,Math.min(100,limit))});
      if(!Array.isArray(data))throw new ServiceError('COUPANG_INVALID_RESPONSE','베스트 상품 응답 형식이 다릅니다.',502);
      return data;
    },
    async deeplink(url) {
      const p=parseProductUrl(url);if(!p)throw new ServiceError('INVALID_OPTION_URL','선택 옵션이 명시된 쿠팡 URL이 필요합니다.',400);
      const c=settings(env),data=await request('POST','/deeplink',{}, {coupangUrls:[p.url],...(c.subId?{subId:c.subId}:{})},'link');
      if(!Array.isArray(data))throw new ServiceError('COUPANG_INVALID_RESPONSE','제휴 링크 응답 형식이 다릅니다.',502);
      return data;
    }
  };
}
