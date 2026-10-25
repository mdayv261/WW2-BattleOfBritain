// On-screen readouts for the Phase 1 test version: a small flight strip, the F3 debug overlay, the
// help panel and messages (paused, crashed). Real cockpits and instruments come in Phase 7.

import { Vector3 } from 'three';
import { speedText, altitudeText, manifoldText, rpmText, degText, headingOf, climbText } from './units.js';
import { G } from '../core/constants.js';

const HELP = `
<b>Battle of Britain 1940 — Phase 1 test flight</b>
<table>
<tr><td>Arrow up / down</td><td>stick forward (nose down) / back (nose up)</td></tr>
<tr><td>Arrow left / right</td><td>roll</td></tr>
<tr><td>Z / X</td><td>rudder left / right</td></tr>
<tr><td>W / S</td><td>throttle up / down</td></tr>
<tr><td>E / D</td><td>RAF: rpm lever up / down — Bf 109: pitch finer / coarser</td></tr>
<tr><td>T / G</td><td>trim nose up / nose down</td></tr>
<tr><td>F &nbsp; U &nbsp; O</td><td>flaps, undercarriage, radiator</td></tr>
<tr><td>Q</td><td>+12 lb boost cut-out (RAF)</td></tr>
<tr><td>A</td><td>engine assist: automatic pitch (Bf 109)</td></tr>
<tr><td>1 &nbsp; 2 &nbsp; 3</td><td>Hurricane, Spitfire, Bf 109 (restarts)</td></tr>
<tr><td>R &nbsp; P</td><td>restart, pause</td></tr>
<tr><td>V</td><td>camera: chase / fixed behind</td></tr>
<tr><td>F3 &nbsp; J &nbsp; H</td><td>debug overlay, joystick panel, this help</td></tr>
</table>
Click the page once before using the keyboard.`;

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
    this.help = panel('help', `${BOX}left:50%;top:50%;transform:translate(-50%,-50%);white-space:normal;max-width:560px;`);
    this.help.innerHTML = HELP;
    this.message = panel('message', `${BOX}left:50%;top:24px;transform:translateX(-50%);font-size:16px;display:none;`);
    this.showDebug = false;
    this.helpVisible = true;
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
    else lines.push(`Pitch ${degText(plane.beta)}${input.engineAssist ? '   ASSIST (auto pitch)' : '   manual pitch (E/D)'}`);
    if (d.cutout < 0.5) lines.push('ENGINE CUT (negative g)');
    if (extra.joystick) lines.push('Joystick connected');
    this.strip.textContent = lines.join('\n');

    if (sim.crashed) this.showMessage('Crashed — press R to restart');
    else if (sim.paused) this.showMessage('Paused — press P');
    else this.showMessage(null);

    if (this.showDebug) this.debug.textContent = this.debugText(sim, heading);
  }

  showMessage(text) {
    this.message.style.display = text ? 'block' : 'none';
    if (text) this.message.textContent = text;
  }

  debugText(sim, heading) {
    const { ac, plane, input } = sim;
    const d = plane.last;
    const kN = (n) => `${(n / 1000).toFixed(2)} kN`;
    return [
      'F3 debug',
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
    ].join('\n');
  }
}
