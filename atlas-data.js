/* Named results in the three chapters and the public classical library.
 * Relations are mathematical, NOT an automatically extracted Lean import graph.
 * An edge's verification status is separate from either endpoint's status.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.IncidenceAtlas=factory();})(globalThis,()=>{
'use strict';
const P='https://arxiv.org/html/2409.17150v8',F='https://arxiv.org/pdf/2305.07728',B='https://www.math.brown.edu/tbanchof/gc/mongepappus/MP.html';
const C='IncidenceCubes.Classical.',S='IncidenceCubes.Connection.';
const nodes=[];
function n(id,title,x,y,group,demo,statement,scope,lean=[],kind='theorem',source=P,chapter='index.html'){
 nodes.push({id,title,x,y,group,demo,statement,scope,lean,kind,source,chapter});
}
const story=(phase,dual=false,scene='journey')=>({page:'index.html',phase,dual,scene});
const fomin=(example='desargues',dual=false)=>({page:'fomin.html',example,dual});
const surface=(example='torus',extra={})=>({page:'connections.html',example,...extra});
const extra=example=>({page:'atlas-extras.html',example});
// Fixed positions keep the relationships readable and stable under selection.
n('eight-quadric','Penrose\neight-quadric',110,85,'conics',story(3,false,'extrusion'),
 'Seven quadrics with compatible ring contacts can be completed by an eighth, under the paper’s hypotheses.',
 'Paper theorem. The interactive illustrates one normalized ring-contact pair and its slices, NOT the full eight-quadric completion proof.',[],'theorem',P+'#S4.SS4','index.html#extrusion');
n('dandelin','Dandelin\nspatial Pascal proof',340,85,'conics',story(1,false,'dandelin'),
 'The three Pascal intersections lie on the line \\(\\Gamma\\cap\\Pi\\): the trace of a spatial triangle’s plane in the hexagon’s plane.',
 'Local ruled-quadric and plane-section lemmas are checked. This spatial route is not an end-to-end Lean proof from arbitrary Pascal input.',
 ['IncidenceCubes.Spatial.plane_section_collinear'],'proof',P+'#S5','index.html#dandelin');
n('ring-contact','Ring-contact lift',570,85,'conics',story(3,false,'extrusion'),
 'Lifting normalized conics by \\(q(x,y,w)\\mapsto q(x,y,w)+z^2\\) preserves a rank-one difference and displays a ring of contact.',
 'Checked normalized lift, not the general extrusion lemma. Rotate the scene and move the slicing plane.',
 ['IncidenceCubes.Spatial.lift_rank_one'],'lemma',P+'#S3.SS2','index.html#extrusion');
n('penrose','Penrose\neight-conic',110,195,'conics',story(3),
 'In general position, seven conics with double contact along cube edges and concurrent chords on completed faces determine a unique eighth conic equation up to scale.',
 'Generic arbitrary-input completion and uniqueness are checked. The paper’s broader complete-conic statement also has singular specializations, which the generic Lean theorem does not cover.',
 ['IncidenceCubes.Penrose.Uniqueness.penrose_generic'],'theorem',P+'#S4.SS3','index.html#main-theorem');
n('contact','Rank-one\ncontact rule',340,195,'conics',{...story(3),selection:'edge:0'},
 'If \\(Q_v=\\lambda Q_u+\\mu\\ell\\ell^{\\mathsf T}\\), the two conics have matching projective tangents at smooth points on the chord \\(\\ell=0\\).',
 'The library also derives the pencil relation from two distinct given tangency points. Real existence of such points is a separate condition.',
 [C+'polar_tangent_expansion'],'lemma',P+'#S3.SS1.SSS2','index.html#contact');
n('face-holonomy','Concurrence ⇔\ntrivial holonomy',570,195,'surfaces',surface('torus',{reveal:true}),
 'For four nonsingular conics in proper cyclic contact, the four contact chords concur exactly when \\(H_f=\\prod_{e\\in\\partial f}\\lambda_e=1\\), with the stated distinct-chord conditions.',
 'Checked geometric equivalence. Use the four edge controls to inspect the contacts, or rescale equations without moving the conics.',
 [S+'ConicTransport.face_concurrent_iff'],'lemma','formal/IncidenceCubes/Connection/ConicTransport.lean','connections.html#short-proof');
n('salmon','Salmon',110,305,'conics',story(2),
 'Three conics in double contact with a fourth have compatible pairs of common tangents whose three intersection points are collinear.',
 'The compatible split-branch algebra and normalization over an algebraically closed field are checked. Tangent pairs cannot be chosen independently.',
 ['IncidenceCubes.Presentation.salmon_from_contacts'],'theorem',P+'#S1','index.html#salmon');
n('dual-salmon','Dual Salmon',340,305,'conics',story(2,true),
 'For three conics in contact with a common carrier, compatible common chords concur. In split coordinates their covectors are \\(p_1-p_2,p_2-p_3,p_3-p_1\\).',
 'The compatible difference chords sum to zero. This is the dual formulation of the same branch choice.',
 ['IncidenceCubes.Presentation.salmon_concurrence'],'theorem',P+'#S1','index.html#salmon');
n('pascal','Pascal',110,415,'conics',story(1),
 'The three intersections of opposite sides of a hexagon on a conic are collinear.',
 'Checked for arbitrary nonzero quadratic equations, including reducible conics; projective certificates exclude undefined intersections.',
 [C+'pascal'],'theorem',P+'#S1','index.html#pascal');
n('brianchon','Brianchon',340,415,'conics',story(1,true),
 'The three main diagonals of a hexagon circumscribed about a nonsingular conic are concurrent.',
 'Checked using dual Pascal and inverse polarity, in characteristic different from two.',
 [C+'brianchon'],'theorem',P+'#S1','index.html#pascal');
n('braikenridge','Braikenridge–Maclaurin\nconverse of Pascal',570,415,'classical',extra('braikenridge'),
 'If the three opposite-side intersections of six points are collinear, the six points lie on a nonzero conic equation.',
 'Checked existence of a conic, not nonsingularity or uniqueness. Here the sixth point is constructed from the collinearity condition; reveal the conic recovered from the first five.',
 [C+'braikenridge_maclaurin_iff'],'theorem','formal/IncidenceCubes/Classical/Conics.lean','proofs.html#penrose');
n('pappus','Pappus',110,525,'classical',story(0),
 'For three points on each of two lines, the three cross-intersections \\(AB^{\\prime}\\cap A^{\\prime}B\\), \\(BC^{\\prime}\\cap B^{\\prime}C\\), and \\(CA^{\\prime}\\cap C^{\\prime}A\\) are collinear.',
 'Checked independently and by the line-pair specialization of Pascal. Move the seeds or use the cube to edit the whole conic family.',
 [C+'pappus','IncidenceCubes.Presentation.pappus_via_pascal'],'theorem',P+'#S1','index.html#pappus');
n('dual-pappus','Dual Pappus',340,525,'classical',story(0,true),
 'Take three lines through each of two points. The three joins of corresponding cross-intersections are concurrent.',
 'Checked dual statement. Point–line duality interchanges joins and intersections.',
 [C+'dual_pappus'],'theorem',P+'#S1','index.html#pappus');
n('monge','Monge',570,525,'classical',extra('monge'),
 'For three circles admitting two common external tangents per pair, their three external homothety centers are collinear. Equal radii are interpreted projectively at infinity.',
 'New interactive and elementary proof, not yet a dedicated Lean theorem. The controls stay in an unequal-radius regular real chart. Reveal the Desargues triangles or lift centers by their radii.',
 [],'theorem',B,'atlas-extras.html?theorem=monge');
n('fomin','Fomin–Pylyavskyy\nsurface theorem',110,690,'fomin',fomin(),
 'On an oriented bicolored quadrangulation, label vertices by points and hyperplanes, with nonincident adjacent labels. Coherence of every face but one forces the last.',
 'Checked in arbitrary ambient dimension. The interactive is the planar six-face Desargues instance; its faces record actual point–line incidences.',
 [S+'HyperplaneSurface.hyperplane_surface_last_face'],'theorem',F+'#page=5','fomin.html#main-theorem');
n('boundary','Contact transport\nboundary formula',340,690,'surfaces',surface('torus',{patch:'four'}),
 'For a patch \\(\\mathcal R\\), \\(\\prod_{f\\in\\mathcal R}H_f=\\prod_{e\\in\\partial\\mathcal R}\\lambda_e^{\\varepsilon_e}\\). Interior edge factors cancel.',
 'Checked for oriented finite gluing data. Several boundary components contribute one combined product. Select a patch, including across the seams.',
 [S+'OrientedSurface.region_boundary'],'theorem','formal/IncidenceCubes/Connection/OrientedSurface.lean','connections.html#patches');
n('conic-surface','Conic-contact\nsurface theorem',570,690,'surfaces',surface(),
 'Nonsingular conics label an oriented quadrangulated surface, with proper contact along every edge. Concurrence on all but one face forces concurrence on the last.',
 'Checked without any vertex coloring. All conics and edge contacts are given: this is compatibility, not arbitrary missing-conic existence. Historical priority remains unestablished.',
 [S+'OrientedSurface.conic_surface_last_face'],'theorem','formal/IncidenceCubes/Connection/OrientedSurface.lean','connections.html#main-theorem');
n('desargues','Desargues\nand its converse',110,805,'fomin',fomin(),
 'Two nondegenerate triangles are perspective from a point exactly when their corresponding-side intersections are collinear, with the relevant joins and meets defined.',
 'The incidence and converse are checked. The six-face sphere illustrates the paper’s surface proof; that explicit reduction is not yet an end-to-end Lean derivation.',
 [C+'desargues_iff'],'theorem',F+'#page=7','fomin.html#desargues');
n('generalized-quadrangle','Generalized\nquadrangle theorem',340,805,'fomin',fomin('generalization'),
 'In the paper’s four-vertex construction, the three retained collinearities among section points force the final side incidence, without requiring one common transversal.',
 'Theorem 3.4 of Fomin–Pylyavskyy. Exact proof-surface combinatorics and numerical constructions are tested; this named specialization is not separately formalized.',
 [],'theorem',F+'#page=13','fomin.html#generalization');
n('bicolored','Bicolored conic\nsurface theorem',570,805,'surfaces',surface(),
 'The same all-but-one concurrence theorem holds when the vertex graph also has a black–white coloring.',
 'Checked earlier version. It is a restriction of the coloring-free theorem, NOT an implication from the weaker version to the stronger one.',
 [S+'GeometricSurface.conic_surface_last_face'],'theorem','formal/IncidenceCubes/Connection/GeometricSurface.lean','connections.html#odd-cycle');
n('dual-desargues','Dual Desargues',110,915,'fomin',fomin('desargues',true),
 'Exchange point and line labels in Desargues: collinearity and concurrence exchange roles, as do corresponding vertices and sides.',
 'Checked over a commutative field. This is the dual drawing of the same projective configuration.',
 [C+'dual_desargues'],'theorem','formal/IncidenceCubes/Classical/PappusDesargues.lean','fomin.html#desargues');
n('quadrangle','Complete\nquadrangle theorem',340,915,'fomin',fomin('quadrangle'),
 'Cut the six joining lines of four points by one transversal. A second quadrangle with five corresponding side incidences also satisfies the sixth.',
 'Theorem 3.3 and Figure 15 of Fomin–Pylyavskyy. The displayed last incidence is evaluated independently of its construction; the explicit reduction is not yet in Lean.',
 [],'theorem',F+'#page=12','fomin.html#quadrangle');
n('cube-compatibility','Conic cube\nfive faces ⇒ sixth',570,915,'surfaces',surface('cube',{reveal:true}),
 'For eight supplied nonsingular conics and twelve proper cube-edge contacts, five concurrent-chord faces force concurrence on the sixth.',
 'Cube application of the checked surface theorem. It does not construct an eighth conic; compare the Penrose node.',
 [S+'SurfaceApplications.conic_cube_five_faces'],'corollary','formal/IncidenceCubes/Connection/SurfaceApplications.lean','connections.html#from-penrose');
n('point-line-cube','Point–line cube\nseven labels ⇒ eighth',110,1025,'fomin',fomin(),
 'In the real or complex projective plane, seven generic point–line labels on a cube, with the three completed faces coherent, determine a unique eighth label making the remaining three faces coherent.',
 'Proposition 9.1 of the paper is Desargues in coherent-cube form. The illustration is planar; this is not an arbitrary-dimensional point–hyperplane uniqueness theorem or a separate Lean completion theorem.',
 [],'theorem',F,'fomin.html#desargues');
n('torus16','Sixteen-conic\ntorus',340,1025,'surfaces',surface('torus',{face:15,reveal:true}),
 'Fifteen face concurrences in the supplied sixteen-conic periodic net imply the sixteenth.',
 'An exact rational instance is instantiated in Lean. Sliders explore a related numerical family and do not act as proof oracles.',
 [S+'TorusExample.sixteenth_face'],'corollary','formal/IncidenceCubes/Connection/TorusExample.lean','connections.html#conic-torus');
n('torus12','Twelve-conic\nodd-cycle torus',570,1025,'surfaces',surface('odd',{face:11,reveal:true}),
 'Eleven face concurrences force the twelfth, even though a three-edge cycle prevents a black–white vertex coloring.',
 'The exact rational example and the absence of a coloring are checked. Its numerical demonstration is not identical to the exact instance.',
 [S+'OrientedExample.twelfth_face',S+'OrientedExample.not_bicolorable'],'corollary','formal/IncidenceCubes/Connection/OrientedExample.lean','connections.html#odd-cycle');
n('ceva','Ceva',110,1180,'classical',extra('ceva'),
 'For \\(X=aB+bC\\), \\(Y=cC+dA\\), \\(Z=eA+fB\\) on the sides of a noncollinear triangle, the cevians concur exactly when \\(ace=bdf\\).',
 'Checked division-free homogeneous criterion. Each coefficient pair must be nonzero to represent a projective point.',
 [C+'ceva_iff'],'theorem','formal/IncidenceCubes/Classical/Triangle.lean','formal/README.md');
n('menelaus','Menelaus',340,1180,'classical',extra('menelaus'),
 'For \\(X=aB+bC\\), \\(Y=cC+dA\\), \\(Z=eA+fB\\) on a noncollinear triangle’s sides, \\(X,Y,Z\\) are collinear exactly when \\(ace+bdf=0\\).',
 'Checked homogeneous criterion. The sign is built into the coefficients, avoiding ambiguity about unsigned versus directed lengths.',
 [C+'menelaus_iff'],'theorem','formal/IncidenceCubes/Classical/Triangle.lean','formal/README.md');
n('noncoherent','Contact without\nconcurrence · H = 2',570,1180,'surfaces',surface('square'),
 'Four nonsingular conics can have proper double contact cyclically while their contact chords do not concur: this example has \\(H_f=2\\).',
 'Exact example checked in Lean. It is a single noncoherent face, not a counterexample to the closed-surface theorem.',
 [S+'TransportExamples.not_concurrent'],'example','formal/IncidenceCubes/Connection/TransportExamples.lean','connections.html#noncoherent');
const edges=[];
function e(from,to,type,label,note,source,checked=false){edges.push({id:from+'--'+to,from,to,type,label,note,source,checked});}
e('eight-quadric','penrose','implication','Extrude and slice','The paper combines the eight-quadric theorem with its general extrusion lemma. Our normalized lift alone is not enough for this reduction.',P+'#S4.SS4');
e('penrose','salmon','limit','Complete-conic specialization','This uses the broader complete-conic setting of the paper, including singular members. It is NOT a specialization within our generic nonsingular input hypotheses.',P+'#S1');
e('salmon','pascal','limit','Point pairs as limits','The three contacting conics collapse to point pairs, with compatible tangent branches. The animation illustrates the limit; a Lean reduction theorem has not been added.',P+'#S1');
e('pascal','pappus','implication','Reducible carrier conic','Our Pascal theorem permits the quadratic equation to factor into two lines. The line-pair specialization is proved by pappus_via_pascal.','formal/IncidenceCubes/Classical/Presentation.lean',true);
e('salmon','dual-salmon','duality','Projective duality','Point–line duality exchanges the common-tangent intersection points and the compatible common chords.',P+'#S1');
e('pascal','brianchon','duality','Projective duality','Inverse polarity identifies the dual conic with the tangent locus of a nonsingular conic. The deduction is checked.','formal/IncidenceCubes/Classical/Brianchon.lean',true);
e('pappus','dual-pappus','duality','Projective duality','Exchange points with lines and joins with intersections.','formal/IncidenceCubes/Classical/PappusDesargues.lean',true);
e('brianchon','dual-pappus','limit','Point-pair degeneration','The dual conic degenerates to a point pair; use complete-conic data rather than only a nonsingular polarity.',P+'#S1');
e('pascal','braikenridge','converse','Converse criterion','The common-conic condition and the Pascal collinearity condition are equivalent in the checked determinant identity. This is a converse relation, not an implication inferred by reversing an arrow.','formal/IncidenceCubes/Classical/Conics.lean',true);
e('dandelin','pascal','implication','Spatial proof','The opposite-side intersections lie on the meeting line of two planes. The paper gives the full spatial argument; our local spatial lemmas are checked separately.',P+'#S5');
e('salmon','monge','limit','Circle / absolute specialization','In dual coordinates, circles have D_i=diag(1,1,0)-p_i p_iᵀ. The compatible difference points telescope. The common carrier is singular, so this is not an application of the nonsingular surface theorem.',P+'#S5');
e('desargues','monge','implication','Parallel diameter triangles','Choose opposite ends of parallel diameters. Their triangles are perspective from an ideal point and their corresponding-side intersections are precisely the external homothety centers.',B);
e('fomin','desargues','implication','Six-face sphere','Theorem 3.1, Figure 5: apply the surface theorem to the six correctly labeled tiles. The source paper proves the reduction; our endpoints are formalized independently.',F);
e('fomin','pappus','implication','Nine-face torus','Theorem 3.2, Figure 9: the nine coherent tiles encode the dual concurrency form of Pappus. Duality gives the collinearity form.',F);
e('fomin','generalized-quadrangle','implication','Nine-face sphere','Theorem 3.4 uses the same sphere as Figure 15, retaining only the collinearities needed by the proof.',F);
e('generalized-quadrangle','quadrangle','implication','Restore one transversal','Theorem 3.3 is the special case in which all six section points lie on one line.',F);
e('desargues','dual-desargues','duality','Projective duality','Dualizing the perspectivity statement gives the counterpart with points and lines interchanged.','formal/IncidenceCubes/Classical/PappusDesargues.lean',true);
e('desargues','point-line-cube','implication','Desargues in cube labels','Proposition 9.1 is a restatement of planar Desargues: coherence of three initial faces yields the unique completing line. This is not a higher-dimensional uniqueness assertion.',F+'#page=65');
e('fomin','point-line-cube','bridge','Compatibility vs completion','The paper’s surface implication and Proposition 9.1 have related coherent-cube geometry, but the latter supplies a missing label. They are not identified here.',F);
e('fomin','conic-surface','bridge','Same cancellation mechanism','Both local geometric conditions become multiplicative face invariants. Edge cancellation is shared; there is no claimed pointwise conversion of arbitrary Fomin labels into conics.','connections.html#from-fomin');
e('penrose','conic-surface','bridge','Same contact geometry','Penrose constructs a conic from seven. The surface theorem assumes every vertex conic and edge contact and deduces a face condition.','connections.html#from-penrose');
e('contact','face-holonomy','bridge','Local proof ingredient','Uniqueness of contact scale and four-square rigidity identify concurrence with trivial face holonomy. The rank-one identity alone is not the whole equivalence.','formal/IncidenceCubes/Connection/ConicTransport.lean');
e('ring-contact','contact','implication','Plane section','The normalized spatial identity restricts on z=0 to the planar rank-one contact identity.','formal/IncidenceCubes/Classical/Spatial.lean',true);
e('face-holonomy','conic-surface','bridge','Local geometric ingredient','Combine the local equivalence with global cancellation. Neither ingredient is silently treated as an entire surface theorem.','connections.html#short-proof');
e('boundary','conic-surface','implication','Close the boundary; use the face lemma','For the whole closed surface the boundary product is 1. Together with concurrence ⇔ H_f=1, this yields the all-but-one conclusion.','formal/IncidenceCubes/Connection/OrientedSurface.lean',true);
e('conic-surface','bicolored','implication','Restrict the hypotheses','A bicolored quadrangulation is a special case of an oriented quadrangulation. The general-to-special arrow goes this way.','formal/IncidenceCubes/Connection/OrientedSurface.lean');
e('conic-surface','cube-compatibility','implication','Six-face sphere','Supply all eight nonsingular conics and twelve contacts, then apply the all-but-one-face theorem to a cube.','formal/IncidenceCubes/Connection/SurfaceApplications.lean',true);
e('conic-surface','torus16','implication','4 × 4 periodic instance','The exact example checks fifteen hypotheses and obtains the final face by the surface theorem.','formal/IncidenceCubes/Connection/TorusExample.lean',true);
e('conic-surface','torus12','implication','3 × 4 periodic instance','The exact example checks eleven hypotheses and obtains the twelfth without a vertex coloring.','formal/IncidenceCubes/Connection/OrientedExample.lean',true);
e('face-holonomy','noncoherent','bridge','Sharpness example','H_f=2 gives proper contacts without concurrence; the face condition is genuinely additional geometry.','formal/IncidenceCubes/Connection/TransportExamples.lean');
e('ceva','menelaus','bridge','Companion determinant criteria','Both use the same homogeneous side-point coordinates. Their determinant identities differ by a sign. This link does not assert that one follows just by dualizing the displayed triangle.','formal/IncidenceCubes/Classical/Triangle.lean');
return {nodes,edges,types:{implication:'Implication / specialization',limit:'Limiting specialization',duality:'Duality',converse:'Converse',bridge:'Shared idea / ingredient'}};
});
