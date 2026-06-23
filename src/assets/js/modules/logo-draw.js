// "Roberto Piana" signature draw — reveals each <g> stroke group in writing order.
// Straight strokes use a clip-rect wipe; curved bowls/loops grow a hand-authored
// centerline that masks the fill so the ink follows the pen. The centerline is
// grown by rewriting its `d` (NOT stroke-dasharray — that renders solid inside a
// <mask>/<defs> in both Blink and Gecko, leaking the whole shape). Per-stroke
// geometry is in viewBox units. See docs/superpowers/specs.

const SVGNS = "http://www.w3.org/2000/svg";

// Wipe direction for the clip-rect strokes (lr=left→right, tb=top→down, rl, bt).
const DIR = {
  _R_Parte_1: "tb",
  _R_Parte_2: "lr",
  _O_: "lr",
  _B_Parte_1: "tb",
  _B_Parte_2: "lr",
  _E_: "lr",
  "_R_Parte_1-2": "tb",
  "_R_Parte_2-2": "lr",
  _T_Parte_1: "tb",
  _T_Parte_2: "lr",
  "_O_-2": "lr",
  _P_Parte_1: "tb",
  _P_Parte_2: "lr",
  _I_: "tb",
  _A_Parte_1: "lr",
  _A_Parte_2: "lr",
  _N_Parte_1: "tb",
  _N_Parte_2: "lr",
  "_A_Parte_1-2": "lr",
  "_A_Parte_2-2": "lr",
};

// Curved strokes drawn along a centerline. `pts` in viewBox units; `w` brush width.
const FLOW = {
  // R bowl: top → bulge right → back left toward the stem → right into the O.
  _R_Parte_2: {
    pts: [
      [52, 8],
      [66, 12],
      [80, 22],
      [86, 34],
      [80, 46],
      [66, 53],
      [48, 59],
      [30, 63],
      [16, 68],
      [9, 74],
      [24, 78],
      [42, 80],
      [62, 83],
      [82, 86],
    ],
    w: 28,
  },
  // P bowl: same flow shape.
  _P_Parte_2: {
    pts: [
      [310, 6],
      [330, 8],
      [350, 16],
      [363, 30],
      [356, 44],
      [340, 51],
      [322, 57],
      [305, 63],
      [290, 68],
      [274, 73],
      [295, 73],
      [320, 71],
      [338, 68],
    ],
    w: 28,
  },
  // B belly: from the stem junction, rise to top-right, write the bowl, end bottom-left.
  _B_Parte_2: {
    pts: [
      [90, 70],
      [100, 63],
      [110, 57],
      [113, 68],
      [112, 79],
      [104, 87],
      [95, 90],
      [88, 91],
    ],
    w: 28,
  },
  // E: from the centre, counter-clockwise spiral following the stroke.
  _E_: {
    pts: [
      [134, 77],
      [140, 75],
      [138, 68],
      [131, 66],
      [126, 72],
      [129, 80],
      [136, 81],
      [131, 70],
      [126, 66],
      [123, 76],
      [125, 85],
      [133, 91],
      [143, 89],
      [148, 84],
    ],
    w: 28,
  },
  // O (first): counter-clockwise loop, start + end at centre-left.
  _O_: {
    pts: [
      [48, 78],
      [53, 87],
      [63, 90],
      [74, 86],
      [80, 78],
      [75, 70],
      [63, 67],
      [52, 70],
      [48, 78],
    ],
    w: 28,
  },
  // O (second): same CCW loop, centre-left start/end.
  "_O_-2": {
    pts: [
      [201, 74],
      [204, 83],
      [212, 88],
      [220, 83],
      [223, 73],
      [219, 64],
      [211, 61],
      [203, 65],
      [201, 74],
    ],
    w: 28,
  },
};

// The revealed centerline up to progress t∈[0,1].
function partialPath(pts, t) {
  if (t <= 0) return "";
  const total = pts.length - 1;
  const pos = Math.min(total, t * total);
  const k = Math.floor(pos);
  let d = "M" + pts[0].join(",");
  for (let j = 1; j <= k; j++) d += " L" + pts[j].join(",");
  const frac = pos - k;
  if (k < total && frac > 0) {
    const a = pts[k],
      b = pts[k + 1];
    d +=
      " L" +
      (a[0] + (b[0] - a[0]) * frac).toFixed(2) +
      "," +
      (a[1] + (b[1] - a[1]) * frac).toFixed(2);
  }
  return d;
}

