// On-screen readouts for the test version: a small text strip (F2), the F3 debug overlay, the help panel
// and messages (start, touchdown, landed, crashed, paused). Real cockpits come in Phase 7.

import { Vector3 } from 'three';
import { speedText, altitudeText, manifoldText, rpmText, degText, headingOf, climbText } from './units.js';
import { G } from '../core/constants.js';
import { coolantLimit } from '../physics/cooling.js';
import { groupRounds } from '../weapons/guns.js';
import { damageSummary } from '../weapons/damage.js';
import { targetBearing } from '../core/combat.js';
import { SKILLS } from '../ai/skill.js';

/** The nearest AI aircraft's line for F3 (D68, D79): type, range, where it is, hits and damage, and the last hit. */
function targetLine(sim) {
  const here = sim.plane.body.position;
  const t = sim.others.reduce((a, c) => (!a || c.plane.body.position.distanceTo(here) < a.plane.body.position.distanceTo(here) ? c : a), null);
  if (!t) return 'Target    none (Y, or 6 / 7 for AI)';
  const range = t.plane.body.position.distanceTo(sim.plane.body.position);
  const last = t.lastHit && sim.plane.time - t.lastHit.time < 3 ? `  last hit: ${t.lastHit.text}` : '';
  const { right, up } = targetBearing(sim, t);
  const deg = (a, plus, minus) => `${Math.abs(a * 180 / Math.PI).toFixed(0)}° ${a >= 0 ? plus : minus}`;
  const where = `${deg(right, 'right', 'left')} ${deg(up, 'up', 'down')}`;
  return `Target    ${t.label} (${t.side})  ${range.toFixed(0)} m  ${where}  hits ${t.plane.damage.hits}  ${damageSummary(t.plane) || 'undamaged'}${last}`;
}

/** The AI's line for F3 (D79): how many aircraft on each side, the skill and the scenario. */
function aiLine(sim) {
  const count = (side) => sim.others.filter((c) => c.side === side).length;
  return `AI        RAF ${count('RAF')}  Luftwaffe ${count('Luftwaffe')}  skill ${SKILLS[sim.skill].name}  ${sim.scenario ?? 'no scenario (6, 7)'}`;
}

/** Rounds left per firing group, e.g. "Rounds MG 2648/2672  cannon 120/120"; null for an unarmed aircraft. */
export function roundsLine(sim) {
  const groups = groupRounds(sim.armament);
  const names = { mg: 'MG', cannon: 'cannon' };
  const parts = Object.entries(groups).map(([g, c]) => `${names[g]} ${c.rounds}/${c.capacity}`);
  return parts.length ? `Rounds ${parts.join('  ')}` : null;
}

/** Coolant and oil temperatures (°C, both sides' gauges read Celsius), one pair per engine. */
function heatLine(sim) {
  const pairs = sim.plane.engines.map((e) => `${Math.round(e.heat.coolant)}/${Math.round(e.heat.oil)}`);
  return `Coolant/oil °C ${pairs.join('  ')}${sim.input.radiator ? '' : '  (radiator closed)'}`;
}

/** A warning when an engine runs past its coolant or oil limit, or has seized; null when all is well. */
export function heatWarning(sim) {
  const { plane } = sim;
  const name = (i) => (plane.engines.length > 1 ? ['Left engine', 'Right engine'][i] : 'Engine');
  for (const [i, e] of plane.engines.entries()) {
    if (e.heat.seized) return `${name(i)} seized`;
    const limit = coolantLimit(plane.engine, plane.body.position.y);
    if (e.heat.coolant > limit) return `${name(i)} overheating: coolant ${Math.round(e.heat.coolant)} °C, limit ${Math.round(limit)} °C (O opens the radiator)`;
    if (e.heat.oil > plane.engine.heat.oilLimit) return `${name(i)} oil ${Math.round(e.heat.oil)} °C, limit ${plane.engine.heat.oilLimit} °C`;
  }
  return null;
}

