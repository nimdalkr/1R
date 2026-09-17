"""Offline Chromium component harness. No browser network policy changes or live API calls.
Browser markup and exact JS/CSS files are loaded in memory; module imports are wired to
shared rules in memory. API replies and localStorage are explicit test doubles.
Run: python tests/browser_offline.py (requires playwright and system Chromium).
"""
from pathlib import Path
import json,os,re,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=Path(os.environ.get('ONE_R_TEST_OUTPUT','/tmp/1r-offline-qa'));OUT.mkdir(parents=True,exist_ok=True)
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {option} from './tests/fixtures/catalog.mjs';console.log(JSON.stringify(option({},Date.now())));"],cwd=ROOT,text=True))
results=[];errors=[]
def check(name,value=True):
    assert value,name
    results.append({'test':name,'pass':True})
def mount(page,admin=False,options=None):
    page.on('pageerror',lambda e:errors.append(str(e)))
    html=(ROOT/('admin/index.html' if admin else 'index.html')).read_text()
    html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S)
    html=re.sub(r'<link\b[^>]*>','',html)
    page.set_content(html)
    page.add_style_tag(content='\n'.join((ROOT/'assets'/f).read_text() for f in (['admin.css'] if admin else ['planner.css','commerce.css'])))
    # Offline test doubles: no request forwarding, no external images, no purchases.
    page.add_script_tag(content='''
window.__options='''+json.dumps(options or [],ensure_ascii=False)+''';window.__calls=[];
let __storage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>__storage.get(k)||null,setItem:(k,v)=>__storage.set(k,String(v)),removeItem:k=>__storage.delete(k)}});
window.fetch=async(input,init={})=>{const a=new URL(input,'https://offline.example').searchParams.get('action');window.__calls.push(a);let data;
if(a==='catalog')data={schemaVersion:1,options:window.__options};
else if(a==='status')data={configured:window.__options.length>0,connectionTested:false};
else if(a==='offer')data={optionId:window.__options[0].id,state:'exact_option',price:120000,image:null,checkedAt:new Date().toISOString(),notice:'TEST ONLY · 실제 상품 가격 아님'};
else return Response.json({error:{message:'OFFLINE TEST: no live API'}},{status:503});
return Response.json(data);};
''')
    shared=(ROOT/'shared/catalog.mjs').read_text();exports=re.findall(r'export (?:const|function) (\w+)',shared)
    shared=shared.replace('export ','')
    page.add_script_tag(content='window.OneRRules=(()=>{'+shared+';return {'+','.join(exports)+'};})();')
    if not admin:page.add_script_tag(content=(ROOT/'assets/planner.js').read_text())
    module=(ROOT/'assets'/('admin.js' if admin else 'commerce.js')).read_text()
    module=re.sub(r'import \{([^}]+)\} from [^;]+;',r'const {\1}=window.OneRRules;',module,count=1)
    page.add_script_tag(content='(async()=>{'+module+'})()')
    page.wait_for_timeout(150)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000});mount(page)
    check('20 starter templates retained',page.locator('#templates [data-i]').count()==20)
    page.locator('#openShop').click();page.wait_for_timeout(250)
    check('zero catalog clearly explained',page.get_by_text('검수된 상품을 준비하고 있습니다').count()==1)
    check('no fictional production cards',page.locator('.product-card').count()==0)
    page.screenshot(path=str(OUT/'desktop-empty-catalog.png'))
    page.close()
    page=browser.new_page(viewport={'width':1440,'height':1000});mount(page,options=[fixture])
    desk=page.evaluate("OneR.getState().objects.find(o=>o.type==='desk')");page.evaluate('(id)=>OneR.select(id)',desk['id']);page.locator('#findProducts').click();page.wait_for_timeout(250)
    check('approved fixture in recommendation',page.locator('.product-card').count()==1)
    check('catalog browsing does not fetch prices',page.evaluate("__calls.filter(x=>x==='offer').length") == 0)
    page.screenshot(path=str(OUT/'desktop-verified-test-fixture.png'))
    page.locator('[data-price]').click();page.wait_for_timeout(100)
    check('explicit price lookup exactly once',page.evaluate("__calls.filter(x=>x==='offer').length") == 1)
    check('price with timestamp rendered','120,000' in page.locator('.product-price').inner_text())
    before=page.evaluate('OneR.getState()');page.locator('[data-preview]').click()
    check('confirmation required',page.locator('dialog[open]').count()==1)
    page.locator('#confirmProduct').click();after=page.evaluate('OneR.getState()');o=next(o for o in after['objects'] if o['id']==desk['id'])
    check('exact width/depth/height applied',(o['w'],o['d'],o['h'])==(160,70,74))
    check('room not modified',before['room']==after['room'])
    check('position not modified',(o['x'],o['z'])==(desk['x'],desk['z']))
    check('unrelated furniture unchanged',all(x==next(y for y in after['objects'] if y['id']==x['id']) for x in before['objects'] if x['id']!=desk['id']))
    page.locator('[data-tab="list"]').click();check('planned product list and exact subtotal',page.locator('.shopping-row').count()==1 and '120,000' in page.locator('.shopping-summary').inner_text())
    page.locator('.shop-close').click();page.locator('#object-w').fill('159');page.locator('#object-w').dispatch_event('change')
    check('dimension edits invalidate binding label','사용자 수정 치수' in page.locator('#bindingStatus').inner_text())
    page.locator('#openShop').click();page.locator('[data-tab="list"]').click();check('altered dimensions not included in quoted subtotal','0원' in page.locator('.shopping-summary').inner_text())
    page.locator('[data-owned]').click();check('owned item excluded from purchase list',page.locator('.shopping-row').count()==0)
    page.locator('.shop-close').click();page.locator('#findProducts').click();check('owned item not recommended by default',page.get_by_text('이미 가진 물건은 다시 권하지 않아요').count()==1)
    page.locator('#shopOwned').check();check('owned replacement is explicit opt-in',page.locator('#shopOwned').is_checked())
    page.locator('.shop-close').click();page.evaluate("document.querySelector('#object-name').value='<img src=x onerror=window.__xss=1>';document.querySelector('#object-name').dispatchEvent(new Event('change'));OneR.select(OneR.getSelected().id)")
    check('imported/object titles escaped, no stored XSS',page.evaluate('window.__xss===undefined') and page.locator('#prop img').count()==0)
    with page.expect_download() as dl:page.locator('#export').click()
    dl.value.save_as(str(OUT/'layout-test.json'));data=json.loads((OUT/'layout-test.json').read_text())
    check('export preserves product association and ownership',any(o.get('commerce') and o.get('ownership')=='owned' for o in data['objects']))
    page.locator('#v3').click();check('3D toggle retained',page.locator('#v3').get_attribute('class')=='active')
    admin=browser.new_page(viewport={'width':1440,'height':1000});mount(admin,True);admin.screenshot(path=str(OUT/'admin-empty.png'),full_page=True)
    admin.locator('#newOption').click();admin.locator('#approve').click();check('incomplete option cannot be approved',admin.locator('#approvedCount').inner_text()=='0')
    vals={'optionId':fixture['id'],'productName':fixture['product']['name'],'productUrl':fixture['product']['url'],'brand':'테스트','model':'TEST-NOT-FOR-SALE','optionLabel':'가상 테스트 옵션','searchKeyword':'테스트 책상','width':'160','depth':'70','height':'74','sourceUrl':'https://manufacturer.example/test-only','sourceNote':'테스트용. 실제 규격 근거가 아님. 160×70×74cm 가상 옵션.','reviewer':'자동 테스트'}
    for k,v in vals.items():admin.locator('#'+k).fill(v)
    for k in ['optionConfirmed','dimensionsConfirmed','available']:admin.locator('#'+k).check()
    admin.locator('#approve').click();check('completed review explicitly approved in draft',admin.locator('#approvedCount').inner_text()=='1')
    with admin.expect_download() as dl:admin.locator('#publish').click()
    dl.value.save_as(str(OUT/'catalog-test-only.json'));data=json.loads((OUT/'catalog-test-only.json').read_text());check('approved catalog export remains approved',len(data['options'])==1 and data['options'][0]['review']['status']=='verified')
    check('catalog export contains no credential fields','COUPANG_SECRET_KEY' not in json.dumps(data) and 'adminToken' not in json.dumps(data))
    admin.screenshot(path=str(OUT/'admin-review-test-fixture.png'),full_page=True)
    mp=browser.new_page(viewport={'width':390,'height':844});mount(mp);mp.locator('#openShop').click();mp.wait_for_timeout(250);check('mobile panel width <= viewport',mp.evaluate('document.querySelector(".shop-panel").getBoundingClientRect().width')<=390);mp.screenshot(path=str(OUT/'mobile-empty-catalog.png'))
    check('mobile no horizontal overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    check('zero JS errors in component harness',not errors)
    browser.close()
(OUT/'browser-report.json').write_text(json.dumps({'mode':'offline Chromium component harness; mock API and storage','tests':len(results),'passed':len(results),'results':results,'errors':errors},ensure_ascii=False,indent=2))
print(json.dumps({'tests':len(results),'passed':len(results),'mode':'offline components','output':str(OUT)},ensure_ascii=False))
