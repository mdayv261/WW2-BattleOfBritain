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
    cd0: 0.0183,
    oswald: 0.8,
    flapCd: 0.07,
    gearCd: 0.02,
    radiatorCd: 0.004,
    washout: 2.1 * DEG,
    dihedral: 6 * DEG,
    slipstreamWing: 0.196, // fraction of the wing in the slipstream
    staticMargin: 0.02,
    cmZero: 0.01,
    cmq: -12,
    elevatorCm: 0.17,
    trimCm: 0.03,
    flapCm: -0.02,
    aileronCl: 0.0434,
    adverseYaw: -0.008,
    cnBeta: 0.07,
    cnr: -0.1,
    rudderCn: 0.06,
    cyBeta: -0.6,
    swirl: 0.15,
    rollRig: 0.0018,
    yawRig: 0.00092,
    stallBias: 0,
    rudderTrimCn: 0.02, // yaw moment of the rudder trim tab at full travel
  },
  controls: {
    pitchHinge: 0.0434, rollHinge: 0.035, yawHinge: 0.06, flapTime: 5, gearTime: 6,
    flapStops: 1, // up or fully down only
    flapTravel: 85 * DEG, // fully down
    flapTakeoff: 0, // flap setting for take-off (fraction of travel)
    flapLanding: 1, // and for landing
    elevatorUp: 29 * DEG, // elevator travel, full up (display and checks; the moments use aero.elevatorCm)
    trimTime: 8, // s: elevator trim from one end to the other
  },
  // Undercarriage and ground contact (Phase 2). Positions are from the centre of gravity in body axes
  // (+x forward, +y up, +z right), wheels with their legs extended, measured from NACA's scaled drawing.
  gear: {
    main: { x: 0.26, y: -1.6, z: 0.889, radius: 0.31 },
    tail: { x: -6.01, y: -0.523, radius: 0.09, castor: 1 },
    groundAngle: 11.2 * DEG, // thrust line to the ground, sitting on all three wheels
    mainDeflection: 0.1, // m: how far each main leg and tyre squash under the parked weight
    tailDeflection: 0.06,
    dampingRatio: 0.6,
    brake: 0.3, // most braking force as a fraction of the wheel's load
  },
  // Points that must not touch the ground (a crash if they do).
  // Engine cooling (Phase 5, D62). Estimates: the temperatures each engine settles at, used to solve the radiator's
  // conductance. Climb: the normal rating's sea-level power at the model's best-climb speed, radiator open. Cruise: 60%
  // of it at 100 m/s, radiator closed. Time constants of the coolant and oil, s.
  cooling: {
    climb: { eas: 60.6, power: 1, coolant: 110, oil: 85 },
    cruise: { eas: 100, power: 0.6, coolant: 90 },
    timeConstant: { coolant: 120, oil: 240 },
  },
  // Structural limits (Phase 5, D61-D62): g past `damage` wrinkles the airframe; at `fail` the wings fail.
  limits: {
    g: { damage: 9, fail: 13 },
    diveEas: 201.2, // m/s: 450 mph IAS (S6); past it, flutter damages the control surfaces
  },
  contacts: {
    leftTip: { x: -0.3, y: 0.04, z: -5.62 },
    rightTip: { x: -0.3, y: 0.04, z: 5.62 },
    nose: { x: 1.6, y: -0.55, z: 0 },
    belly: { x: 0, y: -0.97, z: 0 },
    tail: { x: -5.7, y: -0.36, z: 0 },
  },
  propHub: { x: 2.18, y: 0 },
  // Reflector gunsight: type and the angular diameter of its ring (an estimate, see AIRCRAFT_DATA.md).
  sight: { type: 'Barr & Stroud GM 2', ringMils: 100 },
  eye: { x: -1.39, y: 0.48 },
  propeller: {
    type: 'constantSpeed',
    diameter: 3.277,
    gearRatio: 0.477,
    rotation: 1, // +1: clockwise seen from the cockpit
    betaMin: (23 + 20 / 60) * DEG,
    betaMax: (58 + 20 / 60) * DEG,
    solidity: 1.119, // blade width relative to the NACA 640 propeller (fitted to the climb)
    inertia: 35, // rotating inertia at propeller speed (rpm changes)
    gyroInertia: 20, // net gyroscopic inertia at propeller speed
    governorGain: 3,
    pitchRate: 0.17,
    rpmMin: 1800 * RPM, // crankshaft
    rpmMax: 3000 * RPM,
  },
  slats: null,
};
