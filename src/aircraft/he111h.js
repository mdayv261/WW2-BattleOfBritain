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
    rollRig: -0.0007952, // solved by npm run fit:rig (D73)
    yawRig: -0.0002062, // solved by npm run fit:rig (D73)
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
  // Engine cooling (Phase 5, D62). Estimates: the temperatures each engine settles at, used to solve the radiator's
  // conductance. Climb: the normal rating's sea-level power at the model's best-climb speed, radiator open. Cruise: 60%
  // of it at 100 m/s, radiator closed. Time constants of the coolant and oil, s.
  cooling: {
    climb: { eas: 57.2, power: 1, coolant: 105, oil: 95 },
    cruise: { eas: 100, power: 0.6, coolant: 85 },
    timeConstant: { coolant: 120, oil: 240 },
  },
  // Structural limits (Phase 5, D61-D62): g past `damage` wrinkles the airframe; at `fail` the wings fail.
  limits: {
    g: { damage: 4.5, fail: 7 },
    diveEas: null, // no diving limit found: no flutter damage
  },
  // Hit zones (Phase 5, D68): fuselage sections [front, back] x, fuselage size, the wing's chord band and height, the
  // tail surfaces (estimates from the aircraft model, m in body axes).
  hitZones: {
    sections: { cockpit: [6.45, 4.0], fuselage: [4.0, -7.5], tail: [-7.5, -9.95] },
    halfWidth: 0.88, top: 1.0, bottom: -1.35,
    wing: { front: 2.1, back: -2.8, y: -0.8, halfThickness: 0.42 },
    tailSpan: 7.8, finTop: 2.95,
    nacelle: { halfWidth: 0.62, halfHeight: 0.72, length: 4.5 },
  },
  // Self-sealing wing tanks ("good self-sealing tanks", S38); radiators and oil coolers in the nacelles; no armour
  // modelled. Engine 0 left, 1 right.
  systems: {
    fuel: { wingInnerLeft: 'selfSealing', wingInnerRight: 'selfSealing' },
    coolant: { engineLeft: 0, engineRight: 1 },
    oil: { engineLeft: 0, engineRight: 1 },
    armour: 0,
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
