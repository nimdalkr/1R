"""Browser acceptance. Run against npm start; uses mock commerce responses only.
Requires Python playwright and Chromium installed by the caller (not a runtime dependency).
"""
import json, os, subprocess, sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('ONE_R_TEST_OUTPUT','/tmp/1r-browser-tests'))
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('ONE_R_TEST_URL','http://127.0.0.1:4173')
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {option} from './tests/fixtures/catalog.mjs'; console.log(JSON.stringify(option({},Date.now())));"],cwd=ROOT,text=True))
results=[]
def record(label,ok=True):
    assert ok,label
    results.append({'test':label,'pass':True})
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE);page.wait_for_function('!!window.OneR');page.wait_for_timeout(300)
    record('20 starter templates remain available',page.locator('#templates [data-i]').count()==20)
    page.locator('#openShop').click();page.wait_for_timeout(500)
    record('real empty catalog has honest zero state',page.get_by_text('검수된 상품을 준비하고 있습니다').count()==1)
    record('no invented production products',page.locator('.product-card').count()==0)
    page.screenshot(path=str(OUT/'desktop-empty-catalog.png'))
    record('no keys returned to public status',not json.loads(page.request.get(BASE+'/api/commerce?action=status').text()).get('configured'))
    record('admin API rejects anonymous request',page.request.get(BASE+'/api/commerce?action=admin-catalog').status==401)
    record('secrets are not served from static dist',page.request.get(BASE+'/.env.local').status==404)
    calls=[]
    def mock(route):
        req=route.request;action=parse_qs(urlparse(req.url).query).get('action',['catalog'])[0];calls.append(action)
        if action=='catalog': data={'schemaVersion':1,'options':[fixture]}
        elif action=='status':data={'configured':True,'verifiedCount':1,'maxOptions':200,'connectionTested':False}
        elif action=='offer':data={'optionId':fixture['id'],'state':'exact_option','price':120000,'image':None,'checkedAt':datetime.now(timezone.utc).isoformat(),'notice':'TEST ONLY: not a real quote'}
        elif action=='link':route.fulfill(status=503,json={'error':{'message':'TEST ONLY: no external purchase navigation'}});return
        else:route.continue_();return
        route.fulfill(status=200,json=data)
    page.route('**/api/commerce*',mock)
    page.reload();page.wait_for_function('!!window.OneR')
    desk=page.evaluate("OneR.getState().objects.find(o=>o.type==='desk')")
    page.evaluate('(id)=>OneR.select(id)',desk['id'])
    page.locator('#findProducts').click();page.wait_for_timeout(400)
    record('verified fixture appears in recommendations',page.locator('.product-card').count()==1)
    record('catalog browsing does not invoke upstream offers',calls.count('offer')==0)
    page.screenshot(path=str(OUT/'desktop-verified-test-fixture.png'))
    page.locator('[data-price]').click();page.wait_for_timeout(250)
    record('explicit price check makes one call',calls.count('offer')==1)
    record('quote is labeled with lookup time',page.locator('.product-price').inner_text().startswith('120,000'))
    before=page.evaluate('OneR.getState()')
    page.locator('[data-preview]').click();page.wait_for_selector('dialog[open]')
    record('product change requires a preview confirmation',page.locator('#confirmProduct').count()==1)
    page.locator('#confirmProduct').click();page.wait_for_timeout(100)
    after=page.evaluate('OneR.getState()');updated=next(o for o in after['objects'] if o['id']==desk['id'])
    record('exact product dimensions applied',updated['w']==160 and updated['d']==70 and updated['h']==74)
    record('room and position preserved',before['room']==after['room'] and updated['x']==desk['x'] and updated['z']==desk['z'])
    record('other furniture not moved',all(o==next(n for n in after['objects'] if n['id']==o['id']) for o in before['objects'] if o['id']!=desk['id']))
    page.locator('[data-tab="list"]').click()
    record('purchase list counts only planned product',page.locator('.shopping-row').count()==1 and '120,000' in page.locator('.shopping-summary').inner_text())
    page.locator('.shop-close').click();page.locator('#object-w').fill('159');page.locator('#object-w').dispatch_event('change')
    record('editing width invalidates product-dimension badge','사용자 수정 치수' in page.locator('#bindingStatus').inner_text())
    page.locator('#openShop').click();page.locator('[data-tab="list"]').click()
    record('changed product dimensions excluded from quoted subtotal','0원' in page.locator('.shopping-summary').inner_text() and '규격 변경됨' in page.locator('.shopping-row').inner_text())
    page.locator('[data-owned]').click()
    record('owned product removed from purchase list',page.locator('.shopping-row').count()==0)
    page.locator('.shop-close').click();page.locator('#findProducts').click()
    record('owned item not recommended by default',page.get_by_text('이미 가진 물건은 다시 권하지 않아요').count()==1)
    page.locator('#shopOwned').check()
    record('owned override control works',page.locator('#shopOwned').is_checked())
    page.locator('.shop-close').click()
    page.evaluate("document.querySelector('#object-name').value='<img src=x onerror=window.__xss=1>';document.querySelector('#object-name').dispatchEvent(new Event('change',{bubbles:true}));OneR.select(OneR.getSelected().id)")
    record('object labels escaped (no stored XSS)',page.evaluate('window.__xss===undefined') and page.locator('#prop img').count()==0)
    with page.expect_download() as d:page.locator('#export').click()
    download=d.value;download.save_as(str(OUT/'layout.json'))
    record('JSON export keeps product binding and ownership',any(o.get('commerce') and o.get('ownership')=='owned' for o in json.loads((OUT/'layout.json').read_text())['objects']))
    # Operator workflow: data is clearly synthetic and never written to production catalog.
    admin=ctx.new_page();admin.on('pageerror',lambda e:errors.append(str(e)))
    admin.goto(BASE+'/admin/');admin.wait_for_selector('#newOption');admin.screenshot(path=str(OUT/'admin-empty.png'),full_page=True)
    admin.locator('#newOption').click();admin.locator('#approve').click()
    record('operator cannot approve a blank option','옵션' in admin.locator('#message').inner_text())
    values={'optionId':fixture['id'],'productName':fixture['product']['name'],'productUrl':fixture['product']['url'],'brand':'테스트','model':'TEST-NOT-FOR-SALE','optionLabel':'가상 테스트 옵션','searchKeyword':'테스트 책상','width':'160','depth':'70','height':'74','sourceUrl':'https://manufacturer.example/test-only','sourceNote':'테스트용. 실제 상품 정보가 아님. 가상 160×70×74cm 옵션 검사.','reviewer':'자동 테스트'}
    for k,v in values.items():admin.locator('#'+k).fill(v)
    for k in ['optionConfirmed','dimensionsConfirmed','available']:admin.locator('#'+k).check()
    admin.locator('#approve').click();record('complete synthetic option can be reviewed in draft',admin.locator('#approvedCount').inner_text()=='1')
    with admin.expect_download() as d:admin.locator('#publish').click()
    d.value.save_as(str(OUT/'catalog-test-only.json'))
    exported=json.loads((OUT/'catalog-test-only.json').read_text())
    record('catalog export does not silently demote an unchanged approved option',len(exported['options'])==1 and exported['options'][0]['review']['status']=='verified')
    record('export does not contain admin or Coupang secrets','test-admin-token' not in json.dumps(exported))
    admin.screenshot(path=str(OUT/'admin-review-test-fixture.png'),full_page=True)
    # Real catalog remains empty after editing/exporting a local operator draft.
    record('browser operator draft cannot mutate server catalog',len(admin.request.get(BASE+'/api/commerce?action=catalog').json()['options'])==0)
    mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
    mp=mobile.new_page();mp.on('pageerror',lambda e:errors.append(str(e)));mp.goto(BASE);mp.wait_for_function('!!window.OneR');mp.locator('#openShop').click();mp.wait_for_timeout(400)
    record('mobile drawer fits viewport',mp.evaluate('document.querySelector(".shop-panel").getBoundingClientRect().width')<=390)
    mp.screenshot(path=str(OUT/'mobile-empty-catalog.png'))
    record('mobile has no horizontal document overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    record('no browser JavaScript errors',not errors)
    browser.close()
(OUT/'browser-report.json').write_text(json.dumps({'tests':len(results),'passed':len(results),'results':results,'errors':errors},ensure_ascii=False,indent=2))
print(json.dumps({'tests':len(results),'passed':len(results),'output':str(OUT)},ensure_ascii=False))
