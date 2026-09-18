"""Regression for the oversized native SVG focus ring while dragging.

Checks actual raster output as well as focus styles: circle bounding boxes alone
miss the browser-painted outline. Keyboard focus and movement remain supported.
Use --serve for the real HTTP-loaded assets in CI. Without it, load the same
local assets into Chromium without network access. CHROMIUM selects the binary.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse
import base64
import json
import os
import re
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def load(page, name, base):
    if base:
        page.goto(base.rstrip('/') + '/' + name, wait_until='networkidle')
    else:
        page.goto('about:blank')
        source = (ROOT / name).read_text()
        files = re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*></script>', source)
        source = re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>', '', source)
        source = re.sub(r'<link rel="stylesheet" href="([^"]+)">',
                        lambda m: '<style>' + (ROOT / m[1]).read_text() + '</style>', source)
        page.set_content(source, wait_until='load')
        # The legacy lab loads its verification record through fetch.
        if name == 'lab.html':
            page.evaluate('v=>{window.fetch=async()=>new Response(JSON.stringify(v),'
                          '{status:200,headers:{"Content-Type":"application/json"}})}',
                          json.loads((ROOT / 'verification.json').read_text()))
        for file in files:
            page.add_script_tag(content=(ROOT / file).read_text())
    page.wait_for_timeout(100)


def dark_fraction(page, png):
    """Decode Playwright's screenshot in a detached canvas; no image dependency."""
    return page.evaluate('''async encoded => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + encoded;
      await image.decode();
      const c = document.createElement('canvas');
      c.width = image.width; c.height = image.height;
      const ctx = c.getContext('2d'); ctx.drawImage(image, 0, 0);
      const a = ctx.getImageData(0, 0, c.width, c.height).data;
      let dark = 0;
      for (let i = 0; i < a.length; i += 4)
        if (a[i] < 40 && a[i+1] < 40 && a[i+2] < 40 && a[i+3] > 240) dark++;
      return dark / (c.width * c.height);
    }''', base64.b64encode(png).decode('ascii'))


def assert_focus(page, handle):
    actual = page.locator(f'[data-handle="{handle}"]').evaluate('''g => {
      const c = g.querySelector('circle'), s = getComputedStyle(c);
      return {focused: g === document.activeElement,
        outline: getComputedStyle(g).outlineStyle,
        vectorEffect: s.vectorEffect, strokeWidth: s.strokeWidth,
        stroke: s.stroke, diameter: c.getBoundingClientRect().width};
    }''')
    assert actual['focused'], actual
    assert actual['outline'] == 'none', actual
    assert actual['vectorEffect'] == 'non-scaling-stroke', actual
    assert actual['strokeWidth'] == '2px', actual
    assert actual['stroke'] == 'rgb(213, 133, 62)', actual
    assert actual['diameter'] <= 12, actual


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--serve', action='store_true')
    parser.add_argument('--url')
    args = parser.parse_args()
    server = None
    base = args.url
    if args.serve:
        server = ThreadingHTTPServer(('127.0.0.1', 0),
                    partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f'http://127.0.0.1:{server.server_port}/'
    samples, errors, failed = [], [], []
    try:
        with sync_playwright() as pw:
            options = {'headless': True}
            if os.environ.get('CHROMIUM'):
                options['executable_path'] = os.environ['CHROMIUM']
            browser = pw.chromium.launch(**options)
            page = browser.new_page(viewport={'width': 1440, 'height': 1100})
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('requestfailed', lambda r: failed.append(r.url))
            load(page, 'index.html', base)
            page.locator('#follow-story').uncheck()
            # Include both seed-point and chord handles at multiple magnifications.
            for phase in (0, 1, 2, 3):
                for zoom in (.5, 1, 2):
                    page.evaluate('''([t,z])=>{
                      incidenceStory.setPhase(t);
                      incidenceStory.state.zoom=z;
                      incidenceStory.render();
                    }''', [phase, zoom])
                    page.wait_for_timeout(100)
                    canvas = page.locator('#drawing')
                    canvas.scroll_into_view_if_needed()
                    page.evaluate('document.activeElement?.blur()')
                    before = dark_fraction(page, canvas.screenshot())
                    handle = page.locator('#story-geometry [data-handle]').first
                    name = handle.get_attribute('data-handle')
                    handle.focus()
                    assert_focus(page, name)
                    after = dark_fraction(page, canvas.screenshot())
                    assert after < before + .02, (phase, zoom, before, after)
                    # Arrow-key edits rerender the SVG but must restore focus.
                    old = page.evaluate('JSON.stringify(incidenceStory.state.p)')
                    page.keyboard.press('ArrowRight')
                    page.wait_for_timeout(120)
                    assert old != page.evaluate('JSON.stringify(incidenceStory.state.p)')
                    assert_focus(page, name)
                    samples.append({'stage': phase, 'zoom': zoom,
                                    'darkBefore': before, 'darkFocused': after})
            # Actual pointer-down, multi-frame dragging, and release, all 3 chords.
            page.evaluate('''()=>{
              incidenceStory.setPhase(3);incidenceStory.state.zoom=1;
              incidenceStory.render();
            }''')
            page.wait_for_timeout(150)
            for i in range(3):
                name = f'chord:{i}'
                circle = page.locator(f'[data-handle="{name}"] circle')
                circle.scroll_into_view_if_needed()
                box = circle.bounding_box()
                x, y = box['x'] + box['width']/2, box['y'] + box['height']/2
                shape = page.locator('#story-cube').get_attribute('data-shape')
                old = page.evaluate('JSON.stringify(incidenceStory.state.p)')
                page.mouse.move(x, y); page.mouse.down()
                assert_focus(page, name)
                page.mouse.move(x+6, y-3, steps=6)
                page.wait_for_timeout(120)
                assert_focus(page, name)
                png = page.locator('#drawing').screenshot()
                fraction = dark_fraction(page, png)
                assert fraction < .03, (name, fraction)
                if i == 0:
                    (ROOT/'focus-fixed-preview.png').write_bytes(png)
                page.mouse.up()
                assert_focus(page, name)
                assert old != page.evaluate('JSON.stringify(incidenceStory.state.p)')
                assert shape != page.locator('#story-cube').get_attribute('data-shape')
                samples.append({'pointerDrag': name, 'darkDuring': fraction})
            # The shared renderer must also protect the other pages and mobile.
            page.set_viewport_size({'width': 390, 'height': 844})
            page.wait_for_timeout(100)
            page.locator('[data-handle="chord:0"]').focus()
            assert_focus(page, 'chord:0')
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
            for name in ('fomin.html', 'lab.html'):
                page.set_viewport_size({'width': 1440, 'height': 1100})
                load(page, name, base)
                h = page.locator('#ganja-svg [data-handle]').first
                handle = h.get_attribute('data-handle')
                h.focus(); assert_focus(page, handle)
            assert not errors, errors
            assert not failed, failed
            browser.close()
    finally:
        if server:
            server.shutdown()
    record = {'status': 'passed', 'checks': [
        'Raster focus checks at four stages and three zoom levels',
        'Small visible keyboard focus retained across SVG rerenders',
        'All three chord pointer drags preserve geometry/cube linkage',
        'Mobile layout and focus in separate Fomin and legacy pages'],
        'samples': samples, 'javascriptErrors': errors, 'failedRequests': failed,
        'method': 'HTTP-loaded actual assets' if base else 'Offline-assembled actual assets'}
    (ROOT/'focus-test-results.json').write_text(json.dumps(record, indent=2)+'\n')
    print(json.dumps(record, indent=2))


if __name__ == '__main__':
    main()
