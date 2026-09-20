"""The paper's labeled proof maps, their actual geometries and scroll linkage.

--serve exercises HTTP-loaded assets in CI. Otherwise local files are assembled
in Chromium without network access. CHROMIUM may name an installed executable.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, json, os, re, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--serve',action='store_true');args=ap.parse_args()
server=None
if args.serve:
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
errors,failed,checks=[],[],[]
def load(page):
 if server:page.goto(f'http://127.0.0.1:{server.server_port}/fomin.html',wait_until='networkidle')
 else:
  page.goto('about:blank');html=(ROOT/'fomin.html').read_text();scripts=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',html)
  html=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',html)
  def css(m):
   t=m.group(0)
   return '<style>'+(ROOT/re.search(r'href="([^"]+)"',t)[1]).read_text()+'</style>' if 'stylesheet' in t else t
  page.set_content(re.sub(r'<link\b[^>]*>',css,html))
  for src in scripts:page.add_script_tag(content=(ROOT/src).read_text())
 page.wait_for_function('document.documentElement.dataset.mathReady === "true"')
 page.wait_for_timeout(100)
def valid(page):
 assert not page.locator('#fomin-readout').evaluate('e=>e.classList.contains("error")'),page.locator('#fomin-readout').inner_text()
 assert page.evaluate('fominStory.getData().error < 1e-8')
 assert page.locator('[data-mml-node="merror"]').count()==0
try:
 with sync_playwright() as pw:
  opts={'headless':True}
  if os.getenv('CHROMIUM'):opts['executable_path']=os.environ['CHROMIUM']
  browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':1100});page.set_default_timeout(20000)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('requestfailed',lambda r:failed.append(r.url))
  if server:page.on('response',lambda r:failed.append(f'{r.status}: {r.url}') if r.status>=400 else None)
  load(page)
  order=page.locator('.prose>section').evaluate_all('(es)=>es.map(e=>e.id)')
  assert order[:6]==['main-theorem','fomin-start','desargues','pappus','quadrangle','generalization'],order
  page.locator('#fomin-follow').uncheck()
  for name,count in [('desargues',6),('pappus',9),('quadrangle',9),('generalization',9)]:
   page.locator('#fomin-example').select_option(name);page.wait_for_timeout(150);valid(page)
   assert page.locator('#face-ratios button').count()==count
   for i in range(count):
    page.locator(f'#face-ratios button[data-face="{i}"]').click();page.wait_for_timeout(55)
    assert page.evaluate('fominStory.state.face')==i
    assert page.locator('#fomin-tiling .selected').count()==(2 if name=='pappus' and i>=6 else 1)
    assert page.locator('#tile-reason').inner_text()
    valid(page)
   page.wait_for_function('document.querySelector("#tile-formula mjx-container") !== null')
   page.locator('#last-tile').click();page.locator('#fomin-complete').uncheck();page.wait_for_timeout(100)
   assert page.locator('#face-ratios button.last strong').inner_text()=='?'
   page.locator('#fomin-complete').check();page.wait_for_timeout(100)
   page.locator('#fomin-dual').check();page.wait_for_timeout(150);valid(page)
   page.locator('#fomin-dual').uncheck();page.wait_for_timeout(120)
   # Real pointer input, not synthetic point updates.
   h=page.locator('#fomin-geometry [data-handle]').first;h.scroll_into_view_if_needed()
   initial=page.evaluate('JSON.stringify(fominStory.state.params)');b=h.locator('circle').bounding_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+5,y+2,steps=4);page.mouse.up();page.wait_for_timeout(120)
   assert page.evaluate('JSON.stringify(fominStory.state.params)')!=initial
   valid(page)
   h=page.locator('#fomin-geometry [data-handle]').first;key=h.get_attribute('data-handle');h.focus();page.keyboard.press('ArrowRight');page.wait_for_timeout(120)
   assert page.evaluate('document.activeElement.dataset.handle')==key
   valid(page)
  checks.append('All 24 paper tiles select their matching incidence; all four scenes, duality, hide/reveal, pointer drags and keyboard edits work')
  # The outer tile is truly pickable, not just a selector entry.
  page.locator('#fomin-example').select_option('desargues');page.wait_for_timeout(100)
  map=page.locator('#fomin-tiling');map.scroll_into_view_if_needed()
  # Choose an explicit point in the filled exterior using the SVG transform.
  p=map.evaluate('e=>{let p=e.createSVGPoint();p.x=410;p.y=145;let q=p.matrixTransform(e.getScreenCTM());return{x:q.x,y:q.y}}')
  page.mouse.click(p['x'],p['y']);page.wait_for_timeout(100)
  assert page.evaluate('fominStory.state.face')==3
  page.locator('#fomin-example').select_option('pappus');page.wait_for_timeout(100)
  map.scroll_into_view_if_needed()
  # Select each separately drawn half of the final torus tile.
  for x in [120,320]:
   p=map.evaluate('(e,x)=>{let p=e.createSVGPoint();p.x=x;p.y=146;let q=p.matrixTransform(e.getScreenCTM());return{x:q.x,y:q.y}}',x)
   page.mouse.click(p['x'],p['y']);page.wait_for_timeout(100)
   assert page.evaluate('fominStory.state.face')==8
   assert page.locator('#fomin-tiling .selected').count()==2
  checks.append('Actual SVG picking includes the spherical outside face and both halves of the concluding Pappus tile')
  page.locator('#fomin-example').select_option('quadrangle');page.wait_for_timeout(100)
  topology=page.evaluate('JSON.stringify(fominStory.getData().model.faces)')
  for t in [0,.1,.25,.5,.8,1,.5,0]:
   page.locator('#quad-release').evaluate('(e,t)=>{e.value=t;e.dispatchEvent(new Event("input",{bubbles:true}))}',t);page.wait_for_timeout(70);valid(page)
   assert page.evaluate('JSON.stringify(fominStory.getData().model.faces)')==topology
   triple=page.evaluate('(()=>{let P=fominStory.getData().points;return Math.abs(IncidenceMath.dot(FominClassics.cross(P.P14,P.P24),FominClassics.unit(P.P34)))})()')
   assert triple<1e-9 if t==0 else triple>1e-7
  checks.append('Continuous common-line release and return preserve the same nine-tile proof while genuinely removing total collinearity')
  # Scrolling and anchor navigation drive scenes in paper order.
  page.evaluate('scrollTo(0,0)');page.locator('#fomin-follow').check()
  for section,example in [('main-theorem','desargues'),('pappus','pappus'),('quadrangle','quadrangle'),('generalization','quadrangle'),('desargues','desargues')]:
   page.evaluate('id=>scrollTo({top:document.getElementById(id).getBoundingClientRect().top+scrollY-innerHeight*.35,behavior:"instant"})',section)
   page.wait_for_timeout(140);assert page.evaluate('fominStory.state.example')==example;valid(page)
  checks.append('Main theorem first, then actual scroll-driven Desargues, Pappus, quadrangle and its generalization, forwards and backwards')
  page.locator('#fomin-follow').uncheck();page.locator('#weight-view').check();page.locator('#double-edge').click();page.wait_for_timeout(100)
  assert page.locator('#face-ratios .noncoherent').count()==2
  assert 'exactly 1' in page.locator('#fomin-readout').inner_text()
  page.locator('#weight-view').uncheck();page.wait_for_timeout(100);valid(page)
  checks.append('Existing exact BigInt cancellation remains distinct from and compatible with geometric examples')
  # Every equation must fit, including expanded hypotheses.
  page.evaluate('document.querySelectorAll(".prose details").forEach(e=>e.open=true)')
  for w in [1440,1000,960,820,390,360,320]:
   page.set_viewport_size({'width':w,'height':950});page.wait_for_timeout(120)
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   over=page.locator('.prose mjx-container[display="true"]').evaluate_all('(es)=>es.filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent,w:e.clientWidth,s:e.scrollWidth}))')
   assert not over,(w,over)
   for example in ['desargues','pappus','generalization']:
    page.locator('#fomin-example').select_option(example);page.wait_for_timeout(60);valid(page)
  checks.append('Theorems, maps and input controls fit desktop, tablet and mobile down to 320px, including expanded LaTeX proofs')
  for w in [1440,390]:
   page.set_viewport_size({'width':w,'height':1100 if w==1440 else 844});page.locator('#fomin-example').select_option('pappus');page.wait_for_timeout(100)
   page.evaluate('scrollTo({top:document.getElementById("pappus").getBoundingClientRect().top+scrollY-95,behavior:"instant"});document.getElementById("fomin-lab").scrollTop=0')
   page.screenshot(path=str(ROOT/f'fomin-applications-{w}.png'))
  assert not errors,errors;assert not failed,failed;browser.close()
finally:
 if server:server.shutdown()
report={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failed,'method':'HTTP-loaded actual assets' if args.serve else 'Locally assembled actual assets','scope':'Presentation and software tests, not new Lean proofs.'}
(ROOT/'fomin-classics-browser-test-results.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
