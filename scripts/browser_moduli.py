"""Exercise random Penrose exploration using real browser pointer/control events.
--serve uses HTTP; offline mode assembles the same source assets without a server.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse,json,os,re,threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--serve',action='store_true');args=a.parse_args()
server=None;errors=[];failed=[];checks=[]
if args.serve:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
    opts={'headless':True}
    if os.getenv('CHROMIUM'):opts['executable_path']=os.environ['CHROMIUM']
    browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':1100})
    page.set_default_timeout(15000);page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('requestfailed',lambda r:failed.append(r.url))
    if server:page.goto(f'http://127.0.0.1:{server.server_port}/?stage=penrose',wait_until='networkidle')
    else:
        s=(ROOT/'index.html').read_text();files=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',s)
        s=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',s)
        s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(ROOT/m[1]).read_text()+'</style>',s)
        page.set_content(s)
        for f in files:page.add_script_tag(content=(ROOT/f).read_text())
        page.evaluate('incidenceStory.setPhase(3)')
    page.wait_for_timeout(200)
    # Test actual continuous motion, not just endpoint assignment.
    page.locator('#walk-duration').evaluate("e=>{e.value=3;e.dispatchEvent(new Event('input',{bubbles:true}));}")
    p0=page.evaluate('JSON.stringify(incidenceStory.state.p)')
    page.locator('#random-target').click();page.wait_for_timeout(300)
    assert page.evaluate('incidenceStory.tour.running')
    p1=page.evaluate('JSON.stringify(incidenceStory.state.p)');assert p1!=p0
    progress=page.locator('#walk-progress').evaluate('e=>e.value');assert 0<progress<1
    # Changing duration changes SPEED, not position on the route.
    page.locator('#wander').click();paused=page.evaluate('JSON.stringify(incidenceStory.state.p)')
    t=page.evaluate('incidenceStory.tour.progress')
    page.locator('#walk-duration').evaluate("e=>{e.value=9;e.dispatchEvent(new Event('input',{bubbles:true}));}")
    page.wait_for_timeout(120);assert paused==page.evaluate('JSON.stringify(incidenceStory.state.p)')
    assert page.evaluate('incidenceStory.tour.progress')==t
    page.locator('#wander').click();page.wait_for_timeout(180)
    assert 0<page.evaluate('incidenceStory.tour.progress')-t<.12
    page.locator('#walk-duration').evaluate("e=>{e.value=3;e.dispatchEvent(new Event('input',{bubbles:true}));}")
    page.wait_for_function('!incidenceStory.tour.running',timeout=18000)
    assert page.evaluate('incidenceStory.tour.steps')==1
    assert not page.locator('#story-readout').evaluate("e=>e.classList.contains('error')")
    assert page.evaluate('new Set(incidenceStory.state.p.couplings).size')==3
    checks.append('Smooth one-target motion, pause/resume, continuous speed changes and unequal couplings')
    page.locator('#cube-model').select_option('chords');page.wait_for_timeout(100)
    # Locked chords give an experimentally visible counterexample to cuboid completeness.
    page.locator('#lock-chords').check()
    shape=page.locator('#story-cube').get_attribute('data-shape')
    conics=page.evaluate('JSON.stringify(incidenceStory.getData().primal)')
    page.locator('#random-target').click();page.wait_for_timeout(350)
    assert shape==page.locator('#story-cube').get_attribute('data-shape')
    assert conics!=page.evaluate('JSON.stringify(incidenceStory.getData().primal)')
    # Face inspection remains live during the tour; it is not a geometric edit.
    page.locator('[data-cube-face="0"]').click();page.wait_for_timeout(200)
    assert page.evaluate('incidenceStory.tour.running')
    assert page.evaluate('incidenceStory.state.selection')=='face:0'
    assert 'concurrence residual' in page.locator('#story-readout').text_content()
    # Cube orbit changes its camera only.
    camera=page.locator('#story-cube').get_attribute('data-camera')
    page.locator('#story-cube').focus();page.keyboard.press('ArrowRight');page.wait_for_timeout(80)
    assert camera!=page.locator('#story-cube').get_attribute('data-camera')
    assert shape==page.locator('#story-cube').get_attribute('data-shape')
    page.wait_for_function('!incidenceStory.tour.running',timeout=18000)
    checks.append('Fixed cuboid with changing conics; independent camera and persistent live face inspection')
    # Repeating wander completes more than one leg. Geometry changes cancel it.
    count=page.evaluate('incidenceStory.tour.steps');page.locator('#wander').click()
    page.wait_for_function('n=>incidenceStory.tour.steps>=n+1',arg=count,timeout=18000)
    assert page.evaluate('incidenceStory.tour.running')
    page.locator('#moduli-parameters summary').click()
    page.locator('#weight-0').evaluate("e=>{e.value=.8;e.dispatchEvent(new Event('input',{bubbles:true}));}")
    page.wait_for_timeout(150);assert not page.evaluate('incidenceStory.tour.running')
    assert page.locator('.modulus').count()==9
    assert all(page.locator(f'#invariant-{i}').inner_text()!='—' for i in range(9))
    checks.append('Repeated destinations, manual-edit cancellation and nine-coordinate readout')
    # New parameters must not break earlier singular endpoints or either spatial view.
    for t in [0,.4,1,1.7,2,2.5,3]:
        page.evaluate('t=>incidenceStory.setPhase(t)',t);page.wait_for_timeout(90)
        assert not page.locator('#story-readout').evaluate("e=>e.classList.contains('error')"),t
    page.evaluate("incidenceStory.setScene('extrusion')");page.wait_for_timeout(180)
    assert page.evaluate('incidenceStory.getData().error')<1e-7
    assert not page.locator('#moduli-controls').is_visible()
    page.evaluate('incidenceStory.setPhase(3)');page.wait_for_timeout(130)
    checks.append('Unequal couplings retained through the whole narrative and quadric lifting')
    # Reduced motion is respected by direct user-triggered random targets.
    page.emulate_media(reduced_motion='reduce');p0=page.evaluate('JSON.stringify(incidenceStory.state.p)')
    page.locator('#random-target').click();page.wait_for_timeout(150)
    assert not page.evaluate('incidenceStory.tour.running')
    assert p0!=page.evaluate('JSON.stringify(incidenceStory.state.p)')
    assert 'reduced-motion' in page.locator('#walk-status').inner_text()
    page.emulate_media(reduced_motion='no-preference')
    page.locator('#walk-seed').evaluate("e=>e.value=123")
    page.locator('#walk-reseed').evaluate('e=>e.click()');assert page.evaluate('incidenceStory.tour.steps')==0
    checks.append('Reduced-motion preference and explicit reproducible seed reset')
    page.locator('#cube-clear').click();page.locator('#moduli-parameters summary').click()
    page.evaluate("document.getElementById('laboratory').scrollTop=0;window.scrollTo({top:0,behavior:'instant'})")
    page.wait_for_timeout(100);page.screenshot(path=str(ROOT/'moduli-preview.png'))
    for w,h in [(1100,850),(820,1000),(390,844)]:
        page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(150)
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),w
    page.locator('#random-target').scroll_into_view_if_needed();page.screenshot(path=str(ROOT/'moduli-mobile-preview.png'))
    checks.append('Desktop, tablet and mobile layouts without horizontal overflow')
    assert not errors,errors;assert not failed,failed;browser.close()
if server:server.shutdown()
result={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failed,'method':'HTTP-loaded actual assets' if server else 'Offline-assembled actual local assets','scope':'Browser implementation tests, not formal moduli/path verification.'}
(ROOT/'moduli-browser-test-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
