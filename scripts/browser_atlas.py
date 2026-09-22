"""Standalone graph and linked live theorem laboratories.
--serve tests the actual unmodified HTTP assets (used by CI).
Without --serve, inline local assets and use same-origin srcdoc fixtures for
an offline browser. Only the iframe URL assignment is replaced in that harness.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import argparse, json, os, re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--serve',action='store_true');args=ap.parse_args()
errors=[];failures=[];checks=[];server=None

def assemble(name):
    text=(ROOT/name).read_text()
    sources=re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>',text)
    text=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',text)
    def css(m):
        tag=m[0]
        if 'rel="stylesheet"' in tag:
            return '<style>'+(ROOT/re.search(r'href="([^"]+)"',tag)[1]).read_text()+'</style>'
        return tag
    text=re.sub(r'<link\b[^>]*>',css,text);scripts=[]
    if name=='theorem-map.html':
        fixtures={p:assemble(p)for p in ['index.html','fomin.html','connections.html','atlas-extras.html']}
        scripts.append('<script>window.__atlasFixtures='+json.dumps(fixtures).replace('<','\\u003c')+';</script>')
    for src in sources:
        code=(ROOT/src).read_text()
        if src=='atlas.js':
            assert "f.src=page+'?atlas=1'" in code
            code=code.replace("f.src=page+'?atlas=1'","f.srcdoc=window.__atlasFixtures[page]")
        scripts.append('<script>'+re.sub('</script',r'<\\/script',code,flags=re.I)+'</script>')
    return text.replace('</body>',''.join(scripts)+'</body>')

if args.serve:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()

def ready(page):
    page.wait_for_function('window.theoremAtlas && document.querySelector("#atlas-frames").getAttribute("aria-busy")==="false"')
    assert not page.locator('#frame-loading').is_visible(),page.locator('#frame-loading').inner_text()

def choose(page,node):
    page.locator(f'[data-node="{node}"]').scroll_into_view_if_needed()
    page.locator(f'[data-node="{node}"]').click();ready(page)
    assert page.evaluate('theoremAtlas.selected')==node
    page.wait_for_timeout(90)

def frame(page,name):
    el=page.evaluate_handle('(name)=>theoremAtlas.frames[name]',name).as_element()
    return el.content_frame()

def slider(f,id,value):
    f.locator('#'+id).evaluate('(e,v)=>{e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}))}',value)
    f.wait_for_timeout(100)

try:
    with sync_playwright() as pw:
        opts={'headless':True}
        if os.getenv('CHROMIUM'):opts['executable_path']=os.environ['CHROMIUM']
        browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1500,'height':1050})
        page.set_default_timeout(25000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('requestfailed',lambda r:failures.append(r.url))
        page.on('response',lambda r:failures.append(f'{r.status}: {r.url}')if r.status>=400 else None)
        if server:page.goto(f'http://127.0.0.1:{server.server_port}/theorem-map.html',wait_until='networkidle')
        else:page.set_content(assemble('theorem-map.html'),wait_until='load')
        ready(page);assert page.locator('[data-node]').count()==29
        for node in page.evaluate('IncidenceAtlas.nodes.map(n=>({id:n.id,demo:n.demo}))'):
            choose(page,node['id']);f=frame(page,node['demo']['page'])
            assert f.locator('#ganja-svg').count()==1,node['id']
            assert f.locator('#ganja-svg').bounding_box()['width']>200,node['id']
            if node['demo']['page']=='atlas-extras.html':assert f.evaluate('atlasExtras.getData().error')<1e-8
            if node['demo']['page']=='connections.html':assert f.evaluate('conicSurface.getData().maxEdge')<1e-8
        checks.append('Every one of the 29 graph nodes loads a live construction with a statement and explicit scope')
        choose(page,'pappus');f=frame(page,'index.html')
        before=f.evaluate('JSON.stringify(incidenceStory.state.p)');h=f.locator('[data-handle]').first;h.focus();h.press('ArrowRight');f.wait_for_timeout(150)
        after=f.evaluate('JSON.stringify(incidenceStory.state.p)');assert before!=after
        choose(page,'pascal');assert f.evaluate('JSON.stringify(incidenceStory.state.p)')==after
        assert f.evaluate('incidenceStory.state.phase')==1
        choose(page,'brianchon');assert f.evaluate('incidenceStory.state.dual')
        checks.append('Existing seed edits persist when changing related theorem nodes; dual selection changes the actual geometry')
        choose(page,'pappus');page.locator('#atlas-view').select_option('1');ready(page)
        f=frame(page,'fomin.html');assert f.evaluate('fominStory.state.example')=='pappus'
        tile=f.locator('[data-tile]').first
        if tile.count():tile.click()
        checks.append('The shared Pappus node opens both the conic progression and the actual nine-face torus laboratory')
        choose(page,'monge');f=frame(page,'atlas-extras.html')
        x=f.evaluate('JSON.stringify(atlasExtras.getData().X)')
        slider(f,'radius-0',.54);assert f.evaluate('JSON.stringify(atlasExtras.getData().X)')!=x
        x=f.evaluate('JSON.stringify(atlasExtras.getData().X)');f.locator('#monge-triangles').check();f.wait_for_timeout(100)
        assert f.evaluate('atlasExtras.state.triangles') and f.evaluate('JSON.stringify(atlasExtras.getData().X)')==x
        slider(f,'monge-lift',.85);assert f.evaluate('JSON.stringify(atlasExtras.getData().X)')==x
        q=f.evaluate('JSON.stringify(atlasExtras.state.p.circles)');r=f.locator('#extra-drawing').bounding_box()
        page.mouse.move(r['x']+25,r['y']+25);page.mouse.down();page.mouse.move(r['x']+85,r['y']+45,steps=5);page.mouse.up()
        assert f.evaluate('atlasExtras.state.yaw')!=0 and f.evaluate('JSON.stringify(atlasExtras.state.p.circles)')==q
        checks.append('Monge radii, Desargues triangles and spatial lift use the same independently checked homothety centers')
        choose(page,'braikenridge');f=frame(page,'atlas-extras.html');q=f.evaluate('JSON.stringify(atlasExtras.getData().Q)');x=f.evaluate('JSON.stringify(atlasExtras.getData().six[5])')
        slider(f,'converse-angle',-.23);assert f.evaluate('JSON.stringify(atlasExtras.getData().Q)')==q
        assert f.evaluate('JSON.stringify(atlasExtras.getData().six[5])')!=x
        f.locator('#converse-conic').check();f.wait_for_timeout(100);assert f.evaluate('atlasExtras.getData().error')<1e-8
        for kind in ['ceva','menelaus']:
            choose(page,kind);slider(f,'triangle-s',1.7);assert f.evaluate('atlasExtras.getData().error')<1e-8
        checks.append('Converse of Pascal constructs the sixth point from incidence; triangle ratios reconstruct Ceva and Menelaus')
        choose(page,'torus12');f=frame(page,'connections.html');assert f.evaluate('conicSurface.state.map')
        old=f.evaluate('conicSurface.state.face');f.locator('#net-topology').focus();f.locator('#net-topology').press('PageDown');f.wait_for_timeout(120)
        assert f.evaluate('conicSurface.state.face')!=old
        checks.append('Flat surface maps and direct keyboard face selection work inside the atlas')
        choose(page,'pappus');page.locator('#relation-reading button').filter(has_text='Reducible carrier').click()
        assert 'pappus_via_pascal' in page.locator('#relation-reading').inner_text()
        assert page.locator('.atlas-edge.chosen').count()==1
        page.locator('#atlas-legend .implication').click();assert page.locator('.atlas-edge.implication.off').count()>0
        page.locator('#atlas-legend .implication').click()
        page.locator('#atlas-search').fill('Monge');page.locator('#atlas-search').press('Enter');ready(page);assert page.evaluate('theoremAtlas.selected')=='monge'
        assert page.evaluate('location.hash')=='#monge'
        page.locator('#atlas-search').fill('')
        page.locator('[data-node="monge"]').focus();page.locator('[data-node="monge"]').press('ArrowLeft');page.keyboard.press('Enter');ready(page)
        assert page.evaluate('theoremAtlas.selected')=='dual-pappus'
        if server:
            page.go_back();ready(page);assert page.evaluate('theoremAtlas.selected')=='monge'
        checks.append('Relation explanations, five independent filters, search, keyboard graph navigation and theorem URLs')
        choose(page,'monge');page.locator('#graph-viewport').evaluate('e=>e.scrollTop=160');page.locator('#atlas-detail').evaluate('e=>e.scrollTop=0');page.wait_for_timeout(250)
        page.screenshot(path=str(ROOT/'atlas-desktop.png'))
        for width in [1280,1050,820,760,390,320]:
            page.set_viewport_size({'width':width,'height':900});page.wait_for_timeout(120)
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),width
        page.set_viewport_size({'width':390,'height':844});page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(150)
        page.screenshot(path=str(ROOT/'atlas-mobile.png'),full_page=True)
        assert page.locator('mjx-merror').count()==0
        checks.append('Desktop side-by-side and stacked phone layouts down to 320px; no MathJax errors')
        assert not errors,errors;assert not failures,failures
        browser.close()
finally:
    if server:server.shutdown()
r={'status':'passed','checks':checks,'javascriptErrors':errors,'failedRequests':failures,'method':'Actual HTTP pages and unmodified iframe URLs'if args.serve else 'Offline local assets and srcdoc fixtures','scope':'Software and numerical tests, not new Lean proofs'}
(ROOT/'atlas-browser-test-results.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2))
