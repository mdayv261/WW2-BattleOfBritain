// The RAF panel's structure and fittings (D86), after the product owner's reference picture: the arched panel and its
// holes, the raised blind-flying plate, and everything besides the dials. Working: the flap lever (UP or DOWN with the
// flaps) and the undercarriage UP/DOWN indicator (red UP with the undercarriage up and locked, green DOWN with it down
// and locked, both dark while it moves). The rest is drawn in its normal state: switches on, warning lamps out.

import { C, roundRect, text, screw, knob, lens, plate } from './panelParts.js';
import { gearLampState } from './panelControls.js';

/** Draws the panel and its fittings. `at` is the panel's placer (src/ui/rafPanel.js), L its layout. */
export function drawFittings(g, at, L, v) {
  const s = at.len(8); // a mounting screw's radius
  panelBody(g, at, L);
  backOpening(g, at, s);
  blindFlyingPlate(g, at, L, s);
  navLights(g, at, L, s);
  flapPlacard(g, at, L);
  flapLever(g, at, L, v);
  oxygenBox(g, at, L, s);
  gearIndicator(g, at, L, v, s);
  fsGearBox(g, at, L, s);
  voltmeterBox(g, at, L, s);
  magnetos(g, at, L, s);
  placards(g, at, L);
  bottomRow(g, at, L);
  fuelFittings(g, at, L, s);
}

