"""Check the public-theorem inventory and actual Lean #print axioms output.

Lean performs the proofs; this script only enforces the project's evidence policy.
Usage: python scripts/audit_axioms.py formal/axiom-audit-current.txt [commit]
"""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {'propext', 'Classical.choice', 'Quot.sound'}


def uncomment(text):
    # Lean permits nested block comments.
    out, i, depth = [], 0, 0
    while i < len(text):
        if text[i:i+2] == '/-':
            depth += 1; i += 2
        elif depth and text[i:i+2] == '-/':
            depth -= 1; i += 2
        elif not depth and text[i:i+2] == '--':
            end = text.find('\n', i)
            i = len(text) if end < 0 else end
        else:
            if not depth: out.append(text[i])
            elif text[i] == '\n': out.append('\n')
            i += 1
    return ''.join(out)


def main():
    if len(sys.argv) not in (2, 3):
        raise SystemExit(__doc__)
    printed = (ROOT/'formal/Audit.lean').read_text()
    expected = set(re.findall(r'^#print axioms (\S+)', printed, re.M))
    public = set()
    for file in (ROOT/'formal/IncidenceCubes').rglob('*.lean'):
        text = uncomment(file.read_text())
        if re.search(r'\b(sorry|admit|axiom|native_decide)\b', text):
            raise SystemExit(f'Forbidden proof placeholder/declaration in {file}')
        namespaces = re.findall(r'^namespace (\S+)', text, re.M)
        if not namespaces and not re.search(r'^\s*theorem\s+', text, re.M):
            continue
        if len(namespaces) != 1:
            raise SystemExit(f'Update inventory parser for namespaces in {file}')
        public.update(namespaces[0]+'.'+name for name in
            re.findall(r'^\s*theorem\s+([\w.\']+)', text, re.M))
    if public != expected:
        raise SystemExit(f'Audit inventory mismatch: missing {sorted(public-expected)}, extra {sorted(expected-public)}')
    text = Path(sys.argv[1]).read_text(encoding='utf-8-sig')
    records = {}
    for name, axioms in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", text):
        records[name] = set(re.findall(r'[\w.]+', axioms))
    for name in re.findall(r"'([^']+)' does not depend on any axioms", text):
        records[name] = set()
    if set(records) != expected:
        raise SystemExit(f'Incomplete Lean output: missing {sorted(expected-set(records))}; unexpected {sorted(set(records)-expected)}')
    used = set().union(*records.values())
    if used-ALLOWED:
        raise SystemExit(f'Forbidden dependencies: {sorted(used-ALLOWED)}')
    result = {'status': 'passed', 'publicTheorems': len(records),
              'axiomsObserved': sorted(used), 'forbiddenAxiomsObserved': [],
              'sourceInventoryMatches': True}
    if len(sys.argv) == 3: result['commit'] = sys.argv[2]
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