const HELP = `
<b>Battle of Britain 1940 — Phase 3 test flight</b>
<table>
<tr><td>Arrow up / down</td><td>stick forward (nose down) / back (nose up)</td></tr>
<tr><td>Arrow left / right</td><td>roll</td></tr>
<tr><td>Z / X</td><td>rudder left / right (steer on the ground with rudder and brakes)</td></tr>
<tr><td>B (hold)</td><td>brakes; with rudder, the brake on that side</td></tr>
<tr><td>W / S</td><td>throttle up / down</td></tr>
<tr><td>E / D</td><td>RAF: rpm lever up / down — Bf 109: pitch finer / coarser</td></tr>
<tr><td>T / G &nbsp; , / .</td><td>elevator trim nose up / down; rudder trim (Spitfire, Bf 110, He 111)</td></tr>
<tr><td>F / Shift+F</td><td>flaps down / up a stop (Spitfire: down or up)</td></tr>
<tr><td>U &nbsp; O</td><td>undercarriage, radiator</td></tr>
<tr><td>Q &nbsp; A</td><td>+12 lb boost cut-out (RAF); engine assist (Bf 109)</td></tr>
<tr><td>1 &nbsp; 2 &nbsp; 3 &nbsp; 4 &nbsp; 5</td><td>Hurricane, Spitfire, Bf 109, Bf 110, He 111 (outside views only; F2 for its readings)</td></tr>
<tr><td>L</td><td>start or stop the engine (twins: the engines K has selected); ground starts begin with engines off</td></tr>
<tr><td>K &nbsp; M</td><td>twins: levers move both engines / left / right; feather the selected engine (Bf 110)</td></tr>
<tr><td>R &nbsp; N &nbsp; P</td><td>restart; next start (ground, approach, air); pause</td></tr>
<tr><td>C &nbsp; V</td><td>cockpit view; outside views (chase, fixed, orbit)</td></tr>
<tr><td>Mouse</td><td>drag to look around; wheel to zoom; double-click to look ahead</td></tr>
<tr><td>I &nbsp; F2 &nbsp; F3</td><td>instruments, text readout, debug overlay</td></tr>
<tr><td>Space &nbsp; Enter</td><td>fire the machine guns (RAF: all eight) / the cannon</td></tr>
<tr><td>Y &nbsp; 9</td><td>target aircraft ahead (each press: the next type, then none) / a test 20 mm hit on your own aircraft</td></tr>
<tr><td>6 &nbsp; 7 &nbsp; 8 &nbsp; 0</td><td>AI: enemy fighters (each press: the next group) / a bomber formation / AI skill / clear the AI</td></tr>
<tr><td>Joystick</td><td>trigger: machine guns; thumb button: cannon; hat: look around (the panel hides while you look away); 5 / 3 trim nose up / down; 4 / 6 flaps up / down; 12 brakes; 10 cockpit view; 11 undercarriage</td></tr>
<tr><td>J &nbsp; H</td><td>joystick panel (change the buttons there), this help</td></tr>
</table>
Click the page once before using the keyboard.`;

/** One line per engine of a twin: its throttle, rpm and state, and which engines the levers move. */
function twinLines(sim) {
  const { ac, plane, input, twin } = sim;
  const names = ['Left ', 'Right'];
  const lines = plane.engines.map((e, i) => {
    const own = input.engines[i];
    const state = own.failed ? (own.feather ? '  STOPPED, FEATHERED' : '  STOPPED') : own.feather ? '  FEATHERED' : '';
    const moved = twin.selected === 'both' || twin.selected === i ? '>' : ' ';
    return `${moved} ${names[i]} throttle ${String(Math.round(own.throttle * 100)).padStart(3)}%  ${rpmText(e.omega).padStart(8)}  `
      + `${manifoldText(ac, plane.last.engines[i].map)}  pitch ${degText(e.beta)}${state}`;
  });
  return lines;
}

function panel(id, css) {
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = css;
  document.body.appendChild(el);
  return el;
}

const BOX = 'position:fixed;background:rgba(20,28,36,0.72);color:#e8edf2;font:13px/1.45 ui-monospace,Menlo,monospace;'
  + 'padding:8px 12px;border-radius:6px;pointer-events:none;white-space:pre;';

