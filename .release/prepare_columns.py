"""One-time, deterministic migration from floating cards to in-flow columns.
Run on the fef248be source. No mathematical statement or engine is altered.
"""
from pathlib import Path
import hashlib, json, re
R = Path(__file__).resolve().parents[1]

def replace_one(text, before, after):
    assert text.count(before) == 1, (before, text.count(before))
    return text.replace(before, after, 1)

paths = ['index.html', 'fomin.html', 'connections.html', 'story.js']
for name in paths:
    source = (R/name).read_bytes()
    manifest = json.loads((R/'verification/release-source-hashes.json').read_text())
    assert hashlib.sha256(source).hexdigest() == manifest['files'][name], name
for name in paths[:3]:
    p = R/name
    s = p.read_text()
    s = replace_one(s, '<body>', '<body class="chapter-page">')
    s = replace_one(s, '<link rel="stylesheet" href="math.css">',
        '<link rel="stylesheet" href="math.css"><link rel="stylesheet" href="columns.css"><script defer src="columns.js"></script>')
    s = replace_one(s, '<article class="prose">', '<article class="prose" id="chapter-text">')
    s = replace_one(s, '<aside class="float-column">',
        '<aside class="interactive-column" id="interactive" aria-label="Interactive geometry">')
    # The header is no longer a draggable window title bar.
    s = s.replace(' id="panel-grip"', '')
    if name == 'index.html':
        s = replace_one(s, '<button aria-label="Reset panel position and size" id="reset-position" title="Reset panel position and size">↺</button>', '')
    i = s.index('<header class="lab-title">')
    end = s.index('</header>', i)
    s = s[:end] + '<a class="column-jump" href="#chapter-text">Read the chapter ↓</a>' + s[end:]
    i = s.index('<header class="hero">')
    end = s.index('</header>', i)
    s = s[:end] + '<a class="column-jump" href="#interactive">Back to the interactive ↑</a>' + s[end:]
    p.write_text(s)
p = R/'story.js'
s = p.read_text()
start = s.index('let panel=null;')
end = s.index('let scrollFrame=0;', start)
assert 'reset-position' in s[start:end]
s = s[:start] + '// The interactive is an in-flow page column; only its geometry can be dragged.\n' + s[end:]
p.write_text(s)
# Only refresh fingerprints for this explicit edit set, preserving every other
# recorded source hash. Extra files below must already have been checked locally.
paths += ['columns.css', 'columns.js', 'scripts/browser_columns.py', 'COLUMN_LAYOUT.md']
p = R/'verification/release-source-hashes.json'
m = json.loads(p.read_text())
for name in paths:
    m['files'][name] = hashlib.sha256((R/name).read_bytes()).hexdigest()
m['files'] = dict(sorted(m['files'].items()))
p.write_text(json.dumps(m, indent=2) + '\n')
paths += ['verification/release-source-hashes.json']
(R/'.release/column-paths.json').write_text(json.dumps(paths))
print('Dedicated chapter columns assembled; all mathematical source is unchanged.')
