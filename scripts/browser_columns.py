"""Dedicated chapter columns, tested on actual HTTP-loaded geometry.

--serve starts a local server. --url can check the same release after deployment.
CHROMIUM selects an installed Chromium binary when supplied.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import os
import re
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument('--serve', action='store_true')
ap.add_argument('--url')
args = ap.parse_args()
server = None
if args.serve:
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
else:
    base = args.url.rstrip('/') + '/' if args.url else None
errors, failures, checks = [], [], []


def load(page, name):
    if base:
        page.goto(base + name, wait_until='networkidle')
    else:
        page.goto('about:blank')
        html = (ROOT/name).read_text()
        scripts = re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>', html)
        html = re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>', '', html)
        def inline_css(m):
            tag = m.group(0)
            if 'rel="stylesheet"' in tag:
                href = re.search(r'href="([^"]+)"', tag)[1]
                return '<style>' + (ROOT/href).read_text() + '</style>'
            return tag
        html = re.sub(r'<link\b[^>]*>', inline_css, html)
        page.set_content(html)
        for src in scripts:
            page.add_script_tag(content=(ROOT/src).read_text())
    page.wait_for_function('document.documentElement.dataset.mathReady === "true"')
    page.wait_for_timeout(130)


def bounds(page):
    return page.evaluate('''() => {
      const rect = s => {const r = document.querySelector(s).getBoundingClientRect();
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      const lab = document.querySelector('.interactive-column > .laboratory');
      return {nav:rect('.site-nav'),text:rect('#chapter-text'),col:rect('#interactive'),
        lab:rect('.interactive-column > .laboratory'),resize:getComputedStyle(lab).resize,
        transform:getComputedStyle(lab).transform,position:getComputedStyle(lab).position,
        overflow:document.documentElement.scrollWidth > innerWidth + 1};
    }''')


def desktop(page):
    b = bounds(page)
    assert not b['overflow'], b
    assert b['text']['right'] <= b['col']['x'] + 1, b
    assert b['lab']['x'] >= b['col']['x'], b
    assert b['lab']['right'] <= b['col']['right'] + 1, b
    assert abs(b['lab']['y'] - b['nav']['bottom']) <= 1, b
    assert b['lab']['bottom'] <= page.viewport_size['height'] + 1, b
    assert b['resize'] == 'none' and b['transform'] == 'none', b
    assert b['position'] == 'sticky', b
    return b


try:
    with sync_playwright() as pw:
        options = {'headless': True}
        if os.getenv('CHROMIUM'):
            options['executable_path'] = os.environ['CHROMIUM']
        browser = pw.chromium.launch(**options)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.set_default_timeout(20000)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('requestfailed', lambda r: failures.append(r.url))
        page.on('response', lambda r: failures.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
        for name in ['index.html', 'fomin.html', 'connections.html']:
            page.set_viewport_size({'width': 1440, 'height': 1000})
            load(page, name)
            before = desktop(page)
            assert page.locator('#panel-grip, #reset-position, .float-column').count() == 0
            # Header dragging cannot move or resize either column.
            r = page.locator('.laboratory .lab-title').bounding_box()
            page.mouse.move(r['x'] + 30, r['y'] + 30)
            page.mouse.down()
            page.mouse.move(r['x'] - 150, r['y'] + 100, steps=5)
            page.mouse.up()
            page.evaluate('window.getSelection().removeAllRanges()')
            after = desktop(page)
            assert after['lab'] == before['lab'], (name, before, after)
            page.evaluate('window.scrollTo({top:1300,behavior:"instant"})')
            page.wait_for_timeout(150)
            desktop(page)
            assert page.evaluate('scrollY') > 1000
            # Lower controls scroll inside the rail, without moving the prose.
            old_y = page.evaluate('scrollY')
            page.locator('.interactive-column > .laboratory').evaluate('e=>e.scrollTop=e.scrollHeight')
            page.wait_for_timeout(80)
            assert page.evaluate('scrollY') == old_y
            desktop(page)
            page.locator('.interactive-column > .laboratory').evaluate('e=>e.scrollTop=0')
            page.evaluate('window.scrollTo(0,0)')
            page.wait_for_timeout(100)
            page.screenshot(path=str(ROOT / f'columns-{name.split(".")[0]}-desktop.png'))
            # Expanded hypotheses keep LaTeX in the reading column.
            page.locator('.theorem-hypotheses').evaluate('e=>e.open=true')
            for w, h in [(1200, 800), (1000, 900), (960, 800), (1440, 1000)]:
                page.set_viewport_size({'width': w, 'height': h})
                page.wait_for_timeout(90)
                desktop(page)
                assert page.locator('.prose [data-mml-node="merror"]').count() == 0
                over = page.locator('.prose mjx-container[display="true"]').evaluate_all(
                    'es=>es.filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+2).map(e=>e.textContent)')
                assert not over, (name, w, over)
            # Narrow layouts are in normal flow, not fixed over text.
            for w in [959, 820, 390, 360, 320]:
                page.set_viewport_size({'width': w, 'height': 844})
                page.wait_for_timeout(90)
                b = bounds(page)
                assert not b['overflow'], (name, w, b)
                assert b['position'] == 'static', (name, w, b)
                assert b['text']['y'] >= b['col']['bottom'] - 1, (name, w, b)
                assert b['lab']['height'] >= 500, (name, w, b)
            page.set_viewport_size({'width': 390, 'height': 844})
            page.evaluate('window.scrollTo(0,0)')
            page.wait_for_timeout(90)
            page.locator('.lab-title .column-jump').click()
            page.wait_for_timeout(120)
            assert abs(page.locator('#chapter-text').bounding_box()['y'] - 18) < 2
            assert page.locator('.interactive-column').evaluate('e=>e.getBoundingClientRect().bottom') <= 20
            page.screenshot(path=str(ROOT / f'columns-{name.split(".")[0]}-mobile.png'))
            page.locator('.hero .column-jump').click()
            page.wait_for_timeout(120)
            assert abs(page.locator('#interactive').bounding_box()['y'] - 18) < 2
        checks.append('All three chapters: separate in-flow columns, pinned rail, no window drag/resize, and no text overlap')
        checks.append('Long controls scroll independently; wrapped navigation and all equations fit 960–1440px desktop widths')
        checks.append('320–959px layouts stack in normal flow; chapter/interactive jump links work without overlays')

        page.set_viewport_size({'width': 1440, 'height': 1000})
        load(page, 'index.html')
        original = page.evaluate('JSON.stringify(incidenceStory.state.p)')
        phases = []
        for section in ['pappus', 'pascal', 'salmon', 'penrose', 'salmon', 'pascal', 'pappus']:
            page.evaluate('id=>{const e=document.getElementById(id);window.scrollTo({top:e.getBoundingClientRect().top+scrollY-innerHeight*.4+2,behavior:"instant"})}', section)
            page.wait_for_timeout(150)
            desktop(page)
            phases.append(page.evaluate('incidenceStory.state.phase'))
            assert page.evaluate('JSON.stringify(incidenceStory.state.p)') == original
            assert not page.locator('#story-readout').evaluate('e=>e.classList.contains("error")')
        assert abs(phases[0]) < .02 and abs(phases[3] - 3) < .02 and abs(phases[-1]) < .02, phases
        checks.append('Actual forward/backward page scrolling drives the continuous journey while the interactive stays in its column')
        # True point edits still map from screen coordinates correctly.
        page.evaluate('incidenceStory.setPhase(1)')
        page.wait_for_timeout(90)
        p = page.locator('[data-handle="seed:0:0"] circle')
        p.scroll_into_view_if_needed()
        r = p.bounding_box()
        x, y = r['x'] + r['width']/2, r['y'] + r['height']/2
        page.mouse.move(x, y); page.mouse.down(); page.mouse.move(x+5, y-2, steps=4); page.mouse.up()
        page.wait_for_timeout(90)
        assert page.evaluate('JSON.stringify(incidenceStory.state.p)') != original
        checks.append('Point dragging changes geometry, not the page columns; existing suites cover cube/torus edits and cameras')
        assert not errors, errors
        assert not failures, failures
        browser.close()
finally:
    if server:
        server.shutdown()
result = {'status': 'passed', 'checks': checks, 'javascriptErrors': errors, 'failedRequests': failures,
          'method': 'HTTP-loaded actual assets' if base else 'Offline-assembled actual assets', 'scope': 'Page layout and interaction, not new mathematical proofs.'}
(ROOT/'columns-browser-test-results.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result, indent=2))
