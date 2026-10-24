// Messerschmitt Bf 109 E-4 (DB 601A, VDM airscrew with manual pitch). Data mostly from the E-1/E-3
// (close variants, D14). Every number has a row, keyed by its path, in docs/AIRCRAFT_DATA.md,
// section "Messerschmitt Bf 109 E-4". SI units: m, m^2, kg, kg m^2, rad, N, Pa, s.
import { UNIT } from '../core/constants.js';

const DEG = UNIT.DEG;
const RPM = UNIT.RPM;

export const bf109e4 = {
  id: 'bf109e4',
  name: 'Bf 109 E-4',
  side: 'Luftwaffe',
  engine: 'db601a',
  geometry: { span: 9.9, wingArea: 16.4, mac: 1.71, length: 8.76 },
  mass: { flying: 2608, ixx: 3994, iyy: 7225, izz: 8627 },
  aero: {
    alphaZeroLift: -2.5 * DEG,
    clMax: 1.47, // slats open
    clMaxFlaps: 2.06,
    cd0: 0.0273,
    oswald: 0.8,
    flapCd: 0.07,
    gearCd: 0.02,
    radiatorCd: 0.004,
    dihedral: 5 * DEG,
    slipstreamWing: 0.243,
    staticMargin: 0.05,
    cmZero: 0.02,
    cmq: -12,
    elevatorCm: 0.2,
    trimCm: 0.03,
    flapCm: -0.02,
    aileronCl: 0.0314,
    adverseYaw: -0.00314,
    cnBeta: 0.07,
    cnr: -0.1,
    rudderCn: 0.06,
    cyBeta: -0.6,
    swirl: 0.15,
    rollRig: -0.003,
    yawRig: -0.0015,
    stallBias: -0.02, // left wing drops at the stall
  },
  controls: { pitchHinge: 0.0755, rollHinge: 0.0272, yawHinge: 0.06, flapTime: 8, gearTime: 8 },
  propeller: {
    type: 'manualPitch',
    diameter: 3.1,
    gearRatio: 0.6452, // engine 1.55 : propeller 1
    rotation: -1, // anticlockwise seen from the cockpit
    betaMin: 20 * DEG,
    betaMax: 55 * DEG,
    inertia: 50,
    governorGain: 3, // used only by the engine-management assist
    pitchRate: 0.07, // manual thumb-switch pitch change
    rpmMin: 1500 * RPM,
    rpmMax: 2400 * RPM,
  },
  slats: { openAlpha: 11.5 * DEG, fullAlpha: 13.75 * DEG, clMaxClosed: 1.15, rate: 4 },
};
