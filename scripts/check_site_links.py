"""Check local HTML references, assets and fragments before publication."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.ids=set()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.add(a['id'])
        for k in ('href','src'):
            if k in a:self.refs.append(a[k])
missing=[];count=0
for f in ('index.html','fomin.html','connections.html','proofs.html','lab.html'):
    h=Links();h.feed((ROOT/f).read_text())
    for ref in h.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        if u.path.startswith('../../'):continue # historical laboratory back link
        target=ROOT/unquote(u.path) if u.path else ROOT/f
        if not target.exists():missing.append((f,ref))
        elif u.fragment and target.suffix=='.html':
            p=Links();p.feed(target.read_text())
            if unquote(u.fragment) not in p.ids:missing.append((f,ref))
        count+=1
if missing:raise SystemExit(f'Broken internal references: {missing}')
print(f'{count} local references checked.')
