"""Apply the explicitly listed, hash-checked flat-torus presentation edits.
This staging helper is removed before the ordinary sources reach main.
"""
from pathlib import Path
import hashlib, json, subprocess, sys
root = Path(__file__).resolve().parents[1]
raw = (root / '.release/flat-torus-edits.json').read_bytes()
assert hashlib.sha256(raw).hexdigest() == 'd8e796f5ced7afec6227ae35e20a1585506fbe186063dbc921c520657d5d953e'
edits = json.loads(raw)
allowed = {'CONIC_CONNECTIONS.md', 'conic-surface-page.js', 'connections.html', 'scripts/browser_results.py', 'scripts/browser_review.py', 'scripts/browser_theorems.py'}
assert set(edits) == allowed
outputs = {}
for name, spec in edits.items():
    path = root / name
    assert path.is_file() and not path.is_symlink(), name
    assert hashlib.sha256(path.read_bytes()).hexdigest() == spec['before'], name
    text = path.read_text(encoding='utf-8')
    last = len(text)
    for a, b, replacement in reversed(spec['edits']):
        assert 0 <= a <= b <= last, name
        text = text[:a] + replacement + text[b:]
        last = a
    assert hashlib.sha256(text.encode()).hexdigest() == spec['after'], name
    outputs[name] = text
for name, text in outputs.items():
    (root / name).write_text(text, encoding='utf-8')
p = root / 'verification/release-source-hashes.json'
manifest = json.loads(p.read_text())
manifest['baseCommit'] = '8f289860e133d120693e2639939934110972961a'
for name, spec in edits.items():
    if name in manifest['files']:
        manifest['files'][name] = spec['after']
p.write_text(json.dumps(manifest, indent=2) + '\n')
assert hashlib.sha256(p.read_bytes()).hexdigest() == '558004602dc972fbf47c25670933bd0e5e55c3b9c078c3f18dbaecac058dbbb6'
paths = sorted(allowed) + ['verification/release-source-hashes.json', 'review-browser-test-results.json']
(root / '.release/paths.json').write_text(json.dumps(paths))
subprocess.run([sys.executable, 'scripts/check_release_sources.py'], cwd=root, check=True)
print('Flat-torus source matches the locally tested files. Geometry engines and Lean sources are unchanged.')
