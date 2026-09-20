"""Paper-like opening, fixed family controller and reversible transitions.
--serve exercises real HTTP-loaded source in CI; local fallback assembles it.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse, json, os, re, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--serve',action='store_true');args=ap.parse_args()
server=None;errors=[];failed=[];checks=[]
if args.serve:
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 opts={'headless':True}
 if os.environ.get('CHROMIUM'):opts['executable_path']=os.environ['CHROMIUM']
 browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':1100})
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('requestfailed',lambda r:failed.append(r.url))
 if server:page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='networkidle')
 else:
  html=(ROOT/'index.html').read_text();files=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',html)
  html=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',html)
  html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(ROOT/m[1]).read_text()+'</style>',html)
  page.set_content(html)
  for file in files:page.add_script_tag(content=(ROOT/file).read_text())
 page.wait_for_timeout(150);page.locator('#follow-story').uncheck()
 def params():return page.evaluate('JSON.stringify(incidenceStory.state.p)')
 def phase(t):page.evaluate('t=>incidenceStory.setPhase(t)',t);page.wait_for_timeout(80)
 def shape():return page.locator('#story-cube').get_attribute('data-shape')
 initial=params();cube=shape();camera=page.locator('#story-cube').get_attribute('data-camera')
 phase(0);rect=page.locator('#drawing').bounding_box()
 for t in [0,.4,1,1.6,2,2.5,3,2.5,2,1,0]:
  phase(t);assert params()==initial;assert shape()==cube
  assert page.locator('#story-cube').get_attribute('data-camera')==camera
  assert page.locator('[data-vector-corner]').count()==7,t
  assert not page.locator('#story-readout').evaluate('e=>e.classList.contains("error")'),t
  box=page.locator('#drawing').bounding_box();assert abs(box['y']-rect['y'])<1,(t,box['y'],rect['y'])
  if t in [0,1,2,3]:page.locator('#drawing').screenshot(path=str(ROOT/f'paper-stage-{int(t)}.png'))
 checks.append('One opening family; same cube, parameters, camera and drawing position throughout a forward/backward sweep')
 # All six seeds remain editable on both degenerate carriers and the ellipse.
 for t in [0,1]:
  for i in range(3):
   for j in range(2):
    phase(t);before=params();h=page.locator(f'[data-handle="seed:{i}:{j}"] circle');h.scroll_into_view_if_needed();r=h.bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+4,y+2,steps=3);page.mouse.up();page.wait_for_timeout(70)
    assert params()!=before,(t,i,j)
    edited=params();newshape=shape();phase(3);assert params()==edited;assert shape()==newshape;phase(t);assert params()==edited
    page.locator('#reset-seeds').evaluate('e=>e.click()');page.wait_for_timeout(80)
 checks.append('All six point handles use the inverse display chart; edits survive travel to Penrose and back')
 # The same bidirectional cube works at Pappus and Pascal, not just Penrose.
 for t in [0,1]:
  phase(t);before=params();h=page.locator('[data-vector-corner="1"] .vertex-hit');h.scroll_into_view_if_needed();r=h.bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+5,y-3,steps=4);page.mouse.up();page.wait_for_timeout(90)
  assert params()!=before,t
  edited=params();newshape=shape()
  for end in [2,3,1,0,t]:phase(end);assert params()==edited;assert shape()==newshape
  page.locator('#vector-undo').click();page.wait_for_timeout(90);assert params()==before
 checks.append('Cube edits at Pappus/Pascal select a new whole family; all stages retain it and Undo restores it')
 # Continuous playback reverses without resetting geometry or jumping phases.
 phase(2.99);page.evaluate('incidenceStory.state.direction=1');before=params()
 page.locator('#play-journey').click();page.wait_for_timeout(400)
 assert page.evaluate('incidenceStory.state.playing && incidenceStory.state.direction===-1 && incidenceStory.state.phase>2.9')
 page.locator('#play-journey').click();assert params()==before
 phase(.01);page.evaluate('incidenceStory.state.direction=-1');page.locator('#play-journey').click();page.wait_for_timeout(400)
 assert page.evaluate('incidenceStory.state.playing && incidenceStory.state.direction===1 && incidenceStory.state.phase<.1')
 page.locator('#play-journey').click();assert params()==before
 checks.append('Play reverses smoothly at both ends without resetting to a default or jumping back to Pappus')
 phase(1);page.locator('#dual-view').check();page.wait_for_timeout(100);assert not page.locator('#story-readout').evaluate('e=>e.classList.contains("error")');page.locator('#dual-view').uncheck()
 page.evaluate("incidenceStory.setScene('dandelin');incidenceStory.state.lift=0;incidenceStory.render()")
 assert page.evaluate('incidenceStory.getData().error')<1e-8
 page.evaluate('incidenceStory.state.lift=.85;incidenceStory.render()');assert page.evaluate('incidenceStory.getData().error')<1e-8
 checks.append('Dual view and the flat/spatial Pascal construction retain their incidence checks')
 phase(0);page.evaluate("document.getElementById('laboratory').scrollTop=0;window.scrollTo({top:0,behavior:'instant'})");page.wait_for_timeout(100);page.screenshot(path=str(ROOT/'paper-journey-desktop.png'))
 for w,h in [(1100,850),(820,1000),(390,844)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100);assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 page.locator('#drawing').scroll_into_view_if_needed();page.screenshot(path=str(ROOT/'paper-journey-mobile.png'))
 checks.append('Responsive opening with no horizontal overflow on desktop, tablet and mobile')
 assert not errors,errors;assert not failed,failed;browser.close()
if server:server.shutdown()
result={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failed,'method':'HTTP-loaded actual assets' if server else 'Offline-assembled actual assets','scope':'Presentation/interaction tests, not new Lean proofs.'}
(ROOT/'journey-view-browser-test-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
