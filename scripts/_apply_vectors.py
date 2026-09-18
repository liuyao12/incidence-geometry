"""Apply the exact locally tested source delta; verify both source and output hashes."""
from pathlib import Path
import base64,gzip,hashlib,json
root=Path(__file__).resolve().parents[1]
a=(root/'scripts/_vectors_a.b64').read_text().replace('VSqjPCNN','VSqPCNN').replace('GaWxXJ1UlI1','GaWxXJYVCpbZuYRPuakBTpZBuii2J1UlI1')
s=a+(root/'scripts/_vectors_b.b64').read_text()+(root/'scripts/_vectors_c.b64').read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='f7db0d29cc7da96711bcf2d167bd30275eb7d71a64f952880b93cd8e882ad642'
raw=gzip.decompress(base64.b64decode(s,validate=True))
assert hashlib.sha256(raw).hexdigest()=='a59276940f6521f8baf310c98b0947381609e57c0d186349359c5eba3dcfec94'
data=json.loads(raw)
allowed={'index.html','cube-view.js','story.js','narrative.css','vector-moduli.js','test-vector-moduli.cjs','scripts/browser_vectors.py','scripts/browser_narrative.py','scripts/browser_moduli.py','VECTOR_CONTROLS.md','MODULI.md','NARRATIVE.md','README.md'}
assert set(data)==allowed
outputs={}
for path,item in data.items():
 p=root/path;text=p.read_text() if p.exists() else ''
 assert hashlib.sha256(text.encode()).hexdigest()==item['before'],('Source changed',path)
 for i,j,replacement in reversed(item['edits']):text=text[:i]+replacement+text[j:]
 assert hashlib.sha256(text.encode()).hexdigest()==item['after'],('Output differs',path)
 outputs[p]=text
for path,text in outputs.items():path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
Path('/tmp/vector-paths.txt').write_text('\n'.join(sorted(allowed)))
print('All 13 source files match the independently tested local release.')
