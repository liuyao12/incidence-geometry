"""Verify the local math renderer and the three theorem anchors."""
from pathlib import Path
import hashlib, re
R=Path(__file__).resolve().parents[1]
expected={
 'vendor/mathjax/tex-svg.js':'0383da4c22a61555f3d99877f939f00012d2583381177302987ab04760cdadf3',
 'vendor/mathjax/LICENSE':'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'
}
for path,digest in expected.items():
 assert hashlib.sha256((R/path).read_bytes()).hexdigest()==digest,path
for name in ['index.html','fomin.html','connections.html','proofs.html']:
 s=(R/name).read_text()
 assert s.count('src="math-config.js"')==1,name
 assert s.count('src="vendor/mathjax/tex-svg.js"')==1,name
 assert s.index('src="math-config.js"') < s.index('src="vendor/mathjax/tex-svg.js"'),name
 assert 'href="math.css"' in s,name
 assert '\\(' in s and '\\)' in s,name
 if name!='proofs.html':
  assert s.count('id="main-theorem"')==1,name
  assert 'class="theorem-statement"' in s,name
  assert 'class="short-proof theorem-hypotheses"' in s,name
 assert not re.search(r'<script[^>]+src="https?://',s),name
print('Local MathJax hashes, LaTeX sources and three theorem anchors verified.')
