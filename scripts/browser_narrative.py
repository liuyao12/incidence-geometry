"""Validate the continuous narrative and independent cube interaction.

--serve tests the real assets over HTTP (used in CI). Without it, the same
assets are assembled offline in Chromium; no network or server is required.
CHROMIUM can name an installed Chromium executable.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, json, os, re, threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser();p.add_argument('--serve', action='store_true');p.add_argument('--url');args=p.parse_args()
server = None
base = args.url
if args.serve:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/'
errors=[];failed=[];checks=[]

def load(page,name):
    if base:
        page.goto(base.rstrip('/')+'/'+name,wait_until='networkidle')
    else:
        page.goto('about:blank')
        source=(ROOT/name).read_text()
        files=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',source)
        source=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',source)
        source=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(ROOT/m[1]).read_text()+'</style>',source)
        page.set_content(source,wait_until='load')
        for f in files:page.add_script_tag(content=(ROOT/f).read_text())
    page.wait_for_timeout(160)

def move_handle(page,name,dx,dy,shift=False):
    page.locator('#drawing').scroll_into_view_if_needed();page.wait_for_timeout(100)
    loc=page.locator(f'[data-handle="{name}"] circle')
    box=loc.bounding_box();assert box,name
    x=box['x']+box['width']/2;y=box['y']+box['height']/2
    if shift:page.keyboard.down('Shift')
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=6);page.mouse.up()
    if shift:page.keyboard.up('Shift')
    page.wait_for_timeout(200)

with sync_playwright() as pw:
    options={'headless':True}
    if os.environ.get('CHROMIUM'):options['executable_path']=os.environ['CHROMIUM']
    browser=pw.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1100})
    page.set_default_timeout(12000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('requestfailed',lambda r:failed.append(r.url))
    load(page,'index.html')
    assert page.locator('[data-handle]').count()==6
    page.locator('#follow-story').uncheck()
    for t in [0,.5,1,1.5,2,2.5,3]:
        page.evaluate('t=>incidenceStory.setPhase(t)',t);page.wait_for_timeout(130)
        assert not page.locator('#story-readout').evaluate("e=>e.classList.contains('error')"),t
    page.locator('#dual-view').check();page.wait_for_timeout(180)
    assert 'dual' in page.locator('#scene-title').inner_text()
    page.locator('#dual-view').uncheck();page.wait_for_timeout(180)
    assert page.locator('[data-handle^="chord:"]').count()==3
    checks.append('Continuous stages, duality and three Penrose chord handles')

    page.locator('#cube-model').select_option('chords');page.wait_for_timeout(100)
    before=page.evaluate('JSON.stringify(incidenceStory.state.p)')
    shape=page.locator('#story-cube').get_attribute('data-shape')
    # Chord edits change the conics and their coefficient-space cubical directions.
    move_handle(page,'chord:0',8,-2)
    assert before!=page.evaluate('JSON.stringify(incidenceStory.state.p)')
    assert shape!=page.locator('#story-cube').get_attribute('data-shape')
    assert not page.locator('#story-readout').evaluate("e=>e.classList.contains('error')")
    checks.append('Dragging a chord recomputes the conics and cube shape')

    page.locator('.chord-controls summary').click()
    old=page.evaluate('IncidenceCube.chordData(incidenceStory.state.p)[0]')
    page.locator('#chord-angle-0').evaluate("e=>{e.value=+e.value+1;e.dispatchEvent(new Event('input',{bubbles:true}));}")
    page.wait_for_timeout(200)
    new=page.evaluate('IncidenceCube.chordData(incidenceStory.state.p)[0]')
    assert abs(new['angle']-old['angle']-1)<.21
    assert abs(new['distance']-old['distance'])<1e-8
    page.locator('.chord-controls summary').click()
    checks.append('Chord angle control preserves offset and contact construction')

    # Orbit one scene without changing mathematical state or the other camera.
    cube=page.locator('#story-cube');cube.scroll_into_view_if_needed();bb=cube.bounding_box()
    camera=cube.get_attribute('data-camera');geom=page.evaluate('JSON.stringify(incidenceStory.state.p)');diagramCamera=page.evaluate('[incidenceStory.state.yaw,incidenceStory.state.tilt]')
    page.mouse.move(bb['x']+30,bb['y']+30);page.mouse.down();page.mouse.move(bb['x']+72,bb['y']+48,steps=5);page.mouse.up();page.wait_for_timeout(120)
    assert camera!=cube.get_attribute('data-camera')
    assert geom==page.evaluate('JSON.stringify(incidenceStory.state.p)')
    assert diagramCamera==page.evaluate('[incidenceStory.state.yaw,incidenceStory.state.tilt]')
    page.locator('#cube-perspective').uncheck();assert not json.loads(cube.get_attribute('data-camera'))['perspective']
    page.locator('#cube-perspective').check();page.locator('#cube-reset').click()
    cube.focus();page.keyboard.press('ArrowRight');assert json.loads(cube.get_attribute('data-camera'))['yaw']>.65
    checks.append('Independent 3D cube orbit, keyboard camera and perspective toggle')

    # Select through an actual face hit, not merely through the fallback buttons.
    face=page.locator('#story-cube polygon[data-face][tabindex="0"]').first
    face_id=face.get_attribute('data-face')
    pts=face.get_attribute('points');points=[list(map(float,x.split(',')))for x in pts.split()]
    box=cube.bounding_box();cx=sum(x for x,y in points)/4;cy=sum(y for x,y in points)/4
    page.mouse.click(box['x']+cx,box['y']+cy);page.wait_for_timeout(180)
    assert page.evaluate('incidenceStory.state.selection')=='face:'+face_id, (face_id,page.evaluate('incidenceStory.state.selection'),page.evaluate('([x,y])=>document.elementFromPoint(x,y)?.outerHTML',[box['x']+cx,box['y']+cy]))
    for i in range(6):
        page.locator(f'[data-cube-face="{i}"]').click();page.wait_for_timeout(100)
        assert page.evaluate('incidenceStory.state.selection')==f'face:{i}'
        assert 'concurrence residual' in page.locator('#story-readout').text_content()
        assert page.locator(f'[data-cube-face="{i}"]').get_attribute('aria-pressed')=='true'
    page.locator('#cube-linked').uncheck();page.wait_for_timeout(120)
    assert '90.0° / 90.0° / 90.0°' in page.locator('#cube-metrics').inner_text()
    page.locator('#cube-linked').check();page.locator('#cube-clear').click()
    assert page.evaluate('incidenceStory.state.selection')=='all'
    checks.append('Actual face picking, all six linked highlights and regular-cube fallback')
    page.locator('[data-cube-face="0"]').click();page.wait_for_timeout(100)
    page.evaluate("document.getElementById('laboratory').scrollTop=0;window.scrollTo({top:0,behavior:'instant'})")
    page.screenshot(path=str(ROOT/'narrative-cube-preview.png'))

    page.evaluate("incidenceStory.setScene('dandelin')");page.wait_for_timeout(200)
    assert page.evaluate('incidenceStory.getData().error')<1e-8
    page.locator('#section-height').evaluate("e=>{e.value=.2;e.dispatchEvent(new Event('input',{bubbles:true}));}")
    page.wait_for_timeout(160)
    assert page.evaluate('incidenceStory.getData().error')<1e-8
    page.screenshot(path=str(ROOT/'narrative-dandelin-preview.png'))
    page.evaluate("incidenceStory.setScene('extrusion')");page.wait_for_timeout(300)
    assert page.evaluate('incidenceStory.getData().error')<1e-8
    page.locator('[data-cube-face="0"]').click();page.wait_for_timeout(300)
    assert not page.locator('#story-readout').evaluate("e=>e.classList.contains('error')")
    checks.append('Spatial Pascal, moving section and four-quadric face selection')

    page.evaluate('incidenceStory.setPhase(3)');page.wait_for_timeout(150)
    for width,height in [(1100,850),(820,1000),(390,844)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(150)
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),width
        assert page.locator('#story-cube').bounding_box()['width']>140
    page.screenshot(path=str(ROOT/'narrative-mobile-preview.png'))
    checks.append('Responsive page and independently usable cube at mobile/tablet widths')
    page.set_viewport_size({'width':1440,'height':1000})
    load(page,'fomin.html')
    page.locator('#fomin-follow').uncheck();page.locator('#weight-view').check();page.wait_for_timeout(120)
    page.locator('#double-edge').click();page.wait_for_timeout(120)
    text=page.locator('#fomin-readout').inner_text()
    assert '2 face ratios' in text and 'exactly 1' in text
    page.locator('#reset-weights').click();page.wait_for_timeout(120)
    assert 'All six' in page.locator('#fomin-readout').inner_text()
    checks.append('Separate Fomin page and exact reciprocal edge perturbation')
    load(page,'connections.html')
    assert 'Conic-contact surface theorem' in page.locator('body').text_content()
    assert 'does not claim that every partial conic labeling can be completed' in page.locator('body').text_content()
    checks.append('Conic-surface chapter states compatibility without overstating completion or novelty')
    assert not errors,errors
    assert not failed,failed
    browser.close()
if server:server.shutdown()
record={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failed,'method':'HTTP-loaded actual assets' if base else 'Offline-assembled actual local assets','scope':'Software validation, not additional Lean proof evidence.'}
(ROOT/'narrative-browser-test-results.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record,indent=2))