function panelBody(g, at, L) {
  const pts = L.outline;
  const [x0, y0] = at.xy([946, 31]);
  const [, yFoot] = at.xy([946, 1046]);
  const grad = g.createLinearGradient(0, y0, 0, yFoot);
  grad.addColorStop(0, C.panelTop);
  grad.addColorStop(1, C.panelFoot);
  g.beginPath();
  pts.forEach(([dx, dy], i) => {
    const px = x0 + dx * at.len(82);
    const py = y0 + dy * at.len(82);
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  });
  g.closePath();
  g.fillStyle = grad;
  g.fill();
  g.strokeStyle = C.panelEdge;
  g.lineWidth = Math.max(1, at.len(3));
  g.stroke();
  for (const h of L.holes) {
    const [hx, hy] = at.xy(h);
    g.fillStyle = C.hole;
    g.beginPath();
    g.arc(hx, hy, at.len(8), 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = C.rivet;
  for (const rv of L.rivets) {
    const [rx, ry] = at.xy(rv);
    g.beginPath();
    g.arc(rx, ry, Math.max(1, at.len(3.5)), 0, Math.PI * 2);
    g.fill();
  }
}

/** The light opening above the blind-flying plate, and the dark knob at its left. */
function backOpening(g, at, s) {
  const { x, y, w, h } = at.box([588, 352, 1306, 422]);
  g.fillStyle = C.back;
  roundRect(g, x, y, w, h, at.len(18));
  g.fill();
  knob(g, ...at.knob([625, 375, 12]));
  void s;
}

function blindFlyingPlate(g, at, L, s) {
  const { x, y, w, h } = at.box(L.boxes.blindFlying);
  const [, apex] = at.xy([942, 345]);
  const k = at.len(24);
  const path = (dx, dy) => {
    g.beginPath();
    g.moveTo(x + dx, y + k + dy);
    g.quadraticCurveTo(x + dx, y + dy, x + k + dx, y + dy - at.len(4));
    g.quadraticCurveTo(x + w / 2 + dx, 2 * apex - y + dy, x + w - k + dx, y + dy - at.len(4));
    g.quadraticCurveTo(x + w + dx, y + dy, x + w + dx, y + k + dy);
    g.lineTo(x + w + dx, y + h - k + dy);
    g.quadraticCurveTo(x + w + dx, y + h + dy, x + w - k + dx, y + h + dy);
    g.lineTo(x + k + dx, y + h + dy);
    g.quadraticCurveTo(x + dx, y + h + dy, x + dx, y + h - k + dy);
    g.closePath();
  };
  g.fillStyle = 'rgba(0,0,0,0.45)';
  path(at.len(4), at.len(6));
  g.fill();
  g.fillStyle = C.plate;
  path(0, 0);
  g.fill();
  g.strokeStyle = C.plateEdge;
  g.lineWidth = Math.max(1, at.len(2.5));
  g.stroke();
  // The two light lamp glasses at its foot, the lamp-test knob and the small screws.
  for (const p of [[610, 870], [1268, 872]]) {
    const [cx, cy] = at.xy(p);
    g.fillStyle = '#c9c9c9';
    g.beginPath();
    g.arc(cx, cy, at.len(15), 0, Math.PI * 2);
    g.fill();
  }
  knob(g, ...at.knob(L.knobs.lampTest), '#55554f');
  for (const p of [[840, 640], [1010, 640], [840, 872], [1010, 872], [1010, 425]]) screw(g, ...at.xy(p), s * 0.75);
}

function navLights(g, at, L, s) {
  const b = at.box(L.boxes.navLights);
  // The NAV. LIGHTS tab above it (partly behind the flap lever).
  const tab = at.box([440, 200, 520, 222]);
  g.fillStyle = '#151515';
  g.fillRect(tab.x, tab.y, tab.w, tab.h);
  text(g, 'NAV. LIGHTS', tab.x + at.len(6), tab.y + tab.h / 2, at.len(11), C.white, { bold: true, align: 'left' });
  plate(g, b, s, { colour: '#262626' });
  const [cx, cy] = at.xy([427, 275]);
  text(g, 'OFF', cx + at.len(8), cy - at.len(22), at.len(10));
  text(g, 'ON', cx, cy + at.len(27), at.len(10));
  for (const dx of [-24, 24]) {
    g.fillStyle = '#6e5a2a';
    g.beginPath();
    g.arc(cx + at.len(dx), cy, at.len(3), 0, Math.PI * 2);
    g.fill();
  }
  // The toggle, up (on), on its round boss.
  knob(g, cx, cy + at.len(4), at.len(9));
  g.fillStyle = '#0c0c0c';
  roundRect(g, cx - at.len(6), cy - at.len(18), at.len(12), at.len(22), at.len(5));
  g.fill();
}

function flapPlacard(g, at, L) {
  const b = at.box(L.boxes.flapPlacard);
  g.fillStyle = '#141414';
  roundRect(g, b.x, b.y, b.w, b.h, at.len(4));
  g.fill();
  const lines = ['FLAPS MUST NOT BE', 'DOWN OR LOWERED', 'AT SPEEDS ABOVE', '140 IAS'];
  text(g, 'WARNING', b.x + b.w / 2, b.y + b.h * 0.14, at.len(8.5), C.red, { bold: true });
  lines.forEach((t, i) => text(g, t, b.x + b.w / 2, b.y + b.h * (0.32 + i * 0.18), at.len(8.5), C.white, { bold: i === 3 }));
}

/** The flap lever: its paddle up (UP) with the flaps up, swung down (DOWN) with them down. */
function flapLever(g, at, L, v) {
  const b = at.box(L.boxes.flapLever);
  // The pipe to the right.
  const pipe = at.box([545, 280, 600, 315]);
  g.fillStyle = '#121212';
  roundRect(g, pipe.x, pipe.y, pipe.w, pipe.h, at.len(8));
  g.fill();
  const metal = g.createLinearGradient(b.x, 0, b.x + b.w, 0);
  metal.addColorStop(0, '#9c9c98');
  metal.addColorStop(0.5, '#e4e4e0');
  metal.addColorStop(1, '#8c8c88');
  g.fillStyle = metal;
  roundRect(g, b.x, b.y, b.w, b.h, at.len(6));
  g.fill();
  const [cx, cy] = at.xy([517, 297]);
  g.fillStyle = '#c8c8c4';
  g.beginPath();
  g.arc(cx, cy, at.len(22), 0, Math.PI * 2);
  g.fill();
  // The stem and the paddle with its word: upright for UP, tilted over to the right for DOWN (there is no room below
  // the housing for it to swing down, the oxygen regulator being there).
  const down = (v.flaps ?? 0) > 0.05;
  g.save();
  g.translate(cx, cy);
  g.rotate(down ? 0.6 : 0);
  g.fillStyle = '#d6d6d2';
  g.fillRect(-at.len(6), -at.len(75), at.len(12), at.len(75));
  g.fillStyle = '#ecece8';
  g.beginPath();
  g.ellipse(0, -at.len(88), at.len(30), at.len(24), 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#a8a8a4';
  g.lineWidth = Math.max(1, at.len(2));
  g.stroke();
  text(g, down ? 'DOWN' : 'UP', 0, -at.len(88), at.len(down ? 13 : 20), '#b4b4b0', { bold: true });
  g.restore();
}

function oxygenBox(g, at, L, s) {
  const b = at.box(L.boxes.oxygen);
  plate(g, b, s, { colour: '#2a2a2a' });
  const cx = b.x + b.w / 2;
  text(g, 'ON CABINS EXPLOSIVE DO NOT SMOKE', cx, b.y + at.len(10), at.len(7), C.red, { bold: true });
  text(g, 'OXYGEN REGULATOR MARK VIIIC', cx, b.y + at.len(20), at.len(9.5), C.white, { bold: true });
  text(g, 'REF Nº 6D/513', cx, b.y + at.len(31), at.len(6.5));
  const [dx] = at.xy([340, 0]);
  const [sx] = at.xy([473, 0]);
  text(g, 'DELIVERY', dx, b.y + at.len(46), at.len(10));
  text(g, 'ALT thousands of FEET', dx, b.y + at.len(59), at.len(9.5));
  text(g, 'OXYGEN', sx, b.y + at.len(46), at.len(10));
  text(g, 'SUPPLY AVAILABLE', sx, b.y + at.len(59), at.len(9.5));
}

/** The undercarriage indicator, with its night blind on top. */
function gearIndicator(g, at, L, v, s) {
  const blind = at.box([382, 548, 512, 568]);
  g.fillStyle = '#1a1a1a';
  roundRect(g, blind.x, blind.y, blind.w, blind.h, at.len(4));
  g.fill();
  text(g, 'PULL DOWN FOR NIGHT USE', blind.x + blind.w / 2, blind.y + blind.h / 2, at.len(8.5), C.white, { bold: true });
  knob(g, ...at.knob(L.knobs.nightBlind));
  const body = at.box([395, 568, 515, 708]);
  g.fillStyle = '#242424';
  roundRect(g, body.x, body.y, body.w, body.h, at.len(8));
  g.fill();
  const state = gearLampState(v);
  const window = (box, word, lit, on, off, glow) => {
    const w = at.box(box);
    g.fillStyle = lit ? glow : '#0b0b0a';
    g.fillRect(w.x, w.y, w.w, w.h);
    text(g, word, w.x + w.w / 2, w.y + w.h / 2, w.h * 0.62, lit ? on : off, { bold: true });
  };
  window([408, 588, 505, 625], 'UP', state === 'red', '#ff2e1e', '#4a1410', '#1a0606');
  window([408, 652, 505, 690], 'DOWN', state === 'green', '#d6e43e', '#3c3e20', '#1c2008');
  knob(g, ...at.knob([448, 637, 7]), '#8a8c90');
  text(g, 'CHASSIS', body.x + body.w / 2, body.y + body.h - at.len(8), at.len(6.5), '#9a9a96');
  void s;
}

function fsGearBox(g, at, L, s) {
  const b = at.box(L.boxes.fsGear);
  plate(g, b, s, { colour: '#2a2a2a' });
  const blank = at.box(L.boxes.blankPlate);
  g.fillStyle = '#1d1d1d';
  g.fillRect(blank.x, blank.y, blank.w, blank.h);
  g.strokeStyle = '#3a3a3a';
  g.lineWidth = Math.max(1, at.len(1.5));
  g.beginPath();
  g.moveTo(blank.x + blank.w * 0.55, blank.y + blank.h * 0.3);
  g.lineTo(blank.x + blank.w * 0.45, blank.y + blank.h * 0.6);
  g.stroke();
  const [lx, ly] = at.xy([1425, 0]);
  const [tx] = at.xy([1472, 0]);
  void ly;
  text(g, 'F.S. GEAR', lx, at.xy([0, 520])[1], at.len(10.5), C.white, { bold: true });
  text(g, 'WARNING', lx, at.xy([0, 533])[1], at.len(7.5));
  text(g, 'M.S.', tx, at.xy([0, 528])[1], at.len(7.5));
  lens(g, ...at.knob(L.knobs.fsLamp), '#b0140e', false);
  ['NO DOT', 'TAKE OFF', 'IF LIGHT', 'IS ON'].forEach((t, i) => text(g, t, lx, at.xy([0, 605 + i * 9])[1], at.len(7)));
  ['AUTO', 'NORMAL', 'POSITION'].forEach((t, i) => text(g, t, tx, at.xy([0, 605 + i * 9])[1], at.len(7)));
  const [sx, sy] = at.xy([1472, 572]);
  knob(g, sx, sy, at.len(14), '#202020');
  g.fillStyle = '#060606';
  roundRect(g, sx - at.len(4), sy - at.len(12), at.len(8), at.len(16), at.len(3));
  g.fill();
}

function voltmeterBox(g, at, L, s) {
  const b = at.box(L.boxes.voltmeter);
  plate(g, b, s, { colour: '#252525', rad: at.len(12), inset: 1.4 });
  const [cx, cy] = at.xy([1223, 172]);
  const f = at.len(58);
  g.fillStyle = C.face;
  g.beginPath();
  g.arc(cx, cy, f, Math.PI * 1.08, Math.PI * 1.92);
  g.lineTo(cx + f * 0.8, cy + at.len(14));
  g.lineTo(cx - f * 0.8, cy + at.len(14));
  g.closePath();
  g.fill();
  text(g, 'VOLTS', cx, cy - f * 0.72, at.len(8), C.white, { bold: true });
  // Scale 0-20 V over the arc; the needle at the normal 14 V (static).
  const angle = (volts) => -0.8 + (volts / 20) * 1.6;
  g.strokeStyle = C.white;
  for (let k = 0; k <= 20; k += 1) {
    const a = angle(k);
    g.lineWidth = Math.max(1, at.len(k % 5 === 0 ? 2 : 1));
    g.beginPath();
    g.moveTo(cx + Math.sin(a) * f * 0.62, cy - Math.cos(a) * f * 0.62);
    g.lineTo(cx + Math.sin(a) * f * (k % 5 === 0 ? 0.5 : 0.55), cy - Math.cos(a) * f * (k % 5 === 0 ? 0.5 : 0.55));
    g.stroke();
    if (k % 10 === 0) text(g, String(k), cx + Math.sin(a) * f * 0.75, cy - Math.cos(a) * f * 0.75, at.len(7));
  }
  const a = angle(14);
  g.strokeStyle = C.white;
  g.lineWidth = Math.max(1, at.len(2));
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx + Math.sin(a) * f * 0.62, cy - Math.cos(a) * f * 0.62);
  g.stroke();
  text(g, 'A.M. REF. 5U/1846', cx, cy + at.len(6), at.len(5.5), '#cfcfcf');
  knob(g, ...at.knob([1225, 200, 7]), '#d8d8d4');
}

function magnetos(g, at, L, s) {
  const b = at.box(L.boxes.magnetos);
  plate(g, b, s, { colour: '#262626' });
  const [x1] = at.xy([137, 0]);
  const [x2] = at.xy([170, 0]);
  const y = (py) => at.xy([0, py])[1];
  text(g, 'MAGNETO', b.x + b.w / 2, y(800), at.len(9), C.white, { bold: true });
  for (const [x, n] of [[x1, 'Nº 1'], [x2, 'Nº 2']]) {
    text(g, n, x, y(812), at.len(7.5), C.white, { bold: true });
    text(g, 'ON', x, y(825), at.len(7.5), C.white, { bold: true });
    text(g, 'OFF', x, y(882), at.len(7.5), C.white, { bold: true });
    // The switch, on (up).
    const grad = g.createLinearGradient(x - at.len(8), 0, x + at.len(8), 0);
    grad.addColorStop(0, '#6c6c6a');
    grad.addColorStop(0.5, '#d0d0cc');
    grad.addColorStop(1, '#6c6c6a');
    g.fillStyle = grad;
    roundRect(g, x - at.len(5), y(835), at.len(10), at.len(26), at.len(5));
    g.fill();
    knob(g, x, y(862), at.len(9), '#7a7a78');
  }
}

function placards(g, at, L) {
  const note = at.box(L.boxes.pumpNote);
  g.fillStyle = '#151515';
  roundRect(g, note.x, note.y, note.w, note.h, at.len(3));
  g.fill();
  ['NOTE', 'FUEL PUMP MUST', 'BE SWITCHED OFF', 'WHEN IGNITION IS', 'OFF'].forEach((t, i) => {
    text(g, t, note.x + note.w / 2, note.y + note.h * (0.15 + i * 0.18), at.len(i ? 7.5 : 9), C.white, { bold: !i });
  });
  // Compass deviation cards: the course and its deviation, in a frame.
  const card = (box, rows) => {
    const b = at.box(box);
    g.fillStyle = '#141414';
    g.fillRect(b.x - at.len(4), b.y - at.len(4), b.w + at.len(8), b.h + at.len(8));
    g.fillStyle = '#e4dfd2';
    g.fillRect(b.x, b.y, b.w, b.h);
    g.strokeStyle = '#555';
    g.lineWidth = Math.max(0.5, at.len(0.8));
    rows.forEach((row, i) => {
      const ry = b.y + b.h * (0.16 + i * 0.105);
      g.beginPath();
      g.moveTo(b.x + b.w * 0.05, ry + b.h * 0.05);
      g.lineTo(b.x + b.w * 0.95, ry + b.h * 0.05);
      g.stroke();
      text(g, row, b.x + b.w * 0.08, ry, at.len(7), '#222', { align: 'left' });
    });
  };
  card(L.boxes.cardLeft, ['FOR STEER', 'N    0°', 'N.E. 45°', 'E   90°', 'S.E. 135°', 'S  180°', 'S.W. 225°', 'W  270°']);
  card(L.boxes.cardRight, ['COMPASS CARD', 'Magnetos ...', 'Compass ...', 'Swung ...', 'Date ...', '', 'Signed ...', '']);
}

function bottomRow(g, at, L) {
  for (const [name, word] of [['floodPort', 'PORT'], ['floodStarboard', "ST'B'D."]]) {
    const [x, y, r] = at.knob(L.knobs[name]);
    knob(g, x, y, r);
    g.strokeStyle = C.white;
    g.lineWidth = Math.max(1, at.len(1.5));
    g.beginPath();
    g.arc(x, y, r * 0.65, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke();
    text(g, 'ON', x - r * 0.45, y - r * 0.15, at.len(5.5), C.white);
    text(g, 'OFF', x + r * 0.45, y - r * 0.15, at.len(5.5), C.white);
    text(g, word, x, y + r + at.len(14), at.len(11.5), C.white);
  }
  text(g, 'FLOOD LIGHTS', ...at.xy([930, 1028]), at.len(11.5), C.white);
  for (const [name, left, right] of [['boostCoil', 'BOOST', 'COIL'], ['starter', 'STARTER', 'ENGINE']]) {
    const [x, y, r] = at.knob(L.knobs[name]);
    g.fillStyle = '#1a1a1a';
    roundRect(g, x - r * 1.25, y - r * 1.5, r * 2.5, r * 3.2, r * 0.35);
    g.fill();
    knob(g, x, y - r * 0.1, r, '#262626');
    g.fillStyle = '#3a3a3a';
    g.fillRect(x - r * 0.7, y + r * 0.9, r * 1.4, r * 0.6);
    [...left].forEach((ch, i) => text(g, ch, x - r * 1.45, y - r * 1.2 + i * r * 0.42, at.len(6.5), C.white));
    [...right].forEach((ch, i) => text(g, ch, x + r * 1.45, y - r * 1.2 + i * r * 0.42, at.len(6.5), C.white));
  }
}

function fuelFittings(g, at, L, s) {
  // The bottom-tank pressure button.
  const [bx, by, br] = at.knob(L.knobs.bottomTank);
  g.strokeStyle = '#c9a65a';
  g.lineWidth = br * 0.35;
  g.beginPath();
  g.arc(bx, by, br * 0.82, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = '#121212';
  g.beginPath();
  g.arc(bx, by, br * 0.62, 0, Math.PI * 2);
  g.fill();
  text(g, 'BOTT', bx, by + br + at.len(10), at.len(6.5));
  text(g, 'TANK', bx, by + br + at.len(18), at.len(6.5));
  // The fuel pressure warning lamp in its pointed steel bezel.
  const w = at.box(L.boxes.fuelWarning);
  const [lx, ly, lr] = at.knob(L.knobs.fuelLamp);
  const steel = g.createLinearGradient(w.x, 0, w.x + w.w, 0);
  steel.addColorStop(0, '#6a6e72');
  steel.addColorStop(0.5, '#c4c8cc');
  steel.addColorStop(1, '#5a5e62');
  g.fillStyle = steel;
  g.beginPath();
  g.moveTo(lx, w.y);
  g.quadraticCurveTo(w.x + w.w * 1.1, ly, lx, w.y + w.h);
  g.quadraticCurveTo(w.x - w.w * 0.1, ly, lx, w.y);
  g.fill();
  lens(g, lx, ly, lr, '#c84a16', false);
  ['FUEL PRESSURE', 'WARNING'].forEach((t, i) => text(g, t, lx, w.y + w.h + at.len(10 + i * 8), at.len(6)));
  void s;
}
