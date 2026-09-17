"""Exercise the actual ganja assets and UI. --serve uses a real local HTTP origin.
Without --serve, offline set_content is used, with only verification.json mocked.
CHROMIUM may point at a system executable; otherwise Playwright's browser is used.
"""
from pathlib import Path
import argparse, json, os, re, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--serve', action='store_true');parser.add_argument('--url');args=parser.parse_args()
server=None
if args.serve:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/'
else: base=args.url
results=[];errors=[];failures=[]

def load(page):
    if base:
        page.goto(base,wait_until='networkidle')
    else:
        html=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',(ROOT/'index.html').read_text())
        html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(ROOT/'style.css').read_text()+'</style>')
        page.set_content(html,wait_until='load')
        page.evaluate('v=>{window.fetch=async()=>new Response(JSON.stringify(v),{status:200,headers:{"Content-Type":"application/json"}})}',json.loads((ROOT/'verification.json').read_text()))
        for f in ['vendor/ganja.js','engine.js','pga.js','ganja-view.js','app.js']:
            page.add_script_tag(content=(ROOT/f).read_text())
        page.wait_for_timeout(120)

def drag_handle(page,handle,dx,dy):
    loc=page.locator(f'[data-handle="{handle}"] circle')
    box=loc.bounding_box();assert box,handle
    x,y=box['x']+box['width']/2,box['y']+box['height']/2
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=5);page.mouse.up()

