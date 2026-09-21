"""Regression tests for the results-first three-page release.

--serve validates real HTTP assets in CI. Default mode assembles the same local
assets without network access. CHROMIUM optionally selects a browser binary.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, json, os, re, threading
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--serve',action='store_true');args=parser.parse_args()
server=None;errors=[];failures=[];checks=[]
if args.serve:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()

def load(page,name):
    if server:
        page.goto(f'http://127.0.0.1:{server.server_port}/{name}',wait_until='networkidle')
    else:
        page.goto('about:blank');html=(ROOT/name).read_text()
        files=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',html)
        html=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',html)
        html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(ROOT/m[1]).read_text()+'</style>',html)
        page.set_content(html)
        for file in files:page.add_script_tag(content=(ROOT/file).read_text())
    page.wait_for_timeout(100)

with sync_playwright() as p:
    options={'headless':True}
    if os.getenv('CHROMIUM'):options['executable_path']=os.environ['CHROMIUM']
    browser=p.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1100})
    page.set_default_timeout(12000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('requestfailed',lambda r:failures.append(r.url))
    if server:
        page.on('response',lambda r:failures.append(f'HTTP {r.status}: {r.url}') if r.status>=400 else None)
    load(page,'index.html')
    assert not page.locator('#moduli-controls').is_visible()
    assert page.locator('#story-geometry [data-handle]').count()==6
    page.locator('#follow-story').uncheck()
    page.locator('[data-go="1"]').first.click()
    assert not page.locator('#moduli-controls').is_visible()
    page.locator('#pascal .short-proof summary').click()
    assert 'reducible conic' in page.locator('#pascal .short-proof').inner_text()
    page.evaluate('incidenceStory.setPhase(3)');page.wait_for_timeout(150)
    assert page.locator('#moduli-controls').is_visible()
    assert page.locator('[data-vector-corner]').count()==7
    checks.append('Pappus/Pascal remain uncluttered; Penrose retains editable vectors and random motion')

    load(page,'connections.html')
    assert page.locator('#net-face-buttons button').count()==16
    assert page.locator('#holonomy-value').text_content()=='?'
    assert not page.locator('#surface-status').evaluate('e=>e.classList.contains("error")')
    for i in range(16):
        page.locator(f'[data-face="{i}"]').click();page.wait_for_timeout(45)
        assert page.evaluate('conicSurface.state.face')==i
        assert page.locator('#holonomy-value').text_content()=='?'
        page.locator('#reveal-face').click();page.wait_for_timeout(45)
        assert page.locator('#holonomy-value').text_content()=='1'
        assert page.evaluate('conicSurface.getData().faces[conicSurface.state.face].error')<1e-8
    checks.append('All sixteen faces select the linked conics, hide/reveal their concurrence, and retain contact identities')
    for i in range(4):
        page.locator(f'[data-contact="{i}"]').click();page.wait_for_timeout(45)
        assert page.evaluate('conicSurface.state.edge')==i
        assert 'T1' in page.locator('#surface-geometry').text_content()
    page.locator('#clear-contact').click()
    checks.append('Each selected edge displays both contact points and common tangents')

    q0=page.evaluate('conicSurface.getData().Q')
    weights=page.evaluate('conicSurface.getData().edges.map(e=>e.scale)')
    page.locator('#net-gauge').evaluate('e=>{e.value=1.6;e.dispatchEvent(new Event("input",{bubbles:true}))}')
    page.wait_for_timeout(100);q1=page.evaluate('conicSurface.getData().Q')
    assert weights!=page.evaluate('conicSurface.getData().edges.map(e=>e.scale)')
    for a,b in zip(q0,q1):
        a=[x for r in a for x in r];b=[x for r in b for x in r]
        k=max(range(9),key=lambda j:abs(a[j]))
        assert max(abs(x*b[k]-y*a[k]) for x,y in zip(a,b))<1e-7
    assert abs(page.evaluate('conicSurface.getData().product')-1)<1e-10
    page.emulate_media(reduced_motion='reduce');page.locator('#trace-scale').click()
    assert 'back to the original scale' in page.locator('#transport-trace').text_content()
    page.emulate_media(reduced_motion='no-preference')
    checks.append('Equation rescaling changes transports but preserves conics and holonomy; scale trace closes')

    assert page.evaluate('conicSurface.state.map'), 'Torus opens flat'
    page.locator('#net-map').click();page.wait_for_timeout(80)
    assert not page.evaluate('conicSurface.state.map'), '3D orbit remains available explicitly'
    canvas=page.locator('#net-topology');canvas.scroll_into_view_if_needed();r=canvas.bounding_box()
    camera=canvas.get_attribute('data-camera');geometry=page.evaluate('JSON.stringify(conicSurface.getData().Q)')
    page.mouse.move(r['x']+30,r['y']+30);page.mouse.down();page.mouse.move(r['x']+65,r['y']+48,steps=5);page.mouse.up()
    assert camera!=canvas.get_attribute('data-camera')
    assert geometry==page.evaluate('JSON.stringify(conicSurface.getData().Q)')
    old=page.evaluate('conicSurface.state.face');hit=False
    for x,y in [(0.5,.23),(.7,.35),(.32,.4),(.5,.7),(.75,.65)]:
        page.mouse.click(r['x']+x*r['width'],r['y']+y*r['height']);page.wait_for_timeout(60)
        if page.evaluate('conicSurface.state.face')!=old:hit=True;break
    assert hit,'Actual torus face click must select a different face'
    checks.append('Actual torus face picking works; independent orbit leaves geometry unchanged')

    geometry=page.evaluate('JSON.stringify(conicSurface.getData().Q)')
    page.locator('#net-amount').evaluate('e=>{e.value=.8;e.dispatchEvent(new Event("input",{bubbles:true}))}')
    page.wait_for_timeout(90);assert geometry!=page.evaluate('JSON.stringify(conicSurface.getData().Q)')
    assert page.evaluate('conicSurface.getData().maxEdge')<1e-8
    page.locator('#animate-net').click();page.wait_for_timeout(180)
    assert page.evaluate('conicSurface.state.animate')
    page.locator('#animate-net').click();assert not page.evaluate('conicSurface.state.animate')
    page.locator('#surface-example').select_option('square');page.wait_for_timeout(90)
    assert page.locator('#holonomy-value').text_content()=='2'
    assert page.evaluate('conicSurface.getData().maxEdge')<1e-8
    assert page.evaluate('conicSurface.getData().maxFace')>1e-3
    assert page.locator('#reveal-face').is_disabled()
    page.emulate_media(reduced_motion='reduce');page.locator('#trace-scale').click()
    assert 'not back to the original scale' in page.locator('#transport-trace').text_content()
    page.locator('#surface-example').select_option('torus');page.wait_for_timeout(90)
    checks.append('Conic motion stays contact-preserving; exact H=2 example distinguishes contact from concurrence')

    page.evaluate('document.getElementById("surface-laboratory").scrollTop=0;window.scrollTo(0,0)')
    page.screenshot(path=str(ROOT/'release-conic-surface-preview.png'))
    for width in [1100,820,390,320]:
        page.set_viewport_size({'width':width,'height':900});page.wait_for_timeout(90)
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),width
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(90)
    page.screenshot(path=str(ROOT/'release-conic-surface-mobile.png'))
    checks.append('Torus and conic controls remain usable without horizontal overflow down to 320px')
    page.set_viewport_size({'width':1440,'height':1100})
    load(page,'proofs.html')
    assert 'does not settle historical priority' in page.locator('body').text_content()
    assert 'TorusExample.sixteenth_face' in page.locator('body').text_content()
    for width in [1440,820,390]:
        page.set_viewport_size({'width':width,'height':900});page.wait_for_timeout(60)
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
    checks.append('Separate appendix exposes exact hypotheses, theorem entry points, scope and attribution')
    assert not errors,errors
    assert not failures,failures
    browser.close()
if server:server.shutdown()
result={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failures,'method':'HTTP-loaded actual assets' if args.serve else 'Offline-assembled actual local assets'}
(ROOT/'results-browser-test-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
