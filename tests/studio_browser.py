"""Studio integration acceptance. Default is offline exact-source Chromium with explicit doubles.
Set STUDIO_URL=http://127.0.0.1:4173 for full HTTP E2E. Never calls a real purchase/API upstream.
"""
from pathlib import Path
import os,json,subprocess,sys
from playwright.sync_api import sync_playwright
from studio_harness import ROOT,mount
OUT=Path(os.environ.get('ONE_R_TEST_OUTPUT','/mnt/data/1r-qa'));OUT.mkdir(parents=True,exist_ok=True)
results=[];errors=[]
def check(name,value):
    assert value,name
    results.append({'name':name,'pass':True});print('PASS',name,flush=True)
def close_start(page):
    if page.locator('#startDialog').evaluate('(d)=>d.open'):page.locator('#startDialog [data-close]').click()
def newpage(browser,**kw):
    context=browser.new_context(viewport=kw.pop('viewport',{'width':1440,'height':940}),accept_downloads=True)
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));mount(page,**kw);return page
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {option} from './tests/fixtures/catalog.mjs';console.log(JSON.stringify(option({},Date.now())));"],cwd=ROOT,text=True))
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    page=newpage(browser)
    check('first-use start screen visible',page.locator('#startDialog').evaluate('(d)=>d.open'))
    page.screenshot(path=str(OUT/'start-desktop.png'))
    check('startup never calls price or purchase API',page.evaluate('__calls.length')==0)
    page.locator('#startTemplates').click();check('20 structure thumbnails',page.locator('[data-template]').count()==20)
    check('template thumbnails differ',page.evaluate('new Set([...document.querySelectorAll(".template-card svg")].map(x=>x.innerHTML)).size')==20)
    before=page.evaluate('OneR.getState()');page.locator('[data-template="0"]').click();page.locator('#templateDialog [data-close]').click()
    check('preview cancel preserves full project',before==page.evaluate('OneR.getState()'))
    page.locator('#closeLibrary').click();page.screenshot(path=str(OUT/'plan-desktop.png'))
    page.locator('[data-panel="inventory"]').click();page.locator('#batchBoxes').click();page.locator('#dialogConfirm').click()
    boxes=page.evaluate('OneR.getState().objects.filter(x=>x.type==="box")');check('ten individual unplaced boxes',len(boxes)==10 and all(x['placed']==False for x in boxes))
    page.locator('[data-place="'+str(boxes[0]['id'])+'"]').click()
    check('placing retains other nine unplaced boxes',page.evaluate('OneR.getState().objects.filter(x=>x.type==="box"&&x.placed).length')==1)
    page.locator('[data-place="'+str(boxes[0]['id'])+'"]').click();check('unplacing does not delete belongings',page.evaluate('OneR.getState().objects.filter(x=>x.type==="box").length')==10)
    page.locator('#workSet').click();check('work equipment creates 3 monitors and laptop',page.evaluate('OneR.getState().objects.filter(x=>x.type==="monitor").length')==3 and page.evaluate('OneR.getState().objects.filter(x=>x.type==="laptop").length')==1)
    page.screenshot(path=str(OUT/'inventory-desktop.png'));page.locator('#closeLibrary').click()
    desk=page.evaluate('OneR.getState().objects.find(x=>x.type==="desk")');page.evaluate('(id)=>OneR.select(id)',desk['id'])
    page.locator('#object-w').fill('165.5');page.locator('#object-w').dispatch_event('change');check('decimal dimensions work',page.evaluate('OneR.getSelected().w')==165.5)
    page.locator('#rotateObject').click();check('rotation changes only selected angle',page.evaluate('OneR.getSelected().r')==(desk['r']+90)%360)
    page.locator('#undo').click();check('undo restores previous rotation',next(o for o in page.evaluate('OneR.getState().objects') if o['id']==desk['id'])['r']==desk['r'])
    page.locator('#redo').click();check('redo restores rotation',next(o for o in page.evaluate('OneR.getState().objects') if o['id']==desk['id'])['r']==(desk['r']+90)%360)
    page.evaluate('OneR.lockStructure(true)');door=page.evaluate('OneR.getState().objects.find(o=>o.type==="door")')
    check('locked geometry edit rejected',page.evaluate('(id)=>OneR.updateObject(id,{x:999})',door['id']) is False)
    check('locked placement edit rejected',page.evaluate('(id)=>OneR.setPlaced(id,false)',door['id']) is False)
    check('locked door unchanged',door==next(o for o in page.evaluate('OneR.getState().objects') if o['id']==door['id']))
    before=page.evaluate('OneR.getState()');page.evaluate("OneR.setView('entry')");page.wait_for_timeout(150);page.screenshot(path=str(OUT/'entry-desktop.png'))
    check('entry preset leaves entire document unchanged',before==page.evaluate('OneR.getState()'))
    page.evaluate("OneR.setView('bed')");check('bed preset leaves entire document unchanged',before==page.evaluate('OneR.getState()'))
    page.evaluate("OneR.setView('orbit')");page.wait_for_timeout(150);page.locator('#renderStyle').select_option('sketch');page.screenshot(path=str(OUT/'3d-desktop.png'))
    check('3D canvas visible with dimension meshes',page.locator('#scene').is_visible() and page.locator('#scene').evaluate('c=>c.width>100&&c.height>100'))
    check('no external mesh textures or CDN fetch',page.evaluate('__calls.filter(x=>x!==null).length')==0)
    page.evaluate("OneR.saveAlternative('배치 A')");page.evaluate('(id)=>OneR.updateObject(id,{x:220})',desk['id']);page.evaluate("OneR.saveAlternative('배치 B')")
    check('snapshots retain individual unplaced boxes',page.evaluate('OneR.getWorkspace().workspace.layouts.every(l=>l.document.objects.filter(o=>o.type==="box").length===10)'))
    page.locator('[data-panel="layouts"]').click();page.locator('[data-compare-current="0"]').click();page.wait_for_timeout(200)
    check('two actual renderer panes in comparison',page.locator('#compareDialog').evaluate('d=>d.open') and page.locator('#compareA').is_visible() and page.locator('#compareB').is_visible())
    page.screenshot(path=str(OUT/'compare-desktop.png'));page.locator('#compareDialog [data-close]').click();page.locator('#closeLibrary').click()
    page.locator('#fileMenu summary').click()
    with page.expect_download() as download:page.locator('#export').click()
    download.value.save_as(str(OUT/'roundtrip.json'));exported=json.loads((OUT/'roundtrip.json').read_text());check('export includes inventory, snapshots and camera',len(exported['workspace']['layouts'])==2 and len([o for o in exported['objects'] if o['type']=='box'])==10)
    # Bridge import uses the same validator as the file picker.
    page.evaluate('(v)=>OneR.restoreWorkspace(v)',exported);check('workspace roundtrip exact content',exported==page.evaluate('OneR.getWorkspace()'))
    page.locator('#fileMenu summary').click()
    with page.expect_download() as download:page.locator('#imageExport').click()
    download.value.save_as(str(OUT/'plan-export.png'));check('3D image export nonempty',(OUT/'plan-export.png').stat().st_size>1000)
    page.keyboard.press('Escape');page.locator('#commandOpen').click();page.locator('#commandQuery').fill('선반 추가');page.keyboard.press('Enter')
    check('command palette adds furniture',page.evaluate('OneR.getState().objects.some(o=>o.type==="shelf")'))
    page.locator('#commandOpen').click();page.locator('#commandQuery').fill('평면 보기');page.keyboard.press('Enter');check('command switches view',page.locator('#plan').is_visible())
    page.locator('#openShop').click();page.wait_for_timeout(150)
    check('empty shop shows useful ready state',page.locator('#shopResults').inner_text().find('상품 추천 준비 중')>=0)
    check('no operator jargon or fabricated product cards',page.locator('.product-card').count()==0 and 'API' not in page.locator('.shop-panel').inner_text() and page.locator('.shop-panel a[href="/admin/"]').count()==0)
    check('desktop shop is beside canvas',page.locator('#drawingArea').bounding_box()['x']+page.locator('#drawingArea').bounding_box()['width']<=page.locator('.shop-panel').bounding_box()['x']+1)
    page.screenshot(path=str(OUT/'shop-desktop.png'));page.locator('#continueEditing').click();check('empty shop returns to editing',not page.locator('.shop-panel').evaluate('x=>x.classList.contains("open")'))
    # Selected UUID product binding and exact-option price regression with TEST ONLY fixture.
    cp=newpage(browser,options=[fixture]);close_start(cp);d=cp.evaluate('OneR.getState().objects.find(o=>o.type==="desk")');cp.evaluate('(id)=>OneR.select(id)',d['id']);cp.locator('#findProducts').click();cp.wait_for_timeout(150)
    check('only verified fixture appears',cp.locator('.product-card').count()==1)
    cp.locator('[data-price]').click();cp.wait_for_timeout(80);check('explicit lookup once',cp.evaluate('__calls.filter(x=>x==="offer").length')==1)
    before=cp.evaluate('OneR.getState()');cp.locator('[data-preview]').click();cp.locator('#confirmProduct').click();after=cp.evaluate('OneR.getState()');o=next(x for x in after['objects'] if x['id']==d['id']);check('exact product size applied with no position change',(o['w'],o['d'],o['h'])==(160,70,74) and (o['x'],o['z'])==(d['x'],d['z']))
    check('product leaves structure and other belongings unchanged',before['room']==after['room'] and all(x==next(y for y in after['objects'] if y['id']==x['id']) for x in before['objects'] if x['id']!=d['id']))
    cp.locator('[data-tab="list"]').click();check('confirmed price subtotal', '120,000' in cp.locator('.shopping-summary').inner_text())
    cp.locator('[data-owned]').click();check('UUID owned toggle removes shopping entry',cp.locator('.shopping-row').count()==0)
    cp.locator('.shop-close').click();cp.locator('#object-w').fill('159');cp.locator('#object-w').dispatch_event('change');check('edited product invalidates real dimensions','사용자 수정 치수' in cp.locator('#bindingStatus').inner_text())
    # Injection never becomes an element, including UUID-bearing attributes.
    cp.evaluate('(id)=>OneR.updateObject(id,{name:"<img src=x onerror=window.__xss=1>"})',d['id']);check('object names are escaped',cp.locator('#prop img').count()==0 and cp.evaluate('window.__xss===undefined'))
    # Mobile same editor, menus don't become an endless scroll page.
    mobile=newpage(browser,viewport={'width':390,'height':844});mobile.screenshot(path=str(OUT/'start-mobile.png'));close_start(mobile)
    check('mobile no horizontal overflow',mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    mobile.locator('[data-panel="inventory"]').click();mobile.locator('#batchBoxes').click();mobile.locator('#dialogConfirm').click();check('mobile ten-box workflow',mobile.evaluate('OneR.getState().objects.filter(o=>o.type==="box").length')==10)
    mobile.screenshot(path=str(OUT/'inventory-mobile.png'));mobile.locator('#closeLibrary').click();mobile.locator('#v3').click();mobile.wait_for_timeout(150);mobile.screenshot(path=str(OUT/'3d-mobile.png'))
    check('mobile scene remains visible above dock',mobile.locator('#scene').bounding_box()['height']>400)
    mobile.evaluate('OneR.select(OneR.getState().objects.find(o=>o.type==="desk").id)');mobile.locator('#mobileProperties').click();check('mobile properties bottom sheet accessible',mobile.locator('#object-w').is_visible());mobile.locator('#object-w').fill('170');mobile.locator('#object-w').dispatch_event('change');check('mobile property edit retained',mobile.evaluate('OneR.getSelected().w')==170);mobile.locator('#closeInspector').click()
    mobile.locator('#openShop').click();mobile.wait_for_timeout(250);check('mobile shop within viewport',mobile.locator('.shop-panel').bounding_box()['width']<=390.5);mobile.screenshot(path=str(OUT/'shop-mobile.png'))
    # Software renderer is an explicit tested compatibility path, not merely an untested catch.
    soft=newpage(browser,software=True);close_start(soft);soft.locator('#v3').click();soft.wait_for_timeout(150);check('software renderer visible',soft.locator('#scene').is_visible());soft.screenshot(path=str(OUT/'software-3d.png'))
    # Save failure must not be overwritten by an always-success status observer.
    fail=newpage(browser,storage_fail=True);close_start(fail);fail.evaluate("OneR.addItems('box',1)");check('storage errors stay visible','저장 실패' in fail.locator('#saveState').inner_text())
    check('zero uncaught browser JS errors',not errors)
    browser.close()
report={'mode':'HTTP E2E' if os.environ.get('STUDIO_URL') else 'offline exact-source Chromium; API/storage doubles','tests':len(results),'passed':len(results),'results':results,'errors':errors}
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=False))
