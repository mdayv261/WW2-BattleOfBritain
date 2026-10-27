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
    flapTravel: 80 * DEG, // fully down
    flapTakeoff: 0, // flap setting for take-off (fraction of travel)
    flapLanding: 1, // and for landing
    elevatorUp: 26 * DEG, // elevator travel, full up (display and checks; the moments use aero.elevatorCm)
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
  // Guns (Phase 5, D67): type, muzzle position in body axes (m; estimates placed on the airframe: no drawing found) and
  // rounds. Each RAF gun carries one kind of round, as Dowding's typical arrangement (S38): which gun carries which is an
  // estimate (D67). 334 rounds per gun (S1).
  harmonisation: 228.6, // m: range at which the guns' rounds cross the sight line
  guns: {
    leftInner: { type: 'browning', x: 0.78, y: -0.52, z: -2.0, rounds: 334, round: 'ball303' },
    leftSecond: { type: 'browning', x: 0.77, y: -0.51, z: -2.22, rounds: 334, round: 'deWilde303' },
    leftThird: { type: 'browning', x: 0.76, y: -0.49, z: -2.44, rounds: 334, round: 'ap303' },
    leftOuter: { type: 'browning', x: 0.75, y: -0.48, z: -2.66, rounds: 334, round: 'incendiary303' },
    rightInner: { type: 'browning', x: 0.78, y: -0.52, z: 2.0, rounds: 334, round: 'ball303' },
    rightSecond: { type: 'browning', x: 0.77, y: -0.51, z: 2.22, rounds: 334, round: 'ball303' },
    rightThird: { type: 'browning', x: 0.76, y: -0.49, z: 2.44, rounds: 334, round: 'ap303' },
    rightOuter: { type: 'browning', x: 0.75, y: -0.48, z: 2.66, rounds: 334, round: 'incendiary303' },
  },
  // Engine cooling (Phase 5, D62). Estimates: the temperatures each engine settles at, used to solve the radiator's
  // conductance. Climb: the normal rating's sea-level power at the model's best-climb speed, radiator open. Cruise: 60%
  // of it at 100 m/s, radiator closed. Time constants of the coolant and oil, s.
  cooling: {
    climb: { eas: 58.8, power: 1, coolant: 110, oil: 85 },
    cruise: { eas: 100, power: 0.6, coolant: 90 },
    timeConstant: { coolant: 120, oil: 240 },
  },
  // Structural limits (Phase 5, D61-D62): g past `damage` wrinkles the airframe; at `fail` the wings fail.
  limits: {
    g: { damage: 9, fail: 13 },
    diveEas: 174.3, // m/s: 390 mph IAS (estimate, D61); past it, flutter damages the control surfaces
  },
  // Hit zones (Phase 5, D68): fuselage sections [front, back] x, fuselage size, the wing's chord band and height, the
  // tail surfaces (estimates from the aircraft model, m in body axes).
  hitZones: {
    sections: { engine: [2.62, 0.3], cockpit: [0.3, -2.2], fuselage: [-2.2, -5.3], tail: [-5.3, -6.96] },
    halfWidth: 0.5, top: 0.8, bottom: -0.9,
    wing: { front: 0.86, back: -1.76, y: -0.64, halfThickness: 0.25 },
    tailSpan: 3.2, finTop: 1.8,
  },
  // Wing tanks covered with Linatex, the fuselage reserve tank uncovered (S38); the ventral radiator and oil cooler under
  // the cockpit; 8 mm rear armour (D61).
  systems: {
    fuel: { wingInnerLeft: 'linatex', wingInnerRight: 'linatex', cockpit: 'plain' },
    coolant: { cockpit: 0 },
    oil: { cockpit: 0 },
    armour: 0.008,
  },
  contacts: {
    leftTip: { x: -0.3, y: -0.26, z: -6.1 },
    rightTip: { x: -0.3, y: -0.26, z: 6.1 },
    nose: { x: 1.55, y: -0.55, z: 0 },
    belly: { x: -1.08, y: -1.17, z: 0 },
    tail: { x: -5.4, y: -0.78, z: 0 },
  },
  propHub: { x: 2.22, y: 0 },
  // Reflector gunsight: type and the angular diameter of its ring (an estimate, see AIRCRAFT_DATA.md).
  sight: { type: 'Barr & Stroud GM 2', ringMils: 100 },
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
