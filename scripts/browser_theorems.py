"""Theorem statements and LaTeX coexist with the three live geometry chapters.

--serve uses the actual HTTP-loaded files (CI); default assembles the exact local
assets when the browser cannot access a local server. No CDN requests are allowed.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, json, os, re, threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument('--serve', action='store_true')
args = ap.parse_args()
server = None
errors, failed, external, checks = [], [], [], []
counts = {}
if args.serve:
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()

def load(page, name):
    if server:
        page.goto(f'http://127.0.0.1:{server.server_port}/{name}', wait_until='networkidle')
    else:
        page.goto('about:blank')
        html = (ROOT/name).read_text()
        scripts = re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>', html)
        html = re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>', '', html)
        def link(m):
            tag=m.group(0)
            if re.search(r'rel="stylesheet"',tag):
                path=re.search(r'href="([^"]+)"',tag)[1]
                return '<style>'+(ROOT/path).read_text()+'</style>'
            return tag
        html = re.sub(r'<link\b[^>]*>',link,html)
        page.set_content(html)
        for src in scripts:
            page.add_script_tag(content=(ROOT/src).read_text())
    page.wait_for_function('document.documentElement.dataset.mathReady === "true"', timeout=20000)
    page.wait_for_timeout(120)

def no_overflow(page):
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
    # Math must fit the prose column, including when hypotheses/proofs are open.
    over=page.locator('.prose mjx-container[jax="SVG"][display="true"]').evaluate_all(
        '(es)=>es.filter(e=>e.getBoundingClientRect().width>0&&e.scrollWidth>e.clientWidth+2).length')
    assert over==0, str(page.locator('.prose mjx-container[jax="SVG"][display="true"]').evaluate_all('(es)=>es.filter(e=>e.getBoundingClientRect().width>0&&e.scrollWidth>e.clientWidth+2).map(e=>({w:e.clientWidth,s:e.scrollWidth,text:e.textContent,section:e.closest("section").id,viewport:innerWidth}))'))

try:
    with sync_playwright() as pw:
        opts={'headless':True}
        if os.getenv('CHROMIUM'):opts['executable_path']=os.environ['CHROMIUM']
        browser=pw.chromium.launch(**opts)
        page=browser.new_page(viewport={'width':1440,'height':1100})
        page.set_default_timeout(15000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('requestfailed',lambda r:failed.append(r.url))
        page.on('request',lambda r:external.append(r.url) if r.url.startswith('http') and not r.url.startswith('http://127.0.0.1:') else None)
        if server:page.on('response',lambda r:failed.append(f'{r.status}: {r.url}') if r.status>=400 else None)
        for name in ['index.html','fomin.html','connections.html','proofs.html']:
            load(page,name)
            assert page.locator('.prose [data-mml-node="merror"]').count()==0
            counts[name]=page.locator('.prose mjx-container').count()
            assert counts[name]>=10
            assert page.locator('.prose mjx-assistive-mml math').count()==counts[name]
            assert page.locator('.drawing mjx-container, canvas mjx-container').count()==0
            if name!='proofs.html':
                assert page.locator('#main-theorem').count()==1
                assert page.locator('#main-theorem mjx-container').count()>=10
                assert page.locator('.chapter-route a[href="#main-theorem"]').count()==1
                page.locator('.theorem-hypotheses summary').click()
                assert page.locator('.theorem-hypotheses').evaluate('e=>e.open')
                page.locator('#main-theorem').evaluate('e=>e.scrollIntoView({block:"start",behavior:"instant"})')
                page.screenshot(path=str(ROOT/('theorem-'+name.split('.')[0]+'-desktop.png')))
            for size in [(1440,1100),(1000,900),(820,900),(390,844),(360,800)]:
                page.set_viewport_size({'width':size[0],'height':size[1]})
                page.wait_for_timeout(120)
                no_overflow(page)
                if size[0]==390 and name!='proofs.html':
                    page.locator('#main-theorem').evaluate('e=>e.scrollIntoView({block:"start",behavior:"instant"})')
                    page.wait_for_timeout(80)
                    page.screenshot(path=str(ROOT/('theorem-'+name.split('.')[0]+'-mobile.png')))
            page.set_viewport_size({'width':1440,'height':1100})
            # No leftover literal TeX in the prose, ignoring MathJax's own source storage.
            raw=page.locator('.prose').evaluate('''e=>{
              const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT), a=[];let n;
              while(n=w.nextNode())if(!n.parentElement.closest('mjx-container,script,pre,code'))a.push(n.textContent);
              return a.join(' ');
            }''')
            assert '\\(' not in raw and '\\[' not in raw
        checks.append('Three prominent theorem statements; all four exposition pages typeset without errors or leftover TeX')
        checks.append('Display equations and expanded hypotheses fit at 1440, 1000, 820, 390 and 360 pixels')
        checks.append('Every formula has assistive MathML; geometry SVG/canvas are not rewritten by MathJax')

        load(page,'index.html')
        page.locator('#follow-story').uncheck()
        initial=page.evaluate('JSON.stringify(incidenceStory.state.p)')
        for t in [0,.4,1,1.6,2,2.6,3,2,1,0]:
            page.evaluate('t=>incidenceStory.setPhase(t)',t);page.wait_for_timeout(80)
            assert page.evaluate('JSON.stringify(incidenceStory.state.p)')==initial
            assert not page.locator('#story-readout').evaluate('e=>e.classList.contains("error")')
        h=page.locator('[data-handle="seed:0:0"] circle')
        h.scroll_into_view_if_needed();b=h.bounding_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2
        page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+5,y+2,steps=4);page.mouse.up();page.wait_for_timeout(120)
        assert page.evaluate('JSON.stringify(incidenceStory.state.p)')!=initial
        assert page.locator('#main-theorem mjx-container').count()>0
        checks.append('Forward/backward continuous geometry and point dragging still work after typesetting')

        load(page,'fomin.html')
        page.locator('#fomin-follow').uncheck()
        page.locator('#weight-view').check()
        page.locator('#double-edge').click();page.wait_for_timeout(150)
        assert page.locator('.face-ratios .noncoherent').count()==2
        checks.append('Fomin exact edge cancellation controls remain independent of LaTeX rendering')

        load(page,'connections.html')
        page.locator('#net-face-buttons [data-face="3"]').click();page.wait_for_timeout(100)
        assert page.evaluate('conicSurface.state.face')==3
        page.locator('#reveal-face').click();page.wait_for_timeout(100)
        assert page.locator('#holonomy-value').inner_text()=='1'
        page.locator('#surface-example').select_option('odd');page.wait_for_timeout(100)
        assert page.locator('#net-face-buttons button').count()==12
        page.locator('#net-map').click();page.wait_for_timeout(100)
        assert page.locator('#net-map').get_attribute('aria-pressed')=='true'
        checks.append('Conic torus face selection, concurrence, odd-cycle example and cut-open view remain interactive')
        assert not errors,errors
        assert not failed,failed
        assert not external,external
        browser.close()
finally:
    if server:server.shutdown()
report={'status':'passed','checks':checks,'formulas':counts,'javascriptErrors':errors,
        'failedRequests':failed,'externalRequests':external,
        'method':'HTTP-loaded actual assets' if args.serve else 'Local assets assembled in Chromium',
        'scope':'Theorem presentation and math rendering; no mathematical algorithms or Lean statements changed.'}
(ROOT/'theorem-browser-test-results.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