export class Hud {
  constructor() {
    this.strip = panel('strip', `${BOX}left:12px;bottom:12px;`);
    this.debug = panel('debug', `${BOX}right:12px;top:12px;display:none;`);
    this.help = panel('help', `${BOX}left:12px;top:50%;transform:translateY(-50%);white-space:normal;max-width:560px;`); // at the far left (product owner)
    this.help.innerHTML = HELP;
    this.message = panel('message', `${BOX}left:50%;top:24px;transform:translateX(-50%);font-size:16px;display:none;`);
    this.showDebug = false;
    this.helpVisible = true;
    this.strip.style.display = 'none';
  }

  toggleStrip() {
    this.strip.style.display = this.strip.style.display === 'none' ? 'block' : 'none';
  }

  toggleDebug() {
    this.showDebug = !this.showDebug;
    this.debug.style.display = this.showDebug ? 'block' : 'none';
  }

  toggleHelp(force) {
    this.helpVisible = force ?? !this.helpVisible;
    this.help.style.display = this.helpVisible ? 'block' : 'none';
  }

  update(sim, extra) {
    const { ac, plane, input } = sim;
    const d = plane.last;
    const nose = new Vector3(1, 0, 0).applyQuaternion(plane.body.quaternion);
    const heading = headingOf(nose);
    const climb = plane.body.velocity.y;
    const lines = [
      `${ac.name}`,
      `IAS ${speedText(ac, d.eas).padStart(9)}   ALT ${altitudeText(ac, d.altitude).padStart(9)}   HDG ${String(Math.round(heading)).padStart(3, '0')}°`,
      `${ac.side === 'RAF' ? 'Boost' : 'Ladedruck'} ${manifoldText(ac, d.map).padStart(9)}   ${rpmText(plane.omega).padStart(8)}   Throttle ${Math.round(input.throttle * 100)}%`,
      `Climb ${climbText(ac, climb).padStart(11)}  Trim ${(input.trim * 100).toFixed(0)}%${input.flaps ? '  FLAPS' : ''}${input.gear ? '  GEAR' : ''}${input.radiator ? '  RAD OPEN' : ''}`,
    ];
    if (ac.side === 'RAF') lines.push(`rpm lever ${Math.round(input.rpm * 100)}%${input.emergency ? '   +12 LB BOOST' : ''}`);
    else if (ac.propeller.type === 'constantSpeed') lines.push(`rpm lever ${Math.round(input.rpm * 100)}%   automatic airscrews`);
    else lines.push(`Pitch ${degText(plane.beta)}${input.engineAssist ? '   ASSIST (auto pitch)' : '   manual pitch (E/D)'}`);
    lines.push(heatLine(sim));
    const rounds = roundsLine(sim);
    if (rounds) lines.push(rounds);
    if (d.cutout < 0.5) lines.push('ENGINE CUT (negative g)');
    if (!sim.twin && input.engines?.[0]?.failed) lines.push('ENGINE STOPPED (L to start)');
    if (sim.twin) lines.push(...twinLines(sim));
    if (extra.joystick) lines.push('Joystick connected');
    this.strip.textContent = lines.join('\n');

    this.showMessage(this.messageFor(sim));

    if (this.showDebug) this.debug.textContent = this.debugText(sim, heading, extra.frame);
  }

  /** The message line: crash, pause, landing result, or what to do at the start. */
  messageFor(sim) {
    const { ac, plane } = sim;
    const g = plane.ground;
    if (sim.crashed) return `${sim.crashCause ?? g.crash.cause} — press R to restart`;
    if (sim.paused) return 'Paused — press P';
    if (sim.notice && plane.time < sim.notice.until) return sim.notice.text;
    const hot = heatWarning(sim);
    if (hot) return hot;
    if (g.onGround && g.touchdown) {
      const sink = climbText(ac, g.touchdown.sink).replace('-', '');
      const at = `touched down at ${speedText(ac, g.touchdown.speed)}, sinking ${sink}`;
      return plane.body.velocity.length() < 1 ? `Landed — ${at}` : `On the ground — ${at}`;
    }
    const allStopped = sim.input.engines?.every((e) => e.failed);
    if (g.onGround && allStopped && plane.body.velocity.length() < 1) {
      return sim.twin ? 'Engines off: press L to start both (K first to choose one)' : 'Engine off: press L to start it';
    }
    if (g.onGround && plane.time < 20 && plane.body.velocity.length() < 1) {
      return 'On the ground: open the throttle (W), keep straight with rudder, stick forward to raise the tail';
    }
    return null;
  }

