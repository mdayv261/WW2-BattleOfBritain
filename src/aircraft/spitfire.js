// Supermarine Spitfire Mk I (Merlin III, Rotol constant-speed airscrew, 100-octane fuel).
// Every number has a row, keyed by its path, in docs/AIRCRAFT_DATA.md, section
// "Supermarine Spitfire Mk I". SI units: m, m^2, kg, kg m^2, rad, N, Pa, s.
import { UNIT } from '../core/constants.js';

const DEG = UNIT.DEG;
const RPM = UNIT.RPM;

export const spitfire = {
  id: 'spitfire',
  name: 'Spitfire Mk I',
  side: 'RAF',
  engine: 'merlin3',
  geometry: { span: 11.252, wingArea: 22.48, mac: 2.159, length: 9.119 },
  mass: { flying: 2744, ixx: 5429, iyy: 8238, izz: 10820 },
  aero: {
    alphaZeroLift: -3.5 * DEG, // body axis
    clMax: 1.18, // power off, flaps up
    clMaxFlaps: 1.51, // power off, flaps and undercarriage down
    cd0: 0.0187,
    oswald: 0.8,
    flapCd: 0.07,
    gearCd: 0.02,
    radiatorCd: 0.004,
    dihedral: 6 * DEG,
    slipstreamWing: 0.218, // fraction of the wing in the slipstream
    staticMargin: 0.02,
    cmZero: 0.01,
    cmq: -12,
    elevatorCm: 0.17,
    trimCm: 0.03,
    flapCm: -0.02,
    aileronCl: 0.0315,
    adverseYaw: -0.00315,
    cnBeta: 0.07,
    cnr: -0.1,
    rudderCn: 0.06,
    cyBeta: -0.6,
    swirl: 0.15,
    rollRig: 0.0018,
    yawRig: 0.00093,
    stallBias: 0,
  },
  controls: { pitchHinge: 0.03, rollHinge: 0.035, yawHinge: 0.06, flapTime: 5, gearTime: 6 },
  propeller: {
    type: 'constantSpeed',
    diameter: 3.277,
    gearRatio: 0.477,
    rotation: 1, // +1: clockwise seen from the cockpit
    betaMin: (23 + 20 / 60) * DEG,
    betaMax: (58 + 20 / 60) * DEG,
    solidity: 1.117, // blade width relative to the NACA 640 propeller (fitted to the climb)
    inertia: 50,
    governorGain: 3,
    pitchRate: 0.17,
    rpmMin: 1800 * RPM, // crankshaft
    rpmMax: 3000 * RPM,
  },
  slats: null,
};
