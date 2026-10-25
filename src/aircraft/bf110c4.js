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
    cd0: 0.0267,
    oswald: 0.8,
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
    rollRig: -0.00152,
    yawRig: -0.00058,
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
  contacts: {
    leftTip: { x: -0.4, y: 0.3, z: -8.1 },
    rightTip: { x: -0.4, y: 0.3, z: 8.1 },
    nose: { x: 4.2, y: -0.55, z: 0 },
    belly: { x: 0, y: -0.95, z: 0 },
    tail: { x: -7.1, y: -0.1, z: 0 },
  },
  // Reflector gunsight: type and the angular diameter of its ring (an estimate, see AIRCRAFT_DATA.md).
  sight: { type: 'Revi C/12C', ringMils: 100 },
  eye: { x: 1.0, y: 0.9 },
};