with sync_playwright() as p:
    options={'headless':True}
    if os.environ.get('CHROMIUM'):options['executable_path']=os.environ['CHROMIUM']
    browser=p.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('requestfailed',lambda req:failures.append(req.url))
    load(page)
    page.locator('#follow').uncheck()
    assert page.locator('#ganja-svg').get_attribute('data-renderer')=='ganja.js'
    assert page.locator('#ganja-svg line').count()>100
    assert page.locator('#conic-preset').input_value()=='chern'
    assert page.evaluate('incidenceApp.state.params.diagonal')<0
    assert page.locator('#ganja-svg [data-conic-dash]').count()==0
    page.locator('#complete').click()
    assert page.locator('#ganja-svg [data-conic-dash] path').count()==1
    assert page.locator('#completion-key').is_visible()
    page.locator('#demo').screenshot(path=str(ROOT/'chern-eight-preview.png'))
    page.locator('#conic-preset').select_option('compact')
    assert page.evaluate('incidenceApp.state.params.diagonal')==3.5
    assert not page.evaluate('incidenceApp.state.complete')
    page.locator('#reset').click()
    assert page.locator('#conic-preset').input_value()=='compact'
    page.locator('#conic-preset').select_option('chern')
    assert page.evaluate('incidenceApp.getData().minMinor')>0
    results.append('Chern-inspired and original presets; reset preserves selection; eighth conic has continuous dashes')
    page.locator('#complete').click();page.locator('#inspect').select_option('edge:0')
    assert '12 edge identities' in page.locator('#readout').inner_text()
    assert '2 real contact points' in page.locator('#readout').inner_text()
    before=page.evaluate('incidenceApp.state.params.offsets[0]')
    drag_handle(page,'seed:0',16,0)
    assert abs(page.evaluate('incidenceApp.state.params.offsets[0]')-before)>.02
    page.locator('#envelope').check()
    page.locator('#inspect').select_option('face:1')
    assert page.locator('.face-chip.active').count()==1
    results.append('Native ganja conic rendering, contact chords, face selection, seed dragging and tangents')

    page.locator('#tab-pascal').click()
    assert page.locator('[data-handle]').count()==5
    assert page.locator('#construction-link').is_visible() and not page.locator('#lemma-link').is_visible()
    before=page.evaluate('incidenceApp.state.five[2]')
    drag_handle(page,'five:2',24,-18)
    after=page.evaluate('incidenceApp.state.five[2]')
    assert after[0]>before[0] and after[1]>before[1]
    assert page.evaluate('incidenceApp.getData().residual')<1e-8
    handle=page.locator('[data-handle="five:2"]');handle.focus();page.keyboard.press('ArrowRight')
    assert page.evaluate('incidenceApp.state.five[2][0]')>after[0]
    assert page.locator('[data-handle="five:2"]:focus').count()==1
    theta=page.evaluate('incidenceApp.state.theta');page.locator('#play').click();page.wait_for_timeout(400);page.locator('#play').click()
    assert page.evaluate('incidenceApp.state.theta')!=theta
    page.evaluate('window.scrollTo({top:350,behavior:"instant"})');page.wait_for_timeout(100)
    page.screenshot(path=str(ROOT/'ganja-preview.png'))
    results.append('Pascal locus, movable sixth point, native joins/meets, dragging and keyboard handles')

    page.evaluate('incidenceApp.state.five=[[0,0,1],[1,0,1],[2,0,1],[0,1,1],[1,1,1]];incidenceApp.render()')
    assert 'no three collinear' in page.locator('#readout').inner_text()
    assert page.evaluate('incidenceApp.getData()') is None
    assert page.locator('[data-handle]').count()==5
    page.locator('#reset').click();assert page.evaluate('incidenceApp.getData().complete')
    results.append('Degenerate Pascal input rejected; handles remain available for recovery')

    page.locator('#tab-fomin').click();page.locator('#complete').click()
    assert '6 coherent faces' in page.locator('#readout').inner_text()
    assert page.evaluate('incidenceApp.getData().thirdError')<1e-8
    drag_handle(page,'center:0',10,-6)
    assert page.evaluate('incidenceApp.getData().error')<1e-8
    results.append('Ganja-computed Fomin/Desargues cube and center dragging')

    page.locator('#tab-surface').click();page.locator('#perturb').click()
    assert '2 face ratios differ' in page.locator('#readout').inner_text()
    assert 'exactly' in page.locator('#readout').inner_text()
    page.locator('#coherent').click();assert 'All six faces' in page.locator('#readout').inner_text()
    results.append('Unchanged exact BigInt surface cancellation')

    page.locator('#tab-bridge').click()
    page.locator('input[aria-label="pencil t"]').evaluate("e=>{e.value='1.2';e.dispatchEvent(new Event('input',{bubbles:true}))}")
    assert page.locator('.coeff-cell').count()==6
    assert page.locator('#ganja-svg line').count()>20
    assert not page.locator('#ganja-svg [x1="NaN"], #ganja-svg [cx="NaN"]').count()
    page.locator('#tab-bridge').focus();page.keyboard.press('ArrowRight')
    assert page.evaluate('incidenceApp.state.mode')=='penrose'
    results.append('Non-elliptic conic branches, coefficient display and five-tab keyboard navigation')

    stage=page.locator('#geometry').bounding_box()
    before=page.evaluate('incidenceApp.state.pan')
    page.mouse.move(stage['x']+35,stage['y']+35);page.mouse.down();page.mouse.move(stage['x']+60,stage['y']+55);page.mouse.up()
    assert page.evaluate('incidenceApp.state.pan')!=before
    page.keyboard.down('Shift');page.mouse.wheel(0,-180);page.keyboard.up('Shift');page.wait_for_timeout(100)
    assert page.evaluate('incidenceApp.state.zoom')>1
    page.locator('#fit-view').click();assert page.evaluate('incidenceApp.state.pan')==[0,0]
    results.append('Responsive SVG pan, Shift-wheel zoom and fit-view reset')

    page.locator('#follow').check()
    page.evaluate("document.querySelector('#classical').scrollIntoView({behavior:'instant'})");page.wait_for_timeout(300)
    assert page.evaluate('incidenceApp.state.mode')=='pascal'
    page.locator('#tab-penrose').click();assert not page.locator('#follow').is_checked()
    results.append('Sticky panel, section following and manual override')

    for width,height in [(1440,1000),(1000,800),(820,900),(390,844)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(100)
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),width
    page.evaluate("incidenceApp.setMode('penrose',true);incidenceApp.state.complete=true;incidenceApp.render()")
    page.locator('#demo').scroll_into_view_if_needed()
    page.locator('#demo').screenshot(path=str(ROOT/'chern-mobile-preview.png'))
    assert page.locator('#ganja-svg [data-conic-dash] path').count()==1
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
    page.evaluate("incidenceApp.setMode('pascal',true)")
    page.locator('#demo').scroll_into_view_if_needed();page.wait_for_timeout(100)
    page.screenshot(path=str(ROOT/'ganja-mobile-preview.png'))
    before=page.evaluate('incidenceApp.state.five[2][0]');drag_handle(page,'five:2',15,0)
    assert page.evaluate('incidenceApp.state.five[2][0]')>before
    results.append('Mobile 390px and tablet layouts; correct non-square dragging')
    assert not errors,errors
    if base:assert not failures,failures
    browser.close()
if server:server.shutdown()
record={'status':'passed','checks':results,'javascriptErrors':errors,'failedRequests':failures,
 'method':'HTTP-loaded real assets' if base else 'Offline real assets in Chromium; only the verification.json fetch is supplied locally',
 'scope':'Interactive software checks, not Lean proof evidence.'}
(ROOT/'ganja-browser-test-results.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record,indent=2))
