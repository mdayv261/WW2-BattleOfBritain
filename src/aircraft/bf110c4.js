// Messerschmitt Bf 110 C-4 (2 × DB 601A, fully feathering VDM airscrews with manual pitch levers). Data mostly
// from the C-2 (close variant, D14; the C-4's armour weight is a gap). Every number has a row, keyed by its
// path, in docs/AIRCRAFT_DATA.md, section "Messerschmitt Bf 110 C-4". SI units: m, m^2, kg, kg m^2, rad, N, Pa, s.
import { UNIT } from '../core/constants.js';

const DEG = UNIT.DEG;
const RPM = UNIT.RPM;

export const bf110c4 = {
  id: 'bf110c4',
  name: 'Bf 110 C-4',
  side: 'Luftwaffe',
  engine: 'db601a',
  geometry: { span: 16.2, wingArea: 38.4, mac: 2.37, length: 12.0 },
  mass: { flying: 6530, ixx: 49530, iyy: 19770, izz: 62830 },
  aero: {
    alphaZeroLift: -3 * DEG,
    clMax: 1.47, // slats open
    clMaxFlaps: 1.97,
    cd0: 0.0264,
    oswald: 0.7,
    flapCd: 0.08,
    gearCd: 0.015,
    radiatorCd: 0.0035,
    washout: 0, // taken as the Bf 109's (no twist)
    dihedral: 5 * DEG,
    slipstreamWing: 0.24, // fraction of each half-wing in its engine's slipstream
    staticMargin: 0.05,
    cmZero: 0.02,
    cmq: -15,
    elevatorCm: 0.2,
    trimCm: 0.03,
    flapCm: -0.02,
    aileronCl: 0.04,
    adverseYaw: -0.008,
    cnBeta: 0.1,
    cnr: -0.15,
    rudderCn: 0.05,
    cyBeta: -0.7,
    swirl: 0.1,
    rollRig: -0.00153,
    yawRig: -0.00059,
    stallBias: -0.01,
    rudderTrimCn: 0.015, // yaw moment of the rudder trim tabs at full travel
  },
  controls: {
    pitchHinge: 0.07, rollHinge: 0.035, yawHinge: 0.06, flapTime: 8, gearTime: 8,
    flapStops: 5, // hydraulic flaps; any position can be held (S24), the keys step 10 degrees at a time
    flapTravel: 50 * DEG,
    flapTakeoff: 0, // flap setting for take-off (fraction of travel)
    flapLanding: 1, // and for landing
    elevatorUp: 30 * DEG,
    trimTime: 10, // s: elevator trim wheel from one end to the other
  },
  propeller: {
    type: 'manualPitch',
    diameter: 3.1,
    gearRatio: 0.6452, // engine 1.55 : airscrew 1
    rotation: -1, // as the Bf 109's DB 601A (both engines turn the same way)
    betaMin: 22.5 * DEG,
    betaMax: 55 * DEG, // coarsest angle in normal use
    featherAngle: 90 * DEG, // fully feathered
    featheredDragArea: 0.06, // m^2: drag area of the stopped, feathered blades
    inertia: 35,
    gyroInertia: 25,
    governorGain: 3, // used only by the engine-management assist
    pitchRate: 0.07,
    rpmMin: 1500 * RPM,
    rpmMax: 2400 * RPM,
  },
  // Airscrew hubs (body axes from the centre of gravity): the engines' positions.
  engines: {
    left: { x: 2.3, y: 0, z: -2.45 },
    right: { x: 2.3, y: 0, z: 2.45 },
  },
  slats: { openAlpha: 12.4 * DEG, fullAlpha: 14.4 * DEG, clMaxClosed: 1.22, sectionGain: 0.3, rate: 4 },
  // Undercarriage and ground contact: main wheels under the engine nacelles, a fixed tailwheel (S24).
  gear: {
    main: { x: 0.45, y: -1.6, z: 2.3, radius: 0.42 },
    tail: { x: -7.4, y: -0.27, radius: 0.15, castor: 1 },
    groundAngle: 11 * DEG,
    mainDeflection: 0.12,
    tailDeflection: 0.06,
    dampingRatio: 0.6,
    brake: 0.3,
  },
  // Guns (Phase 5, D67): type, muzzle position in body axes (m; estimates placed on the airframe: no drawing found) and
  // rounds. Four MG 17 and two MG FF/M in the nose, clear of the airscrews; belts as D61. One 60-round drum per cannon
  // (drum changes by the radio operator come with the crew in Phase 6).
  harmonisation: 200, // m: range at which the guns' rounds cross the sight line
  guns: {
    mg17UpperLeft: { type: 'mg17', x: 4.3, y: 0.18, z: -0.1, rounds: 1000 },
    mg17UpperRight: { type: 'mg17', x: 4.3, y: 0.18, z: 0.1, rounds: 1000 },
    mg17LowerLeft: { type: 'mg17', x: 4.25, y: 0.05, z: -0.22, rounds: 1000 },
    mg17LowerRight: { type: 'mg17', x: 4.25, y: 0.05, z: 0.22, rounds: 1000 },
    cannonLeft: { type: 'mgffm', x: 3.6, y: -0.45, z: -0.15, rounds: 60 },
    cannonRight: { type: 'mgffm', x: 3.6, y: -0.45, z: 0.15, rounds: 60 },
  },
  // Engine cooling (Phase 5, D62). Estimates: the temperatures each engine settles at, used to solve the radiator's
  // conductance. Climb: the normal rating's sea-level power at the model's best-climb speed, radiator open. Cruise: 60%
  // of it at 100 m/s, radiator closed. Time constants of the coolant and oil, s.
  cooling: {
    climb: { eas: 62.6, power: 1, coolant: 105, oil: 95 },
    cruise: { eas: 100, power: 0.6, coolant: 85 },
    timeConstant: { coolant: 120, oil: 240 },
  },
  // Structural limits (Phase 5, D61-D62): g past `damage` wrinkles the airframe; at `fail` the wings fail.
  limits: {
    g: { damage: 7, fail: 10.5 },
    diveEas: 180.6, // m/s: 650 km/h ASI (S24); past it, flutter damages the control surfaces
  },
  // Hit zones (Phase 5, D68): fuselage sections [front, back] x, fuselage size, the wing's chord band and height, the
  // tail surfaces (estimates from the aircraft model, m in body axes).
  hitZones: {
    sections: { nose: [4.45, 2.0], cockpit: [2.0, -1.5], fuselage: [-1.5, -6.3], tail: [-6.3, -7.55] },
    halfWidth: 0.5, top: 1.0, bottom: -0.95,
    wing: { front: 1.23, back: -1.87, y: -0.4, halfThickness: 0.28 },
    tailSpan: 4.8, finTop: 1.25,
    nacelle: { halfWidth: 0.5, halfHeight: 0.6, length: 4.0 },
  },
  // Self-sealing wing tanks (S24, S25); radiators under the wings outboard of the nacelles, oil in the nacelles; the
  // C-4's armour is a gap (none modelled). Engine 0 left, 1 right.
  systems: {
    fuel: { wingInnerLeft: 'selfSealing', wingInnerRight: 'selfSealing' },
    coolant: { wingInnerLeft: 0, wingInnerRight: 1 },
    oil: { engineLeft: 0, engineRight: 1 },
    armour: 0,
  },
  contacts: {
    leftTip: { x: -0.4, y: 0.3, z: -8.1 },
    rightTip: { x: -0.4, y: 0.3, z: 8.1 },
    nose: { x: 4.2, y: -0.55, z: 0 },
    belly: { x: 0, y: -0.95, z: 0 },
    tail: { x: -7.1, y: -0.1, z: 0 },
  },
  // Fuel in each wing (m^3): main and reserve tanks together, for the cockpit's fuel quantity gauges. Fuel use is not
  // modelled yet, so the gauges show full tanks.
  fuel: { wingTank: 0.635 },
  // Reflector gunsight: type and the angular diameter of its ring (an estimate, see AIRCRAFT_DATA.md).
  sight: { type: 'Revi C/12C', ringMils: 100 },
  eye: { x: 1.0, y: 0.9 },
};
