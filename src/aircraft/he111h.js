// Heinkel He 111 H (2 × Jumo 211F-1, Junkers VS 11 automatic airscrews). Built from the Soviet 1943 test of the
// H-6/H-11 (S29) as a close variant for the H-3 of 1940, which had less powerful engines (product owner, D40).
// AI only in the game; flyable in the test version from the outside views. Every number has a row, keyed by its
// path, in docs/AIRCRAFT_DATA.md, section "Heinkel He 111 H". SI units: m, m^2, kg, kg m^2, rad, N, Pa, s.
import { UNIT } from '../core/constants.js';

const DEG = UNIT.DEG;
const RPM = UNIT.RPM;

export const he111h = {
  id: 'he111h',
  name: 'He 111 H',
  side: 'Luftwaffe',
  engine: 'jumo211f',
  cockpit: false, // AI only: no cockpit or instrument panel
  geometry: { span: 22.6, wingArea: 87.5, mac: 3.87, length: 16.4 },
  mass: { flying: 12270, ixx: 181100, iyy: 69390, izz: 225800 },
  aero: {
    alphaZeroLift: -2.5 * DEG,
    clMax: 1.4,
    clMaxFlaps: 1.9,
    cd0: 0.0222,
    oswald: 0.7,
    flapCd: 0.08,
    gearCd: 0.012,
    radiatorCd: 0.003,
    washout: 2 * DEG,
    dihedral: 6 * DEG,
    slipstreamWing: 0.195, // fraction of each half-wing in its engine's slipstream
    staticMargin: 0.08,
    cmZero: 0.02,
    cmq: -20,
    elevatorCm: 0.2,
    trimCm: 0.03,
    flapCm: -0.02,
    aileronCl: 0.03,
    adverseYaw: -0.008,
    cnBeta: 0.08,
    cnr: -0.15,
    rudderCn: 0.04,
    cyBeta: -0.6,
    swirl: 0.08,
    rollRig: -0.00105,
    yawRig: -0.00037,
    stallBias: -0.01,
    rudderTrimCn: 0.015,
  },
  controls: {
    pitchHinge: 0.1, rollHinge: 0.06, yawHinge: 0.1, flapTime: 15, gearTime: 15,
    flapStops: 5,
    flapTravel: 50 * DEG,
    flapTakeoff: 0,
    flapLanding: 1,
    elevatorUp: 30 * DEG,
    trimTime: 15,
  },
  propeller: {
    type: 'constantSpeed', // VS 11: fully automatic
    diameter: 3.5,
    gearRatio: 0.5405, // engine 1.85 : airscrew 1
    rotation: -1,
    betaMin: 20 * DEG,
    betaMax: 55 * DEG,
    inertia: 45,
    gyroInertia: 30,
    governorGain: 3,
    pitchRate: 0.1,
    rpmMin: 1600 * RPM,
    rpmMax: 2400 * RPM,
  },
  // Airscrew hubs (body axes from the centre of gravity).
  engines: {
    left: { x: 3.0, y: 0, z: -2.95 },
    right: { x: 3.0, y: 0, z: 2.95 },
  },
  gear: {
    main: { x: 0.6, y: -2.2, z: 2.6, radius: 0.55 },
    tail: { x: -9.8, y: -0.28, radius: 0.2, castor: 1 },
    groundAngle: 12 * DEG,
    mainDeflection: 0.12,
    tailDeflection: 0.06,
    dampingRatio: 0.6,
    brake: 0.3,
  },
  contacts: {
    leftTip: { x: -0.6, y: 0.4, z: -11.3 },
    rightTip: { x: -0.6, y: 0.4, z: 11.3 },
    nose: { x: 5.8, y: -0.9, z: 0 },
    belly: { x: 0, y: -1.3, z: 0 },
    tail: { x: -9.5, y: -0.1, z: 0 },
  },
  eye: { x: 4.5, y: 0.8 },
};