  showMessage(text) {
    this.message.style.display = text ? 'block' : 'none';
    if (text) this.message.textContent = text;
  }

  debugText(sim, heading, frame) {
    const { ac, plane, input } = sim;
    const d = plane.last;
    const kN = (n) => `${(n / 1000).toFixed(2)} kN`;
    return [
      'F3 debug',
      ...(frame ? [frame] : []),
      `TAS        ${speedText(ac, d.airspeed)}   IAS ${speedText(ac, d.eas)}`,
      `Altitude   ${altitudeText(ac, d.altitude)}   heading ${heading.toFixed(0)}°`,
      `Alpha      ${degText(d.alpha)}   (L ${degText(d.alphaLeft)} R ${degText(d.alphaRight)} from zero lift)`,
      `Sideslip   ${degText(d.beta)}`,
      `Load       ${d.loadFactor.toFixed(2)} g`,
      `Engine     ${(d.power / 1000).toFixed(0)} kW   ${manifoldText(ac, d.map)}   ${rpmText(plane.omega)}`,
      `Propeller  pitch ${degText(plane.beta)}   J ${d.j.toFixed(2)}   thrust ${kN(d.thrust)}`,
      `Lift       ${kN(d.lift)}   CL ${d.cl.toFixed(3)}`,
      `Drag       ${kN(d.drag)}   CD ${d.cd.toFixed(4)}`,
      `Weight     ${kN(ac.mass.flying * G)}`,
      `Stall      L ${(d.stalledLeft * 100).toFixed(0)}%  R ${(d.stalledRight * 100).toFixed(0)}%`,
      ac.slats ? `Slats      L ${(d.slatLeft * 100).toFixed(0)}%  R ${(d.slatRight * 100).toFixed(0)}%` : 'Slats      none',
      `Surfaces   elev ${(plane.surfaces.elevator * 100).toFixed(0)}%  ail ${(plane.surfaces.aileron * 100).toFixed(0)}%  rud ${(plane.surfaces.rudder * 100).toFixed(0)}%`,
      `Stick      pitch ${(input.pitch * 100).toFixed(0)}%  roll ${(input.roll * 100).toFixed(0)}%  yaw ${(input.yaw * 100).toFixed(0)}%`,
      `Flaps ${(plane.surfaces.flaps * 100).toFixed(0)}%  gear ${(plane.surfaces.gear * 100).toFixed(0)}%  cut-out ${(d.cutout * 100).toFixed(0)}%`,
      ...plane.engines.map((e, i) => `Heat ${plane.engines.length > 1 ? ['L', 'R'][i] : ''}     coolant ${e.heat.coolant.toFixed(0)} °C (limit ${coolantLimit(plane.engine, d.altitude).toFixed(0)})  oil ${e.heat.oil.toFixed(0)} °C (limit ${plane.engine.heat.oilLimit})  wear ${(e.heat.wear * 100).toFixed(0)}%  coolant left ${(e.heat.coolantLeft * 100).toFixed(0)}%${e.heat.seized ? '  SEIZED' : ''}`),
      roundsLine(sim) ?? 'Rounds    unarmed',
      targetLine(sim),
      aiLine(sim),
      `Damage    ${damageSummary(plane) || 'none'}`,
      `Airframe  overstress ${(plane.damage.airframe * 100).toFixed(0)}%  flutter ${(plane.damage.flutter * 100).toFixed(0)}%  radiator ${sim.input.radiator ? 'open' : 'closed'}`,
    ].join('\n');
  }
}
