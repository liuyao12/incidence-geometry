/* Projective geometric algebra adapter, Cl(2,0,1), evaluated in Float64.
 * The linear coefficients are [a,b,c] for ax+by+cz=0.
 * Point [x,y,z] is z e12 - x e02 + y e01.
 * No Clifford metric is imposed on the conic itself.
 * Sources: ganja.js; Yao Liu, observablehq.com/@liuyao12/conics-sections@1069.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./vendor/ganja.js'), require('./engine.js'));
  } else root.IncidencePGA = factory(root.Algebra, root.IncidenceMath);
})(globalThis, (Algebra, E) => {
  'use strict';
  if (!Algebra) throw new Error('The pinned ganja.js dependency did not load.');
  const algebra = Algebra({p: 2, q: 0, r: 1, baseType: Float64Array});
  const point = ([x, y, z = 1]) => {
    const p = new algebra(); p.e12 = z; p.e02 = -x; p.e01 = y; return p;
  };
  const line = ([a, b, c]) => {
    const l = new algebra(); l.e1 = a; l.e2 = b; l.e0 = c; return l;
  };
  const pointCoordinates = p => [-p.e02, p.e01, p.e12];
  const lineCoordinates = l => [l.e1, l.e2, l.e0];
  // Vee joins points. Wedge meets lines. Both remain homogeneous at infinity.
  const join = (p, q) => p.Vee(q);
  const meet = (l, m) => l.Wedge(m);
  const incidence = (p, l) => l.Wedge(p).e012;
  const valid = v => Array.from(v).every(Number.isFinite) && Math.hypot(...v) > 1e-12;
  const rescale = v => { const n = Math.hypot(...v); return n > 0 ? v.Scale(1 / n) : v; };
  const finite = p => valid(p) && Math.abs(p.e12) > 1e-9 * Math.hypot(...p);
  const affine = p => finite(p) ? [-p.e02 / p.e12, p.e01 / p.e12, 1] : null;
  const joinCoordinates = (p, q) => lineCoordinates(join(point(p), point(q)));
  const meetCoordinates = (l, m) => pointCoordinates(meet(line(l), line(m)));

  // Independent ganja construction of the Desargues/Fomin incidence cube.
  function fomin(O = [0.08, -0.05, 1], ts = [0.57, 0.68, 0.78]) {
    const labels = [], lines = [[.7, 1, -.8], [-.9, .5, -.9], [.1, -1, -.85]];
    const pairs = [[0, 1, 3], [0, 2, 5], [1, 2, 6]], vertices = [];
    labels[0] = O.slice(); [1, 2, 4].forEach((id, i) => { labels[id] = lines[i].slice(); });
    pairs.forEach(([i, j, id], k) => {
      const A = affine(meet(line(lines[i]), line(lines[j])));
      if (!A) throw new Error('The chosen seed vertex is at infinity.');
      vertices.push(A); labels[id] = E.add(E.scale(O, 1 - ts[k]), E.scale(A, ts[k]));
    });
    const R1 = meetCoordinates(lines[0], joinCoordinates(labels[3], labels[5]));
    const R2 = meetCoordinates(lines[1], joinCoordinates(labels[3], labels[6]));
    const R3 = meetCoordinates(lines[2], joinCoordinates(labels[5], labels[6]));
    const last = join(point(R1), point(R2));
    if (!valid(last)) throw new Error('Two construction points coincide; the completing line is undetermined.');
    labels[7] = E.unit(lineCoordinates(last));
    const weights = E.EDGES.map(([i, j]) => E.parity(i) === 0
      ? incidence(point(labels[i]), line(labels[j])) : incidence(point(labels[j]), line(labels[i])));
    const ratios = E.FACES.map((_, f) => weights[E.POS[2*f]] * weights[E.POS[2*f+1]] /
      (weights[E.NEG[2*f]] * weights[E.NEG[2*f+1]]));
    const minPairing = Math.min(...E.EDGES.map(([i,j],e) => Math.abs(weights[e]) / (E.norm(labels[i])*E.norm(labels[j]))));
    if (minPairing < 1e-10) throw new Error('An edge pairing vanishes: the coherence ratio is not defined.');
    return {labels, vertices, meetings:[R1,R2,R3], weights, ratios, minPairing,
      error:Math.max(...ratios.map(r => Math.abs(r-1))),
      thirdError:Math.abs(incidence(point(R3), line(labels[7]))) / E.norm(R3)};
  }

  const defaultFive = () => [[-1,-.3,1],[-.7,1,1],[0,-.7,1],[.5,1,1],[1.2,-.3,1]];
  // The same straightedge construction as the notebook's conic(5p), with
  // explicit joins/meets and correctly closed sampling. No fitted equation
  // is used to generate the curve or its sixth point.
  function pascalConstruction(points, theta) {
    const [A,B,C,D,Fifth] = points.map(point), direction = point([Math.cos(theta),Math.sin(theta),0]);
    const ray = rescale(join(A, direction));
    const X = rescale(meet(join(A,D), join(B,C)));
    const Y = rescale(meet(ray, join(B,Fifth)));
    const pascalLine = rescale(join(X,Y));
    const Z = rescale(meet(pascalLine, join(D,Fifth)));
    const sixth = rescale(meet(join(Z,C), ray));
    return {ray, X,Y,Z, pascalLine, sixth};
  }
  // Cofactors are ONLY a diagnostic against the independent implicit equation.
  function fivePointEquation(points) {
    const rows = points.map(([x,y,z]) => [x*x,y*y,z*z,x*y,x*z,y*z]);
    const q = Array.from({length:6}, (_,j) => (j%2?-1:1) * E.det(rows.map(r => r.filter((_,k)=>k!==j))));
    const n = E.norm(q); return n > 1e-11 ? q.map(x=>x/n) : null;
  }
  const evalCoefficients = (q, [x,y,z]) => q[0]*x*x+q[1]*y*y+q[2]*z*z+q[3]*x*y+q[4]*x*z+q[5]*y*z;
  function pascal(points = defaultFive(), theta = .7, N = 240) {
    let margin = Infinity;
    for(let i=0;i<5;i++) for(let j=i+1;j<5;j++) for(let k=j+1;k<5;k++)
      margin = Math.min(margin,Math.abs(incidence(point(points[k]),join(point(points[i]),point(points[j])))) /
        (E.norm(points[i])*E.norm(points[j])*E.norm(points[k])));
    const coefficients = fivePointEquation(points);
    if (!coefficients || margin < 1e-8) throw new Error('Five points must be distinct, with no three collinear.');
    const witness = pascalConstruction(points,theta);
    const samples = Array.from({length:N},(_,i)=>pascalConstruction(points,(i+.137)*Math.PI/N).sixth);
    const residual = Math.max(...samples.filter(valid).map(p=>{
      const x=pointCoordinates(p);return Math.abs(evalCoefficients(coefficients,x)) / E.dot(x,x);
    }));
    const complete = [witness.sixth,witness.X,witness.Y,witness.Z,witness.pascalLine].every(valid);
    const incidenceResidual = complete ? Math.max(...[witness.X,witness.Y,witness.Z].map(p =>
      Math.abs(incidence(p,witness.pascalLine))/(Math.hypot(...p)*Math.hypot(...witness.pascalLine)))) : null;
    return {...witness,samples,coefficients,residual,incidenceResidual,margin,complete};
  }

  // Real conics are sampled homogeneously. The second intersection of the
  // line A+tV with q=0 is q(V)A-2B(A,V)V. Tangencies giving zero vectors are
  // skipped. The renderer clips branches rather than connecting across infinity.
  function conicSamples(Q, N = 180) {
    let A=null;
    const ellipse = E.ellipse(Q, 8) || E.ellipse(Q.map(r=>r.map(x=>-x)), 8);
    if (ellipse) A=[...ellipse[0],1];
    if (!A) for (const k of [0,.5,-.5,1,-1,2,-2,4,-4]) {
      for(const l of [[1,0,k],[0,1,k],[1,1,k]]) {
        A=E.lineConic(Q,l).find(p=>E.norm(E.mul(Q,p))>1e-9) || null;
        if (A) break;
      }
      if(A) break;
    }
    if(!A) return [];
    const QA=E.mul(Q,A);
    return Array.from({length:N},(_,i)=>{
      const t=(i+.237)*Math.PI/N,V=[Math.cos(t),Math.sin(t),0];
      return point(E.add(E.scale(A,E.quad(Q,V)),E.scale(V,-2*E.dot(QA,V))));
    });
  }
  return {algebra,point,line,pointCoordinates,lineCoordinates,join,meet,incidence,
    joinCoordinates,meetCoordinates,valid,rescale,finite,affine,fomin,defaultFive,
    pascalConstruction,fivePointEquation,evalCoefficients,pascal,conicSamples};
});
