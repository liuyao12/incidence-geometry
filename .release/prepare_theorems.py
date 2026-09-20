"""Apply exact, hash-checked text edits to the current mathematical exposition.
The temporary payload and this helper are removed before promotion to main.
"""
from pathlib import Path, PurePosixPath
import hashlib, json, lzma
R=Path(__file__).resolve().parents[1]
raw=lzma.decompress((R/'.release/theorems.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest()=='e3e09fd0cbfd0d4ad315d6192e2cf017f25337c0059bf1bd9333b4ab64c2d2c6'
data=json.loads(raw)
paths=sorted(set(data['edits'])|set(data['files']))
for name in paths:
 p=PurePosixPath(name)
 assert not p.is_absolute() and '..' not in p.parts
 assert p.parts[0] not in ('.git','.github','.release','formal')
 assert not (R/name).is_symlink()
for name,edit in data['edits'].items():
 p=R/name
 assert hashlib.sha256(p.read_bytes()).hexdigest()==edit['before'],name
 source=p.read_text()
 for a,b,text in reversed(edit['changes']):
  assert 0<=a<=b<=len(source)
  source=source[:a]+text+source[b:]
 assert hashlib.sha256(source.encode()).hexdigest()==edit['after'],name
 p.write_text(source)
for name,source in data['files'].items():
 p=R/name
 assert not p.exists(),name
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(source)
(R/'.release/paths.json').write_text(json.dumps(paths+['vendor/mathjax/tex-svg.js','vendor/mathjax/LICENSE','theorem-browser-test-results.json']))
print('Exact LaTeX and theorem-source edits assembled; no mathematical engine or Lean source changed.')
