"""Review regressions: odd-cycle torus, cut-open map, patch boundary, smooth
motion, stale-trace invalidation, keyboard focus, and bookmark round trips.
Use --serve for actual HTTP assets in CI; offline assembly is available locally.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import argparse,json,os,re,threading
from playwright.sync_api import sync_playwright
from surface_test_ui import select_surface_face
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--serve',action='store_true');args=ap.parse_args()
server=None;errors=[];failures=[];checks=[]
if args.serve:
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
def load(page,fragment=''):
 if server:
  # A fragment-only navigation reuses the current document. Reopen from blank
  # so bookmark tests exercise initialization, not an already matching state.
  page.goto('about:blank')
  page.goto(f'http://127.0.0.1:{server.server_port}/connections.html'+fragment,wait_until='networkidle')
 else:
  page.goto('about:blank'+fragment)
  html=(ROOT/'connections.html').read_text();files=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',html)
  html=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',html)
  html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(ROOT/m[1]).read_text()+'</style>',html)
  page.set_content(html)
  for f in files:page.add_script_tag(content=(ROOT/f).read_text())
 page.wait_for_timeout(90)
def slider(page,id,value):
 page.locator('#'+id).evaluate('(e,v)=>{e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}))}',value);page.wait_for_timeout(60)
def coords(page):return page.evaluate('[conicSurface.state.amount,conicSurface.state.twist]')
with sync_playwright() as p:
 options={'headless':True}
 if os.getenv('CHROMIUM'):options['executable_path']=os.environ['CHROMIUM']
 browser=p.chromium.launch(**options)
 page=browser.new_page(viewport={'width':1440,'height':1120});page.set_default_timeout(15000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('requestfailed',lambda r:failures.append(r.url))
 if server:page.on('response',lambda r:failures.append(f'HTTP {r.status}: {r.url}')if r.status>=400 else None)
 load(page)
 assert page.locator('#net-face-buttons').count()==0
 assert page.locator('#face-number').count()==0
 assert page.locator('.net-inspector').count()==0
 assert page.locator('#net-topology').evaluate("e => e.getBoundingClientRect().width > e.closest('.net-layout').clientWidth - 45")
 select_surface_face(page,0)
 c=page.locator('#net-topology')
 for key,face in [('ArrowLeft',12),('ArrowRight',0),('ArrowUp',3),('ArrowDown',0),('End',15),('Home',0)]:
  c.press(key);page.wait_for_timeout(30)
  assert page.evaluate('conicSurface.state.face')==face
 checks.append('Numbered face blocks and counter are removed; full-width map and keyboard seam navigation select faces directly')
 assert page.evaluate('conicSurface.state.map')
 assert page.locator('#net-map').get_attribute('aria-pressed')=='false'
 assert 'Flattened periodic' in page.locator('#net-topology').get_attribute('aria-label')
 assert 'matching arrows' in page.locator('#topology-caption').inner_text()
 # Every face, including both seams and the corner, is pickable in the flat map.
 for kind,rows in [('torus',4),('odd',3)]:
  page.locator('#surface-example').select_option(kind);page.wait_for_timeout(80)
  assert page.locator('#net-topology').get_attribute('data-view')=='flat'
  geometry=page.evaluate('JSON.stringify(conicSurface.getData().Q)')
  c=page.locator('#net-topology');c.scroll_into_view_if_needed();b=c.bounding_box()
  cell=min((b['width']-42)/rows,(b['height']-30)/4)
  x0=(b['width']-rows*cell)/2;y0=(b['height']-4*cell)/2
  for i in range(rows):
   for j in range(4):
    page.mouse.click(b['x']+x0+(i+.5)*cell,b['y']+y0+(j+.5)*cell);page.wait_for_timeout(25)
    assert page.evaluate('conicSurface.state.face')==4*i+j
  assert geometry==page.evaluate('JSON.stringify(conicSurface.getData().Q)')
  old=page.evaluate('conicSurface.snapshot()')
  # A drag on the map must not rotate a hidden camera or select a different face.
  page.mouse.move(b['x']+20,b['y']+20);page.mouse.down();page.mouse.move(b['x']+60,b['y']+45,steps=5);page.mouse.up()
  assert old==page.evaluate('conicSurface.snapshot()')
  page.locator('#net-map').click();page.wait_for_timeout(60)
  assert page.locator('#net-topology').get_attribute('data-view')=='wrapped'
  assert page.locator('#net-map').get_attribute('aria-pressed')=='true'
  page.locator('#net-map').click();page.wait_for_timeout(60)
  assert old==page.evaluate('conicSurface.snapshot()')
  assert geometry==page.evaluate('JSON.stringify(conicSurface.getData().Q)')
 checks.append('Both tori open flat; all 28 numbered faces are directly pickable; view toggles preserve equations, selection and camera')
 # A cube remains rotatable without overwriting the chosen torus presentation.
 page.locator('#surface-example').select_option('cube');page.wait_for_timeout(60)
 assert page.locator('#net-topology').get_attribute('data-view')=='cube'
 page.locator('#cube-base-patch').click();page.wait_for_timeout(60)
 assert page.evaluate('conicSurface.state.map')
 page.locator('#surface-example').select_option('torus');page.wait_for_timeout(60)
 assert page.locator('#net-topology').get_attribute('data-view')=='flat'
 page.locator('#patch-mode').uncheck();page.wait_for_timeout(60)
 # Retain explicitly saved 3D views, including existing version-1 bookmarks.
 page.locator('#net-map').click();page.wait_for_timeout(60)
 saved=page.evaluate('conicSurface.snapshot()');assert saved['map'] is False
 page.locator('#bookmark-scene').click();fragment=page.evaluate('location.hash')
 load(page,fragment)
 assert page.evaluate('conicSurface.snapshot()')==saved
 assert page.locator('#net-topology').get_attribute('data-view')=='wrapped'
 page.locator('#net-map').click();page.wait_for_timeout(60)
 page.locator('#surface-example').select_option('odd');page.wait_for_timeout(100)
 checks.append('Switching through Penrose keeps the flat torus; existing wrapped-view bookmarks still restore exactly')
 assert page.evaluate('conicSurface.getData().faces.length')==12
 assert page.evaluate('!ConicNet.isBicolorable(conicSurface.getData())')
 for i in range(12):
  select_surface_face(page, i);page.locator('#reveal-face').click();page.wait_for_timeout(30)
  assert page.locator('#holonomy-value').text_content()=='1'
  assert page.evaluate('conicSurface.getData().maxFace')<1e-8
 checks.append('Twelve-conic odd-cycle torus: all faces and contacts, without a vertex coloring')
 assert page.evaluate('conicSurface.state.map')
 assert page.locator('#net-topology').get_attribute('data-view')=='flat'
 geometry=page.evaluate('JSON.stringify(conicSurface.getData().Q)')
 assert page.evaluate('conicSurface.state.map')
 c=page.locator('#net-topology');c.scroll_into_view_if_needed();b=c.bounding_box()
 page.mouse.click(b['x']+b['width']*.5,b['y']+b['height']*.36);page.wait_for_timeout(80)
 assert geometry==page.evaluate('JSON.stringify(conicSurface.getData().Q)')
 checks.append('Cut-open periodic map preserves geometry and supports actual face picking')
 page.locator('#patch-controls summary').click();page.locator('#patch-four').click();page.wait_for_timeout(80)
 assert '4 internal edges cancel' in page.locator('#patch-readout').inner_text()
 assert '8 boundary edges' in page.locator('#patch-readout').inner_text()
 page.locator('#patch-all').click();page.wait_for_timeout(80)
 assert '0 boundary edges' in page.locator('#patch-readout').inner_text()
 page.locator('#patch-mode').uncheck();page.wait_for_timeout(80)
 checks.append('Patch selection cancels internal edges; the whole closed torus has empty boundary')
 page.locator('#patch-mode').check();page.wait_for_timeout(50)
 c=page.locator('#net-topology');c.scroll_into_view_if_needed();c.focus()
 region=page.evaluate('conicSurface.state.region.slice()')
 c.press('ArrowRight');page.wait_for_timeout(40)
 assert page.evaluate('conicSurface.state.region')==region
 target=page.evaluate('conicSurface.state.face')
 c.press('Space');page.wait_for_timeout(40)
 expected=sorted(set(region)^{target})
 assert sorted(page.evaluate('conicSurface.state.region'))==expected
 c.press('Enter');page.wait_for_timeout(40)
 assert sorted(page.evaluate('conicSurface.state.region'))==sorted(region)
 page.locator('#patch-mode').uncheck()
 checks.append('Keyboard inspection does not modify a patch; Space and Enter toggle the focused face explicitly')

 page.locator('#trace-scale').click();page.wait_for_timeout(110)
 slider(page,'net-gauge',1.3)
 page.wait_for_timeout(900)
 assert page.locator('#transport-trace').inner_text().startswith('Start with scale 1')
 assert page.locator('.transport-values .tracing').count()==0
 checks.append('Geometry edits cancel both a running trace and its stale explanatory text')
 slider(page,'net-amount',1.7);slider(page,'net-twist',.24);before=coords(page)
 page.locator('#animate-net').click();page.wait_for_timeout(60)
 first=coords(page);assert max(abs(a-b)for a,b in zip(before,first))<.004,(before,first)
 page.wait_for_timeout(330);page.locator('#animate-net').click();paused=coords(page)
 page.wait_for_timeout(160);assert coords(page)==paused
 page.locator('#animate-net').click();page.wait_for_timeout(60)
 assert max(abs(a-b)for a,b in zip(paused,coords(page)))<.02
 page.locator('[data-contact="1"]').focus();page.wait_for_timeout(250)
 assert page.evaluate('document.activeElement.dataset.contact')=='1'
 page.locator('#animate-net').click()
 checks.append('Motion starts at the current configuration, pauses/resumes continuously, and preserves keyboard focus')
 page.locator('#patch-four').click();page.locator('#reveal-face').click();page.wait_for_timeout(80)
 snapshot=page.evaluate('conicSurface.snapshot()');q0=page.evaluate('JSON.stringify(conicSurface.getData().Q)')
 page.locator('#bookmark-scene').click()
 fragment=page.evaluate('location.hash');assert fragment.startswith('#scene='),page.locator('#share-status').inner_text()
 load(page,fragment)
 assert page.evaluate('conicSurface.snapshot()')==snapshot
 assert page.evaluate('JSON.stringify(conicSurface.getData().Q)')==q0
 checks.append('Bookmarked equations, selected face, cut-open view, camera and patch restore exactly')
 load(page,'#scene=%7B%22v%22%3A999%7D')
 assert page.evaluate('conicSurface.state.kind')=='torus'
 assert 'Invalid saved view' in page.locator('#share-status').inner_text()
 checks.append('Malformed bookmarks are rejected without breaking the default scene')
 page.emulate_media(reduced_motion='reduce');page.locator('#animate-net').click();page.wait_for_timeout(60)
 assert not page.evaluate('conicSurface.state.animate')
 slider(page,'net-amount',1.4);slider(page,'net-twist',.1)
 page.locator('#surface-example').select_option('odd')
 page.locator('#surface-laboratory').evaluate('e=>e.scrollTop=0');page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(70)
 page.screenshot(path=str(ROOT/'review-surface-desktop.png'))
 for width in [1100,820,390,320]:
  page.set_viewport_size({'width':width,'height':900});page.wait_for_timeout(70)
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),width
 page.set_viewport_size({'width':390,'height':844});page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(70)
 page.screenshot(path=str(ROOT/'review-surface-mobile.png'))
 # Check cancellation across the cut, not only a patch away from the seam.
 page.locator('#patch-controls').evaluate('e=>e.open=true')
 for rows,kind in [(3,'odd'),(4,'torus')]:
  page.locator('#surface-example').select_option(kind);page.wait_for_timeout(60)
  page.evaluate('(rows)=>{conicSurface.state.patch=true;conicSurface.state.region=[0,3,4*(rows-1),4*(rows-1)+3];conicSurface.render();}',rows)
  assert '4 internal edges cancel' in page.locator('#patch-readout').inner_text(), (page.locator('#patch-readout').inner_text(), page.locator('#surface-status').inner_text(), page.evaluate('conicSurface.snapshot()'))
  assert '8 boundary edges' in page.locator('#patch-readout').inner_text()
  assert page.locator('#net-topology').get_attribute('data-view')=='flat'
 for width,height,suffix in [(1440,1100,'desktop'),(390,844,'mobile')]:
  page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(60)
  page.locator('#net-topology').scroll_into_view_if_needed();page.wait_for_timeout(60)
  page.locator('.net-layout').screenshot(path=str(ROOT/f'review-flat-torus-{suffix}.png'))
 checks.append('Periodic seam-crossing patches cancel four internal edges and keep eight boundary edges in both tori')
 checks.append('Reduced-motion behavior and responsive layout down to 320px')
 assert not errors,errors
 assert not failures,failures
 browser.close()
if server:server.shutdown()
r={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failures,'method':'HTTP-loaded actual assets'if args.serve else 'Offline-assembled actual local assets'}
(ROOT/'review-browser-test-results.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2))
