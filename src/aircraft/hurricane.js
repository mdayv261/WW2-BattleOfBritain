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
    cd0: 0.0249,
    oswald: 0.8,
    flapCd: 0.08,
    gearCd: 0.02,
    radiatorCd: 0.004,
    washout: 1 * DEG,
    dihedral: 3.5 * DEG,
    slipstreamWing: 0.196,
    staticMargin: 0.05,
    cmZero: 0.02,
    cmq: -12,
    elevatorCm: 0.2,
    trimCm: 0.03,
    flapCm: -0.02,
    aileronCl: 0.0389,
    adverseYaw: -0.008,
    cnBeta: 0.07,
    cnr: -0.1,
    rudderCn: 0.06,
    cyBeta: -0.6,
    swirl: 0.15,
    rollRig: 0.0021,
    yawRig: 0.00116,
    stallBias: -0.01,
  },
  controls: {
    pitchHinge: 0.0609, rollHinge: 0.0297, yawHinge: 0.06, flapTime: 5, gearTime: 6,
    flapStops: 4, // hydraulic flaps that can be stopped part-way
    trimTime: 8, // s: elevator trim from one end to the other
  },
  // Undercarriage and ground contact (Phase 2). Positions are from the centre of gravity in body axes
  // (+x forward, +y up, +z right), wheels with their legs extended, measured from NACA's scaled drawing.
  gear: {
    main: { x: 0.25, y: -1.752, z: 1.194, radius: 0.29 },
    tail: { x: -5.54, y: -0.828, radius: 0.115, castor: 1 },
    groundAngle: 10.2 * DEG, // thrust line to the ground, sitting on all three wheels
    mainDeflection: 0.1,
    tailDeflection: 0.06,
    dampingRatio: 0.6,
    brake: 0.3,
  },
  contacts: {
    leftTip: { x: -0.3, y: -0.26, z: -6.1 },
    rightTip: { x: -0.3, y: -0.26, z: 6.1 },
    nose: { x: 1.55, y: -0.55, z: 0 },
    belly: { x: -1.08, y: -1.17, z: 0 },
    tail: { x: -5.4, y: -0.78, z: 0 },
  },
  propHub: { x: 2.22, y: 0 },
  eye: { x: -0.89, y: 0.65 },
  propeller: {
    type: 'constantSpeed',
    diameter: 3.454,
    gearRatio: 0.477,
    rotation: 1,
    betaMin: (23 + 20 / 60) * DEG,
    betaMax: (58 + 20 / 60) * DEG,
    inertia: 38, // rotating inertia at propeller speed (rpm changes)
    gyroInertia: 22, // net gyroscopic inertia at propeller speed
    governorGain: 3,
    pitchRate: 0.17,
    rpmMin: 1800 * RPM,
    rpmMax: 3000 * RPM,
  },
  slats: null,
};
