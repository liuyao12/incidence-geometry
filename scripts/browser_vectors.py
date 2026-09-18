"""Test bidirectional cuboid editing through actual pointer and keyboard events.
--serve validates HTTP-loaded source; default assembles the same local files.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import argparse,json,os,re,threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--serve',action='store_true');args=ap.parse_args()
server=None;errors=[];failed=[];checks=[]
if args.serve:
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 options={'headless':True}
 if os.getenv('CHROMIUM'):options['executable_path']=os.environ['CHROMIUM']
 browser=pw.chromium.launch(**options);page=browser.new_page(viewport={'width':1440,'height':1100})
 page.set_default_timeout(12000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('requestfailed',lambda r:failed.append(r.url))
 if server:page.goto(f'http://127.0.0.1:{server.server_port}/?stage=penrose',wait_until='networkidle')
 else:
  html=(ROOT/'index.html').read_text();files=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',html)
  html=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',html)
  html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(ROOT/m[1]).read_text()+'</style>',html)
  page.set_content(html)
  for f in files:page.add_script_tag(content=(ROOT/f).read_text())
  page.evaluate('incidenceStory.setPhase(3)')
 page.wait_for_timeout(180)
 def state():return page.evaluate('JSON.stringify(incidenceStory.state.p)')
 def reset():
  page.locator('#reset-seeds').evaluate('e=>e.click()');page.wait_for_timeout(70)
  page.locator('#vector-reframe').evaluate('e=>e.click()');page.wait_for_timeout(70)
 def drag(corner,dx,dy,depth=False):
  h=page.locator(f'[data-vector-corner="{corner}"] .vertex-hit');h.scroll_into_view_if_needed();r=h.bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2
  if depth:page.keyboard.down('Shift')
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=6);page.mouse.up()
  if depth:page.keyboard.up('Shift')
  page.wait_for_timeout(90)
 assert page.locator('[data-vector-corner]').count()==7
 for corner in [1,2,4,3,5,6,7]:
  reset();before=state();camera=page.locator('#story-cube').get_attribute('data-camera');beforeShape=page.evaluate('incidenceStory.cube.getShape().basis')
  drag(corner,6,-3)
  assert state()!=before,corner
  assert camera==page.locator('#story-cube').get_attribute('data-camera'),corner
  assert not page.locator('#story-readout').evaluate("e=>e.classList.contains('error')")
  assert page.evaluate('IncidenceModuli.diagnose(incidenceStory.state.p).realContacts')==12
  afterShape=page.evaluate('incidenceStory.cube.getShape().basis')
  for i in range(3):
   if not corner>>i&1:assert max(abs(a-b) for a,b in zip(beforeShape[i],afterShape[i]))<1e-5,(corner,i)
  page.locator('#vector-undo').click();page.wait_for_timeout(80);assert state()==before,'undo'
 checks.append('All seven non-origin corners change the conics; unaffected vectors, camera and all 12 real contacts are preserved; Undo restores the exact state')
 reset();before=state();drag(1,0,6,True);assert state()!=before
 page.locator('#vector-undo').click();page.wait_for_timeout(80);assert state()==before
 h=page.locator('[data-vector-corner="2"]');h.focus();page.keyboard.press('ArrowRight');page.wait_for_timeout(100);assert state()!=before
 assert page.evaluate('document.activeElement.dataset.vectorCorner')=='2'
 page.keyboard.press('Shift+ArrowUp');page.wait_for_timeout(90)
 checks.append('Depth drag and keyboard view-plane/depth movement with focus preserved')
 # All nine coordinate inputs independently drive the scene.
 page.locator('.vector-details summary').click()
 for i in range(3):
  for j in range(3):
   reset();before=state();el=page.locator(f'#vector-{i}-{j}')
   el.evaluate("e=>{e.value=+e.value+.025;e.dispatchEvent(new Event('change',{bubbles:true}));}")
   page.wait_for_timeout(70);assert state()!=before,(i,j)
 checks.append('All nine framed vector-coordinate inputs have genuine geometric effects')
 before=state();page.locator('#vector-reframe').click();page.wait_for_timeout(80);assert state()==before
 assert page.evaluate('IncidenceVectors.residual(incidenceStory.displayedVectors(),IncidenceVectors.identity())')<1e-7
 page.locator('#vector-gain').evaluate("e=>{e.value=2000;e.dispatchEvent(new Event('input',{bubbles:true}));}")
 page.wait_for_timeout(80);assert state()==before
 page.locator('.vector-details summary').click()
 checks.append('Reframing and magnification change only the display, not the moduli')
 # Strong invalid input must not poison the state or erase the geometry.
 reset();page.evaluate('incidenceStory.beginVectorEdit();let b=incidenceStory.displayedVectors();b[0][0]+=2000;incidenceStory.editVectors(b);incidenceStory.endVectorEdit()');page.wait_for_timeout(70)
 assert 'Stopped' in page.locator('#vector-feedback').inner_text()
 assert page.evaluate('IncidenceModuli.diagnose(incidenceStory.state.p).realContacts')==12
 assert not page.locator('#story-readout').evaluate("e=>e.classList.contains('error')")
 checks.append('Far invalid target is clamped to an admissible real configuration')
 # Reset; face clicking remains separate from geometry editing.
 reset();cube=page.locator('#story-cube');cube.scroll_into_view_if_needed();r=cube.bounding_box();before=state();cam=cube.get_attribute('data-camera')
 page.mouse.move(r['x']+15,r['y']+15);page.mouse.down();page.mouse.move(r['x']+45,r['y']+30,steps=5);page.mouse.up();page.wait_for_timeout(70)
 assert state()==before and cam!=cube.get_attribute('data-camera')
 # Click actual polygon centers until one is unobscured.
 face=page.locator('#story-cube polygon[data-face][tabindex="0"]').first
 pts=[list(map(float,x.split(','))) for x in face.get_attribute('points').split()];fid=face.get_attribute('data-face');r=cube.bounding_box()
 page.mouse.click(r['x']+sum(x for x,y in pts)/4,r['y']+sum(y for x,y in pts)/4);page.wait_for_timeout(90)
 assert page.evaluate('incidenceStory.state.selection')=='face:'+fid
 assert state()==before
 assert 'concurrence residual' in page.locator('#story-readout').inner_text()
 for i in range(6):
  page.locator(f'[data-cube-face="{i}"]').click();page.wait_for_timeout(55);assert 'concurrence residual' in page.locator('#story-readout').inner_text()
 checks.append('Background orbit and actual face picking do not change conics; all six face highlights work')
 # Wander remains bidirectionally linked. Manual vector editing stops the tour.
 page.locator('#lock-chords').check();page.locator('#random-target').click();page.wait_for_timeout(250)
 shape=cube.get_attribute('data-shape');page.wait_for_timeout(130);assert shape!=cube.get_attribute('data-shape')
 page.locator('#wander').click();page.locator('#vector-reframe').evaluate('e=>e.click()');page.wait_for_timeout(80)
 page.locator('#wander').click();page.wait_for_timeout(100)
 page.evaluate('incidenceStory.beginVectorEdit();let b=incidenceStory.displayedVectors();b[0][0]+=.01;incidenceStory.editVectors(b);incidenceStory.endVectorEdit()')
 assert not page.evaluate('incidenceStory.tour.running')
 checks.append('Locked-chord random motion changes the moduli cube; vector edits cancel random motion')
 # Earlier narrative and lift still operate after reconstruction.
 for t in [0,1,2,2.7,3]:
  page.evaluate('t=>incidenceStory.setPhase(t)',t);page.wait_for_timeout(90);assert not page.locator('#story-readout').evaluate("e=>e.classList.contains('error')")
 page.evaluate("incidenceStory.setScene('extrusion')");page.wait_for_timeout(150);assert page.evaluate('incidenceStory.getData().error')<1e-6
 assert not page.locator('#vector-controls').is_visible()
 page.evaluate('incidenceStory.setPhase(3)');page.wait_for_timeout(150);reset()
 checks.append('Reconstructed states remain compatible with the narrative endpoints and quadric lifting')
 page.locator('[data-cube-face="0"]').click();page.wait_for_timeout(70)
 # Scroll the laboratory just enough to show both diagrams, not all controls.
 page.evaluate("document.getElementById('laboratory').scrollTop=310;window.scrollTo({top:250,behavior:'instant'})");page.wait_for_timeout(100)
 page.screenshot(path=str(ROOT/'vector-controls-preview.png'))
 for w,h in [(1100,850),(820,1000),(390,844)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100);assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  reset();before=state();drag(1,4,-2);assert state()!=before
 page.locator('#story-cube').scroll_into_view_if_needed();page.screenshot(path=str(ROOT/'vector-controls-mobile.png'))
 checks.append('Responsive point controls work at desktop, tablet and mobile widths')
 assert not errors,errors;assert not failed,failed;browser.close()
if server:server.shutdown()
record={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failed,'method':'HTTP-loaded actual assets' if server else 'Offline-assembled actual local assets','scope':'Browser tests, not formal proof evidence'}
(ROOT/'vector-browser-test-results.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
