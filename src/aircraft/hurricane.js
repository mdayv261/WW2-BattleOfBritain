// Hawker Hurricane Mk I (Merlin III, metal wings, Rotol constant-speed airscrew, 100-octane fuel).
// Every number has a row, keyed by its path, in docs/AIRCRAFT_DATA.md, section
// "Hawker Hurricane Mk I". SI units: m, m^2, kg, kg m^2, rad, N, Pa, s.
import { UNIT } from '../core/constants.js';

const DEG = UNIT.DEG;
const RPM = UNIT.RPM;

export const hurricane = {
  id: 'hurricane',
  name: 'Hurricane Mk I',
  side: 'RAF',
  engine: 'merlin3',
  geometry: { span: 12.192, wingArea: 23.97, mac: 2.141, length: 9.576 },
  mass: { flying: 2921, ixx: 6783, iyy: 9670, izz: 13150 },
  aero: {
    alphaZeroLift: -5 * DEG,
    clMax: 1.41,
    clMaxFlaps: 2.14,
    cd0: 0.025,
    oswald: 0.8,
    flapCd: 0.08,
    gearCd: 0.02,
    radiatorCd: 0.004,
    dihedral: 3.5 * DEG,
    slipstreamWing: 0.243,
    staticMargin: 0.05,
    cmZero: 0.02,
    cmq: -12,
    elevatorCm: 0.2,
    trimCm: 0.03,
    flapCm: -0.02,
    aileronCl: 0.0313,
    adverseYaw: -0.00313,
    cnBeta: 0.07,
    cnr: -0.1,
    rudderCn: 0.06,
    cyBeta: -0.6,
    swirl: 0.15,
    rollRig: 0.003,
    yawRig: 0.0015,
    stallBias: 0,
  },
  controls: { pitchHinge: 0.03, rollHinge: 0.0297, yawHinge: 0.06, flapTime: 5, gearTime: 6 },
  propeller: {
    type: 'constantSpeed',
    diameter: 3.454,
    gearRatio: 0.477,
    rotation: 1,
    betaMin: (23 + 20 / 60) * DEG,
    betaMax: (58 + 20 / 60) * DEG,
    inertia: 50,
    governorGain: 3,
    pitchRate: 0.17,
    rpmMin: 1800 * RPM,
    rpmMax: 3000 * RPM,
  },
  slats: null,
};
