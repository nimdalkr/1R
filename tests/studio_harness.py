"""Load exact ES module sources in memory. Browser policy stays unchanged.
API and browser storage are explicit doubles in offline mode; use STUDIO_URL for HTTP E2E.
"""
from pathlib import Path
import re,json,os,subprocess
ROOT=Path(__file__).resolve().parents[1]
MODULES=['shared/planner-model.mjs','shared/catalog.mjs','shared/templates.mjs','shared/layouts.mjs','shared/camera.mjs','shared/sightline.mjs','assets/plan.js','assets/mesh.js','assets/commerce.js','assets/studio.js']
def mount(page,options=None,saved=None,software=False,storage_fail=False):
    if os.environ.get('STUDIO_URL'):
        if saved:
            page.add_init_script("localStorage.setItem('1r-project',"+json.dumps(saved)+");")
        if storage_fail:
            page.add_init_script("Storage.prototype.setItem=function(){throw Error('QuotaExceededError')};")
        page.add_init_script("window.__calls=[];const nativeFetch=window.fetch;window.fetch=(input,...rest)=>{window.__calls.push(new URL(input,location.href).searchParams.get('action'));return nativeFetch(input,...rest)};")
        if options is not None:
            def reply(route):
                from urllib.parse import urlparse,parse_qs
                action=parse_qs(urlparse(route.request.url).query).get('action',[''])[0]
                from datetime import datetime,timezone
                data={'error':{'message':'HTTP test: no upstream API'}};status=503
                if action=='catalog':data={'schemaVersion':1,'options':options};status=200
                if action=='status':data={'configured':bool(options),'connectionTested':False};status=200
                if action=='offer':data={'optionId':options[0]['id'],'state':'exact_option','price':120000,'image':None,'checkedAt':datetime.now(timezone.utc).isoformat(),'notice':'TEST ONLY, not a real price'};status=200
                route.fulfill(status=status,content_type='application/json',body=json.dumps(data))
            page.route('**/api/commerce?**',reply)
        url=os.environ['STUDIO_URL'].rstrip('/')+'/'
        if software:url+='?renderer=software'
        page.goto(url,wait_until='networkidle')
        page.wait_for_function('typeof window.OneR === "object"',timeout=12000)
        return {}
    html=(ROOT/'index.html').read_text()
    html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S)
    html=re.sub(r'<link\b[^>]*>','',html)
    page.set_content(html)
    page.add_style_tag(content=(ROOT/'assets/studio.css').read_text()+'\n'+(ROOT/'assets/commerce.css').read_text())
    page.evaluate('''(settings)=>{
      window.__calls=[]; window.__storage=new Map();window.__storageFail=settings.fail;
      if(settings.saved)__storage.set('1r-project',settings.saved);
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>__storage.get(k)||null,setItem:(k,v)=>{if(__storageFail)throw Error('QuotaExceededError');__storage.set(k,String(v));},removeItem:k=>__storage.delete(k)}});
      window.fetch=async(input,init={})=>{const action=new URL(input,'https://1r.example').searchParams.get('action');__calls.push(action);
      if(action==='catalog')return Response.json({schemaVersion:1,options:settings.options||[]});
      if(action==='status')return Response.json({configured:(settings.options||[]).length>0,connectionTested:false});
      if(action==='offer')return Response.json({optionId:settings.options[0].id,state:'exact_option',price:120000,image:null,checkedAt:new Date().toISOString(),notice:'TEST ONLY, not a real price'});
      return Response.json({error:{message:'Offline test: no upstream API'}},{status:503});};
    }''',{'options':options or [],'saved':saved,'fail':storage_fail})
    urls={}
    for path in MODULES:
        code=(ROOT/path).read_text()
        # Rewrite module addresses only; business logic and DOM code remain unmodified.
        def substitute(m):
            address=m.group(2)
            local=(Path(path).parent/address).as_posix()
            import posixpath
            local=posixpath.normpath(local)
            if local not in urls:raise ValueError((path,address,local))
            return m.group(1)+json.dumps(urls[local])
        code=re.sub(r'(from\s+)[\'\"]([^\'\"]+)[\'\"]',substitute,code)
        code=re.sub(r"import\('\./commerce.js'\)","import("+json.dumps(urls.get('assets/commerce.js',''))+")",code)
        code=code.replace('import.meta.url',json.dumps('https://1r.example/'+path))
        if software and path=='assets/studio.js':code=code.replace("new URLSearchParams(location.search).get('renderer')==='software'",'true')
        urls[path]=page.evaluate('(text)=>URL.createObjectURL(new Blob([text],{type:"text/javascript"}))',code)
    page.add_script_tag(type='module',content="import "+json.dumps(urls['assets/studio.js'])+';')
    page.wait_for_function('typeof window.OneR === "object"',timeout=12000)
    page.wait_for_timeout(200)
    return urls
