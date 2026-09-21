"""The third chapter connects its geometry to chapters 1 and 2.

--serve tests real HTTP assets in CI. Offline mode injects the same files when
local browser network policy blocks localhost. No mock geometry is substituted.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, json, os, re, threading
from playwright.sync_api import sync_playwright
from surface_test_ui import select_surface_face

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--serve',action='store_true');args=ap.parse_args()
server=None;errors=[];failed=[];checks=[]
if args.serve:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()

def load(page,query=''):
    if server:
        page.goto(f'http://127.0.0.1:{server.server_port}/connections.html'+query,wait_until='networkidle')
    else:
        page.goto('about:blank');html=(ROOT/'connections.html').read_text()
        scripts=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',html)
        html=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',html)
        html=re.sub(r'<link\b[^>]*href="([^"]+)"[^>]*>',lambda m:'<style>'+(ROOT/m[1]).read_text()+'</style>',html)
        page.set_content(html)
        for src in scripts:page.add_script_tag(content=(ROOT/src).read_text())
    page.wait_for_function('document.documentElement.dataset.mathReady === "true"')
    page.wait_for_timeout(80)
    if not server and 'example=cube' in query:
        page.locator('#surface-example').select_option('cube');page.wait_for_timeout(80)

def slider(page,id,value):
    page.locator('#'+id).evaluate('(e,v)=>{e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}));}',value)
    page.wait_for_timeout(60)

def no_overflow(page):
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
    assert page.locator('.prose [data-mml-node="merror"]').count()==0
    assert not page.locator('.prose mjx-container[display="true"]').evaluate_all('(es)=>es.some(e=>e.getBoundingClientRect().width>0 && e.scrollWidth>e.clientWidth+2)')

try:
    with sync_playwright() as p:
        opts={'headless':True}
        if os.getenv('CHROMIUM'):opts['executable_path']=os.environ['CHROMIUM']
        b=p.chromium.launch(**opts);page=b.new_page(viewport={'width':1440,'height':1100})
        page.on('pageerror',lambda e:errors.append(str(e)));page.on('requestfailed',lambda r:failed.append(r.url))
        if server:page.on('response',lambda r:failed.append(f'{r.status}: {r.url}') if r.status>=400 else None)
        load(page)
        assert page.evaluate('conicSurface.state.kind')=='torus'
        assert page.locator('.parent-chapters a').count()==2
        assert page.locator('.parent-chapters a').nth(0).get_attribute('href')=='index.html#penrose'
        assert page.locator('.parent-chapters a').nth(1).get_attribute('href')=='fomin.html#main-theorem'
        assert page.locator('#from-fomin a[href="fomin.html#pappus"]').count()==1
        assert 'different implication' in page.locator('#from-penrose').inner_text()
        assert 'pointwise conversion' in page.locator('#from-fomin').inner_text()
        checks.append('Two parent chapters and their precise mathematical roles are linked; completion and compatibility are distinguished')
        page.locator('#from-penrose [data-net-example="cube"]').click();page.wait_for_timeout(100)
        assert page.evaluate('conicSurface.state.kind')=='cube'
        assert page.evaluate('conicSurface.getData().faces.length')==6
        assert page.locator('#net-map').is_hidden()
        assert page.locator('#cube-patches').is_visible()
        assert page.evaluate('conicSurface.getData().maxEdge<1e-8 && conicSurface.getData().maxFace<1e-8')
        for f in range(6):
            select_surface_face(page, f);page.wait_for_timeout(40)
            assert page.locator('#holonomy-value').inner_text()=='?'
            page.locator('#reveal-face').click();page.wait_for_timeout(40)
            assert page.locator('#holonomy-value').inner_text()=='1'
            for e in range(4):
                page.locator(f'[data-contact="{e}"]').click();page.wait_for_timeout(25)
                assert page.evaluate('conicSurface.state.edge')==e
                assert page.locator('#surface-geometry svg').count()==1
        checks.append('All six cubical faces and all 24 directed face-edge inspections retain contact and concurrence')
        canvas=page.locator('#net-topology');canvas.scroll_into_view_if_needed();box=canvas.bounding_box()
        old=page.evaluate('JSON.stringify(conicSurface.getData().Q)');camera=page.evaluate('[conicSurface.state.yaw,conicSurface.state.tilt]')
        page.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5);page.mouse.down();page.mouse.move(box['x']+box['width']*.6,box['y']+box['height']*.6,steps=10);page.mouse.up();page.wait_for_timeout(80)
        assert camera!=page.evaluate('[conicSurface.state.yaw,conicSurface.state.tilt]')
        assert old==page.evaluate('JSON.stringify(conicSurface.getData().Q)')
        oldface=page.evaluate('conicSurface.state.face');picked=False
        for x,y in [(.5,.4),(.55,.6),(.45,.6),(.6,.5)]:
            page.mouse.click(box['x']+box['width']*x,box['y']+box['height']*y);page.wait_for_timeout(40)
            if page.evaluate('conicSurface.state.face')!=oldface:picked=True;break
        assert picked
        checks.append('Independent cube camera and actual face picking change only the inspection, not the conics')
        page.locator('#cube-base-patch').click();page.wait_for_timeout(60)
        a=page.evaluate('ConicNet.boundary(conicSurface.getData(),conicSurface.state.region)')
        assert '3 internal edges cancel' in page.locator('#patch-readout').inner_text()
        page.locator('#cube-opposite-patch').click();page.wait_for_timeout(60)
        c=page.evaluate('ConicNet.boundary(conicSurface.getData(),conicSurface.state.region)')
        assert len(a['boundaryEdges'])==len(c['boundaryEdges'])==6
        assert {e['edge']:e['direction'] for e in a['boundaryEdges']}=={e['edge']:-e['direction'] for e in c['boundaryEdges']}
        assert '6 boundary edges' in page.locator('#patch-readout').inner_text()
        checks.append('Complementary three-face patches have exactly the same six contact edges and opposite boundary orientations')
        slider(page,'net-gauge',1.4);slider(page,'net-amount',.8);slider(page,'net-twist',-.2)
        assert page.evaluate('conicSurface.getData().maxEdge')<1e-8
        saved=page.evaluate('conicSurface.snapshot()');old=page.evaluate('JSON.stringify(conicSurface.getData().Q)')
        page.evaluate('conicSurface.restore(conicSurface.snapshot());conicSurface.render()')
        assert page.evaluate('conicSurface.snapshot()')==saved
        assert page.evaluate('JSON.stringify(conicSurface.getData().Q)')==old
        if server:
            page.locator('#bookmark-scene').click();url=page.url;page.goto(url,wait_until='networkidle');page.wait_for_timeout(100)
            assert page.evaluate('conicSurface.snapshot()')==saved
        page.emulate_media(reduced_motion='reduce');page.locator('#trace-scale').click();page.wait_for_timeout(80)
        assert 'back to the original scale' in page.locator('#transport-trace').inner_text()
        page.locator('#animate-net').click();page.wait_for_timeout(80)
        assert not page.evaluate('conicSurface.state.animate')
        assert page.evaluate('conicSurface.getData().maxFace')<1e-8
        checks.append('Cube deformations, equation rescaling, reduced-motion trace and saved-state recovery use the same contact construction')
        for kind,count in [('torus',16),('odd',12),('square',1),('cube',6)]:
            page.locator('#surface-example').select_option(kind);page.wait_for_timeout(80)
            assert page.evaluate('conicSurface.getData().faces.length')==count
            assert not page.locator('#surface-status').evaluate('e=>e.classList.contains("error")')
        load(page,'?example=cube');page.locator('#net-context').check();page.locator('#surface-laboratory').evaluate('e=>e.scrollTop=0');page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(100)
        page.screenshot(path=str(ROOT/'connections-bridge-desktop.png'))
        for w in [1440,1200,1000,960,820,600,390,360,320]:
            page.set_viewport_size({'width':w,'height':1000});page.wait_for_timeout(60);no_overflow(page)
        page.set_viewport_size({'width':390,'height':844});page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(ROOT/'connections-bridge-mobile.png'))
        checks.append('Old surface examples remain available; new LaTeX, cube and chapter links fit widths from 320 to 1440 pixels')
        assert not errors,errors;assert not failed,failed;b.close()
finally:
    if server:server.shutdown()
r={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failed,'method':'HTTP-loaded actual assets' if args.serve else 'Offline-assembled actual local assets','scope':'Presentation and example checks; no additional Lean claims'}
(ROOT/'conic-bridge-browser-test-results.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2))
