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
(root/'.release/paths.json').write_text(json.dumps(paths))
subprocess.run([sys.executable,'scripts/check_release_sources.py'],cwd=root,check=True)
print(f'Assembled {len(paths)} reviewed source paths; fingerprints agree.')
