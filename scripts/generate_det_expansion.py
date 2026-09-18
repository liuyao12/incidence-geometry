"""Regenerate scalar Laplace lemmas. The generated equalities are proved in Lean;
this script is not a trusted proof oracle and does not emit axioms or placeholders.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'formal/IncidenceCubes/Classical/DetExpansion.lean'

def expression(rows, cols):
    def m(i, j):
        return f'M {rows[i]} {cols[j]}'
    if len(rows) == 3:
        return (f'{m(0,0)} * {m(1,1)} * {m(2,2)} - {m(0,0)} * {m(1,2)} * {m(2,1)} - '
                f'{m(0,1)} * {m(1,0)} * {m(2,2)} + {m(0,1)} * {m(1,2)} * {m(2,0)} + '
                f'{m(0,2)} * {m(1,0)} * {m(2,1)} - {m(0,2)} * {m(1,1)} * {m(2,0)}')
    return ' +\n    '.join(
        f'(-1 : K) ^ {j} * {m(0,j)} * ({expression(rows[1:], cols[:j] + cols[j+1:])})'
        for j in range(len(cols)))

text = '''import Mathlib.LinearAlgebra.Matrix.NonsingularInverse
import Mathlib.Tactic
/-! Staged Laplace expansion: expand at an abstract matrix before substituting
polynomial-valued entries. This avoids repeatedly normalizing nested Fin submatrices.
The expressions are generated, but all equalities are proved by the Lean kernel. -/
namespace IncidenceCubes.Classical
section Ring
variable {K : Type*} [CommRing K]
set_option maxRecDepth 20000
set_option maxHeartbeats 8000000
'''
for n, name, prev in [(4, 'four', 'Matrix.det_fin_three'),
                      (5, 'five', 'det_four_scalar'), (6, 'six', 'det_five_scalar')]:
    text += (f'\n theorem det_{name}_scalar (M : Matrix (Fin {n}) (Fin {n}) K) :\n'
             f'    M.det =\n    {expression(list(range(n)), list(range(n)))} := by\n'
             f'  rw [Matrix.det_succ_row_zero]\n'
             f'  simp only [Fin.sum_univ_{name}, {prev}]\n  rfl\n')
text += 'end Ring\nend IncidenceCubes.Classical\n'
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(text, encoding='utf-8')
print(f'Generated {OUT.relative_to(ROOT)} ({len(text)} characters)')
