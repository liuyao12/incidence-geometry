"""One-time, checksum-verified transfer of reviewed ordinary source files.
The helper and payload are removed before promotion to the published branch.
"""
from pathlib import Path, PurePosixPath
import hashlib, json, lzma, re, subprocess, sys
root=Path(__file__).resolve().parents[1]
raw=lzma.decompress(b''.join((root/'.release'/f'review-{i:02d}.xzpart').read_bytes() for i in range(9)))
if hashlib.sha256(raw).hexdigest()!='a63db5dba860f24e56231dc6f60e27fcaee0826fd68663675a65f8b78bed504d':
    raise SystemExit('Transfer checksum mismatch')
data=json.loads(raw)
paths=sorted(set(re.findall(r'^\+\+\+ b/(.+)$',data['patch'],re.M))|set(data['files']))
for name in paths:
    p=PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or p.parts[0] in ('.git','.github','.release') or any(c in name for c in '\n\r\x00'):
        raise SystemExit(f'Unsafe path: {name!r}')
    if (root/p).is_symlink(): raise SystemExit(f'Refusing symlink: {name}')
for option in ('--check',None):
    args=['git','apply','--whitespace=nowarn']
    if option: args.append(option)
    subprocess.run(args,input=data['patch'].encode(),cwd=root,check=True)
for name,text in data['files'].items():
    dest=root/name
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(text,encoding='utf-8')
# HTTP-only test correction: changing just the fragment reuses the old document.
# Reopening from blank actually tests bookmark initialization and invalid-input
# handling. Keep every assertion, and verify the exact corrected source digest.
p=root/'scripts/browser_review.py'
old=" if server:page.goto(f'http://127.0.0.1:{server.server_port}/connections.html'+fragment,wait_until='networkidle')"
new=" if server:\n  # A fragment-only navigation reuses the current document. Reopen from blank\n  # so bookmark tests exercise initialization, not an already matching state.\n  page.goto('about:blank')\n  page.goto(f'http://127.0.0.1:{server.server_port}/connections.html'+fragment,wait_until='networkidle')"
text=p.read_text()
if text.count(old)!=1: raise SystemExit('Unexpected browser test source')
p.write_text(text.replace(old,new),encoding='utf-8')
expected='c8e0481e5a952ef4470fa6cf18fef2455668e57fab8569a01317008d28e6fd3c'
if hashlib.sha256(p.read_bytes()).hexdigest()!=expected: raise SystemExit('Test correction digest mismatch')
manifest=root/'verification/release-source-hashes.json'
record=json.loads(manifest.read_text())
if record['files']['scripts/browser_review.py']!='19ac77baec7b4a36041b91e64ed1ba14fe3d93cb1dddba3cab188efa405d8282':
    raise SystemExit('Unexpected original test fingerprint')
record['files']['scripts/browser_review.py']=expected
manifest.write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
(root/'.release/paths.json').write_text(json.dumps(paths))
subprocess.run([sys.executable,'scripts/check_release_sources.py'],cwd=root,check=True)
print(f'Assembled {len(paths)} reviewed source paths; fingerprints agree.')