// Build the clip-paths / masks, set the hidden initial state, and return helpers.
// `addTo(tl, startAt)` appends the draw tweens to a caller-owned timeline;
// `duration` is the total draw length so the caller can sequence what follows.
export function setupSignature(svg, gsap) {
  const groups = Array.from(svg.querySelectorAll("g[id]"));
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(SVGNS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }

  const strokes = groups.map((g, i) => {
    const flow = FLOW[g.id];
    if (flow) {
      let len = 0;
      for (let k = 1; k < flow.pts.length; k++)
        len += Math.hypot(
          flow.pts[k][0] - flow.pts[k - 1][0],
          flow.pts[k][1] - flow.pts[k - 1][1],
        );

      const mask = document.createElementNS(SVGNS, "mask");
      mask.id = "rp-mk-" + i;
      mask.setAttribute("maskUnits", "userSpaceOnUse");
      const mp = document.createElementNS(SVGNS, "path");
      mp.setAttribute("d", "");
      mp.setAttribute("fill", "none");
      mp.setAttribute("stroke", "#fff");
      mp.setAttribute("stroke-width", flow.w);
      mp.setAttribute("stroke-linecap", "round");
      mp.setAttribute("stroke-linejoin", "round");
      mask.appendChild(mp);
      defs.appendChild(mask);
      g.setAttribute("mask", "url(#rp-mk-" + i + ")");
      const dur = Math.min(0.95, Math.max(0.5, (len / 260) * 0.5));
      return { type: "mask", g, mp, pts: flow.pts, dur, proxy: { t: 0 } };
    }

    const bb = g.getBBox();
    const pad = 0.75;
    const x = bb.x - pad,
      y = bb.y - pad;
    const w = bb.width + pad * 2,
      h = bb.height + pad * 2;
    const dir = DIR[g.id] || "lr";
    let from, to;
    if (dir === "lr") {
      from = { x, y, width: 0, height: h };
      to = { x, y, width: w, height: h };
    } else if (dir === "rl") {
      from = { x: x + w, y, width: 0, height: h };
      to = { x, y, width: w, height: h };
    } else if (dir === "tb") {
      from = { x, y, width: w, height: 0 };
      to = { x, y, width: w, height: h };
    } else {
      from = { x, y: y + h, width: w, height: 0 };
      to = { x, y, width: w, height: h };
    }
    const span = dir === "lr" || dir === "rl" ? w : h;

    const cp = document.createElementNS(SVGNS, "clipPath");
    cp.id = "rp-cp-" + i;
    cp.setAttribute("clipPathUnits", "userSpaceOnUse");
    const r = document.createElementNS(SVGNS, "rect");
    Object.entries(from).forEach(([k, v]) => r.setAttribute(k, v));
    cp.appendChild(r);
    defs.appendChild(cp);
    g.setAttribute("clip-path", "url(#rp-cp-" + i + ")");
    const dur = Math.min(0.42, Math.max(0.13, (span / 520) * 0.9 + 0.1));
    return { type: "clip", r, from, to, dur };
  });

  // Hidden initial state — nothing renders until its turn (no pre-draw flash).
  setHidden(strokes, gsap);
  svg.style.visibility = "visible";

  // Total draw length (max stroke end time given the 0.6 overlap).
  let duration = 0,
    acc = 0;
  strokes.forEach((s) => {
    duration = Math.max(duration, acc + s.dur);
    acc += s.dur * 0.6;
  });

  function addTo(tl, startAt = 0) {
    let at = startAt;
    strokes.forEach((s) => {
      if (s.type === "mask") {
        tl.to(
          s.proxy,
          {
            t: 1,
            duration: s.dur,
            ease: "power1.inOut",
            onStart: () => {
              s.g.style.display = "";
            },
            onUpdate: () =>
              s.mp.setAttribute("d", partialPath(s.pts, s.proxy.t)),
          },
          at,
        );
      } else {
        tl.to(s.r, { attr: s.to, duration: s.dur, ease: "power1.inOut" }, at);
      }
      at += s.dur * 0.6;
    });
    return at;
  }

  function showStatic() {
    strokes.forEach((s) => {
      if (s.type === "mask") {
        s.g.style.display = "";
        s.mp.setAttribute("d", partialPath(s.pts, 1));
      } else gsap.set(s.r, { attr: s.to });
    });
  }

  return { addTo, duration, showStatic };
}

function setHidden(strokes, gsap) {
  strokes.forEach((s) => {
    if (s.type === "mask") {
      s.proxy.t = 0;
      s.mp.setAttribute("d", "");
      s.g.style.display = "none";
    } else gsap.set(s.r, { attr: s.from });
  });
}
