# Text and interactive columns

The three chapter pages use an in-flow grid: the exposition on the left and
an interactive column on the right. A vertical divider and continuous column
background replace the movable, rounded, resizable window.

On screens at least 960 CSS pixels wide, the navigation remains at the top and
the interactive content stays within its own column below it. Long controls
scroll inside that column; scrolling the reading column continues to drive the
Pappus–Pascal–Salmon–Penrose journey and Fomin's explanatory scenes. The page
is not scroll-locked, and neither column can overlap the other. The diagram,
cube and torus retain their own geometric dragging and camera controls.

On narrower screens the interactive and text are stacked in normal document
flow. “Read the chapter” and “Back to the interactive” links connect them.
Nothing remains pinned over the prose. At print size, both become normal blocks.

`columns.css` is scoped to the three chapter bodies. `columns.js` only measures
the navigation height, so wrapped navigation and browser zoom do not hide the
first interactive controls. The old window-drag handlers are removed rather
than merely hidden. The independent `lab.html` archive is unchanged.

`python scripts/browser_columns.py --serve` tests the actual HTTP-loaded pages:
column containment, sticky scrolling, long controls, header drag rejection,
real scroll-driven transitions, independent geometry/cube edits, responsive
stacking, jump links, and typeset equations. The existing interaction suites
continue to run. No mathematical algorithm or Lean theorem is changed.
