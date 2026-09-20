"""One-time, hash-checked transfer of the locally tested Fomin chapter sources.
This helper and its payload are removed before promotion to main.
"""
from pathlib import Path, PurePosixPath
import hashlib, json, lzma, subprocess, sys
ROOT = Path(__file__).resolve().parents[1]
raw = lzma.decompress(b''.join((ROOT/'.release'/f'fomin-{i}.xzpart').read_bytes() for i in range(4)))
if hashlib.sha256(raw).hexdigest() != '7530469d9432b29cd13e8d987583decaa1b588f2ede2214c12428f597c3e3858':
    raise SystemExit('Release payload fingerprint mismatch')
files = json.loads(raw)['files']
expected = {'fomin.html', 'fomin-classics.js', 'fomin-page.js', 'fomin-classics.css',
            'test-fomin-classics.cjs', 'scripts/browser_fomin_classics.py',
            'FOMIN_APPLICATIONS.md', 'verification/release-source-hashes.json'}
if set(files) != expected:
    raise SystemExit('Unexpected release paths')
subprocess.run([sys.executable, 'scripts/check_release_sources.py'], cwd=ROOT, check=True)
for name, text in files.items():
    p = PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or any(c in name for c in '\n\r\x00'):
        raise SystemExit(f'Unsafe path: {name!r}')
    if p.parts[0] in ('.git', '.github', '.release', 'formal') or (ROOT/name).is_symlink():
        raise SystemExit(f'Protected path: {name}')
    dest = ROOT/name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding='utf-8')
paths = sorted(expected) + ['fomin-classics-test-results.json', 'fomin-classics-browser-test-results.json']
(ROOT/'.release/paths.json').write_text(json.dumps(paths), encoding='utf-8')
for script in ('check_release_sources.py', 'check_math_assets.py', 'check_site_links.py'):
    subprocess.run([sys.executable, f'scripts/{script}'], cwd=ROOT, check=True)
print('Eight exact source files assembled; no first/third-page geometry or Lean source changed.')
