// Display units by side (CLAUDE.md, D5): RAF mph, feet and lb/sq in boost; Luftwaffe km/h, metres
// and ata. The physics is SI throughout; these functions only format numbers for the screen.

import { UNIT, ISA } from '../core/constants.js';

export function speedText(ac, v) {
  return ac.side === 'RAF' ? `${Math.round(v / UNIT.MPH)} mph` : `${Math.round(v / UNIT.KMH)} km/h`;
}

export function altitudeText(ac, h) {
  return ac.side === 'RAF' ? `${Math.round(h / UNIT.FT).toLocaleString('en-GB')} ft` : `${Math.round(h).toLocaleString('de-DE')} m`;
}

/** RAF boost is gauge pressure against the standard 14.7 lb/sq in; Luftwaffe gauges read absolute ata. */
export function manifoldText(ac, pa) {
  if (ac.side === 'RAF') {
    const boost = (pa - ISA.P0) / UNIT.PSI;
    return `${boost >= 0 ? '+' : ''}${boost.toFixed(1)} lb`;
  }
  return `${(pa / UNIT.ATA).toFixed(2)} ata`;
}

export const rpmText = (omega) => `${Math.round(omega / UNIT.RPM)} rpm`;
export const degText = (rad, digits = 1) => `${(rad / UNIT.DEG).toFixed(digits)}°`;

/** Compass heading (degrees, clockwise from north) of a world-frame direction (-Z north, +X east). */
export function headingOf(dir) {
  const deg = (Math.atan2(dir.x, -dir.z) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/** Vertical speed: RAF ft/min, Luftwaffe m/s (as on the period instruments). */
export function climbText(ac, vy) {
  return ac.side === 'RAF' ? `${Math.round((vy / UNIT.FT) * 60)} ft/min` : `${vy.toFixed(1)} m/s`;
}
