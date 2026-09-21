# Connecting the three chapters

The third chapter presents the conic-contact surface theorem as a bridge:

* Chapter 1 supplies the objects and local face geometry: proper conic contact
  along edges and concurrence of the four contact chords around a cube face.
* Chapter 2 supplies the global mechanism: a coherent face is a scalar product
  equal to one; all oriented edge factors cancel on a closed surface.
* The conic transport lemma identifies concurrence with trivial face holonomy,
  giving that global implication for conic labels without a vertex coloring.

The chapter links directly to Penrose's precise theorem and contact rule,
Fomin's theorem and cancellation proof, Desargues's sphere, and Pappus's torus.
The sixteen-conic torus is NOT the nine-tile Pappus torus with labels silently
replaced: it is a separate, explicitly realized quadrangulation.

## Worked cube

`conic-cube.js` evaluates the same `IncidenceNarrative` family and fixed display
homography used by chapter 1, at its Penrose endpoint. At the default spread
and direction settings its conics are precisely the chapter-one defaults up
to nonzero scalar multiplication of equations.

Normalized dual equations are inverted, and the Sherman–Morrison rank-one
update supplies the primal contact equations. Equations are then transformed
by the fixed display chart and rescaled by vertex factors. The twelve contact
identities, all face products and all concurrence points are computed from
those equations. Products are not assigned the value one.

The cube option is a fully supplied eight-conic example. It illustrates the
six-face surface implication, NOT a replacement proof that constructs an
eighth conic. All twelve contacts of the tested bounded real family have two
distinct real section points; this is a property of the example, not an extra
claim in the general surface theorem.

The two patch buttons select the three faces incident to the base conic and
the three incident to the opposite conic. Each patch has three internal edges
and six boundary edges. Their boundary edge sets are identical and their
induced orientations opposite. Switching the selection does not recompute a
completion. Penrose's generic theorem gives the mathematical completion rule;
the boundary theorem gives the resulting compatibility when the completion is
regular.

`connections.html?example=cube` opens this example directly. The existing
opening torus now uses a flat periodic map, as on the Fomin page. Explicit
bookmarks preserve their saved flat or wrapped view. Cube bookmarks use the
same validated saved-view schema, extended with the cube example type.

## Verification boundary

No Lean source, theorem statement, first-page mathematical engine, or
second-page geometry is changed. This release adds exposition and a worked
example, not a new formal proof or a priority claim. Neither arbitrary-surface
missing-conic existence nor a conversion of every Fomin labeling into conics
is asserted.

`test-conic-bridge.cjs` checks agreement with chapter 1 up to projective scale,
all twelve contacts and their real common tangencies, all six concurrence
conditions, oriented edge cancellation, all 64 face patches, and the two
complementary patches, across 121 configurations.

`scripts/browser_conic_bridge.py` checks the chapter links, all six faces,
24 directed contact inspections, actual cube picking, independent camera,
patch switching, geometry and gauge controls, bookmark recovery, reduced
motion, and typesetting down to 320px. CI also retains every earlier test.

## Flat torus presentation

Both the sixteen-conic and twelve-conic torus open cut open as periodic grids.
Matching arrow pairs identify opposite sides by translation. The selected
vertex colors and labels match the four conics; repeated boundary occurrences
are the same vertex. Orange edges display the selected patch boundary and are
not overwritten by the identification marks. Arrow keys select adjacent faces,
wrapping across the seams, without turning the camera.

The view toggle explicitly offers **Show torus in 3D** or **Show flat map**.
Changing the display preserves conic equations, face/contact selection, patch,
and camera. Visiting the Penrose cube does not overwrite the torus preference;
the cube remains independently rotatable. Reset view restores the flat torus.
Existing saved views with `map: false` still reopen in 3D. No mathematical
construction or Lean source changes.
