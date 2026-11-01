// The flight HUD of the outside views (D97): with the camera outside the aircraft (chase, fixed or orbit), the panel is
// hidden and a translucent column on the right of the screen gives the flight and engine readings in the side's units
// (RAF mph, feet, lb/sq in boost; Luftwaffe km/h, metres, ata): airspeed and altitude, heading and climb, throttle and
// boost, rpm with the rpm lever or blade pitch, flaps, undercarriage and trim, coolant temperature and rounds left.

import { Vector3 } from 'three';
import { speedText, altitudeText, manifoldText, rpmText, degText, headingOf, climbText } from './units.js';
import { groupRounds } from '../weapons/guns.js';
import { UNIT } from '../core/constants.js';

/** The undercarriage as the HUD reads it: UP, DN, or moving. */
export const gearText = (gear) => (gear > 0.99 ? 'DN' : gear < 0.01 ? 'UP' : 'moving');

/** The HUD's lines for the simulation (pure: used by the HUD and the tests). */
export function hudLines(sim) {
  const { ac, plane, input } = sim;
  const d = plane.last;
  const raf = ac.side === 'RAF';
  const heading = Math.round(headingOf(new Vector3(1, 0, 0).applyQuaternion(plane.body.quaternion)));
  const pitch = ac.propeller.type === 'constantSpeed' ? `LEVER ${Math.round(input.rpm * 100)}%` : `PITCH ${degText(plane.beta)}`;
  const flaps = Math.round((plane.surfaces.flaps * ac.controls.flapTravel) / UNIT.DEG);
  const trim = Math.round(input.trim * 100);
  const lines = [
    `IAS   ${speedText(ac, d.eas)}`,
    `ALT   ${altitudeText(ac, d.altitude)}`,
    `HDG   ${String(heading % 360).padStart(3, '0')}°`,
    `CLIMB ${climbText(ac, plane.body.velocity.y)}`,
    '',
    `THR   ${Math.round(input.throttle * 100)}%`,
    `${raf ? 'BOOST' : 'ATA  '} ${manifoldText(ac, d.map)}`,
    `RPM   ${rpmText(plane.omega).replace(' rpm', '')}`,
    `      ${pitch}`,
    `COOL  ${Math.round(plane.engines[0].heat.coolant)} °C`,
    '',
    `FLAPS ${flaps}°`,
    `GEAR  ${gearText(plane.surfaces.gear)}`,
    `TRIM  ${trim > 0 ? '+' : ''}${trim}%`,
  ];
  const rounds = groupRounds(sim.armament ?? []);
  if (rounds.mg || rounds.cannon) lines.push('');
  if (rounds.mg) lines.push(`MG    ${rounds.mg.rounds}`);
  if (rounds.cannon) lines.push(`CANN  ${rounds.cannon.rounds}`);
  return lines;
}

export class FlightHud {
  constructor() {
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:fixed;right:16px;top:50%;transform:translateY(-50%);display:none;pointer-events:none;'
      + 'background:rgba(8,16,10,0.45);color:#a8f0a0;font:bold 17px/1.35 ui-monospace,Menlo,monospace;padding:12px 16px;'
      + 'border:1px solid rgba(168,240,160,0.35);border-radius:6px;white-space:pre;text-shadow:0 0 4px rgba(0,0,0,0.6);';
    document.body.appendChild(this.el);
  }

  /** Shows the HUD (in the outside views) with the present readings, or hides it. */
  update(sim, show) {
    this.el.style.display = show ? 'block' : 'none';
    if (show) this.el.textContent = hudLines(sim).join('\n');
  }
}
