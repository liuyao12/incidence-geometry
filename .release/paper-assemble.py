"""Apply the exact locally tested UTF-8 edits, checking every input and output.
This transfer helper and its compressed payload are removed before publication.
"""
from pathlib import Path, PurePosixPath
import hashlib, json, lzma, subprocess, sys
root = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()
raw = lzma.decompress(b''.join((root/'.release'/f'paper-{i:02d}.xzpart').read_bytes() for i in range(2)))
if sha(raw) != '6206208c5e42bf63a3d7d7e2a23460a9a311b3511a2b40426928390c581783dc':
    raise SystemExit('Transfer payload fingerprint mismatch')
data = json.loads(raw)
paths = []
for f in data['files']:
    name = f['path']; p = PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or p.parts[0] in ('.git','.github','.release') or any(c in name for c in '\n\r\x00'):
        raise SystemExit(f'Unsafe source path: {name!r}')
    target = root/name
    if target.is_symlink(): raise SystemExit(f'Symlink source: {name}')
    if f['old'] is None:
        if target.exists(): raise SystemExit(f'New source already exists: {name}')
        text = ''
    else:
        old = target.read_bytes()
        if sha(old) != f['old']: raise SystemExit(f'Unexpected parent source: {name}')
        text = old.decode('utf-8')
    last = len(text)
    for start,end,replacement in reversed(f['edits']):
        if not 0 <= start <= end <= last: raise SystemExit(f'Invalid edit bounds: {name}')
        text = text[:start] + replacement + text[end:]; last = start
    encoded = text.encode('utf-8')
    if sha(encoded) != f['new']: raise SystemExit(f'Edited source fingerprint mismatch: {name}')
    target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(encoded); paths.append(name)
manifest_path = root/'verification/release-source-hashes.json'
manifest = json.loads(manifest_path.read_text())
manifest['baseCommit'] = data['parent']
extra = ['journey-view.js','test-journey-view.cjs','scripts/browser_journey_view.py','NARRATIVE.md','MODULI.md','VECTOR_CONTROLS.md']
manifest['files'] = {name: sha((root/name).read_bytes()) for name in sorted(set(manifest['files']) | set(extra))}
encoded = (json.dumps(manifest,indent=2)+'\n').encode()
if sha(encoded) != data['manifestHash']: raise SystemExit('Regenerated source manifest disagrees')
manifest_path.write_bytes(encoded); paths.append('verification/release-source-hashes.json')
ci = root/'.github/workflows/ci.yml'
text = ci.read_text()
for before,after in [
    ('          node test-oriented-net.cjs\n','          node test-oriented-net.cjs\n          node test-journey-view.cjs\n'),
    ('          python scripts/browser_review.py --serve\n','          python scripts/browser_review.py --serve\n          python scripts/browser_journey_view.py --serve\n')]:
    if text.count(before) != 1: raise SystemExit('Unexpected CI parent source')
    text = text.replace(before,after)
text += '            journey-view-test-results.json\n            journey-view-browser-test-results.json\n            paper-stage-*.png\n            paper-journey-*.png\n'
ci.write_text(text); paths.append('.github/workflows/ci.yml')
(root/'.release/paper-paths.json').write_text(json.dumps(paths))
subprocess.run([sys.executable,'scripts/check_release_sources.py'],cwd=root,check=True)
subprocess.run([sys.executable,'scripts/check_site_links.py'],cwd=root,check=True)
print(f'Assembled {len(paths)} exact source paths. No formal theorem source was changed.')
