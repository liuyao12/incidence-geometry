"""One-time, hash-checked transfer of the locally validated plain-text release.
Only the listed ordinary source files are written. This helper and its payload
are removed before the release is promoted to main.
"""
from pathlib import Path, PurePosixPath
import hashlib, json, lzma, re, subprocess, sys
root = Path(__file__).resolve().parents[1]
parts = [root / '.release' / f'results-{i:02d}.xzpart' for i in range(14)]
raw = lzma.decompress(b''.join(p.read_bytes() for p in parts))
expected = '42f1138c8abb089274c3e534eff9e1a1f722b0f446799080db62831454cd42be'
if hashlib.sha256(raw).hexdigest() != expected:
    raise SystemExit('Release payload hash mismatch')
data = json.loads(raw)
patch_paths = re.findall(r'^\+\+\+ b/(.+)$', data['patch'], re.M)
paths = sorted(set(patch_paths) | set(data['files']))
for name in paths:
    p = PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or any(c in name for c in '\n\r\x00'):
        raise SystemExit(f'Unsafe release path: {name!r}')
    if p.parts[0] in ('.git', '.github', '.release'):
        raise SystemExit(f'Protected release path: {name}')
    if (root / p).is_symlink():
        raise SystemExit(f'Refusing symlink: {name}')
for option in ('--check', None):
    args = ['git', 'apply', '--whitespace=nowarn']
    if option: args.append(option)
    subprocess.run(args, input=data['patch'].encode(), cwd=root, check=True)
for name, text in data['files'].items():
    dest = root / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding='utf-8')
(root / '.release/paths.json').write_text(json.dumps(paths))
subprocess.run([sys.executable, 'scripts/check_release_sources.py'], cwd=root, check=True)
print(f'Assembled {len(paths)} plain-text source paths; all release fingerprints agree.')
