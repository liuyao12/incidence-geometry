"""Validate published source fingerprints, imports and chapter entry points."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'verification/release-source-hashes.json').read_text())
for name,digest in manifest['files'].items():
    path=ROOT/name
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=digest:
        raise SystemExit(f'Source fingerprint mismatch: {name}')
audit=set(re.findall(r'^#print axioms (\S+)',(ROOT/'formal/Audit.lean').read_text(),re.M))
for page in json.loads((ROOT/'theorem-map.json').read_text())['pages']:
    for name in page['entryPoints']:
        if name not in audit:raise SystemExit(f'Unaudited chapter entry point: {name}')
# Follow project imports to ensure every project module is built from the root.
reachable=set()
def visit(module):
    if module in reachable:return
    reachable.add(module)
    text=(ROOT/'formal'/Path(module.replace('.','/')+'.lean')).read_text()
    for name in re.findall(r'^import (IncidenceCubes[\w.]*)',text,re.M):visit(name)
visit('IncidenceCubes')
allmodules={'IncidenceCubes.'+'.'.join(p.relative_to(ROOT/'formal/IncidenceCubes').with_suffix('').parts) for p in (ROOT/'formal/IncidenceCubes').rglob('*.lean')}
if allmodules-reachable:raise SystemExit(f'Unimported project modules: {sorted(allmodules-reachable)}')
print(f"{len(manifest['files'])} source fingerprints, {len(audit)} public theorem references, and all {len(allmodules)} project imports checked.")
