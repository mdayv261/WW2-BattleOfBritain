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
  geometry: { span: 9.9, wingArea: 16.4, mac: 1.634, length: 8.76 },
  mass: { flying: 2608, ixx: 3994, iyy: 7225, izz: 8627 },
  aero: {
    alphaZeroLift: -3.5 * DEG,
    clMax: 1.4, // slats open
    clMaxFlaps: 1.9,
    cd0: 0.0273,
    oswald: 0.8,
    flapCd: 0.07,
    gearCd: 0.02,
    radiatorCd: 0.004,
    washout: 0, // no wing twist
    dihedral: 5.75 * DEG,
    slipstreamWing: 0.196,
    staticMargin: 0.05,
    cmZero: 0.02,
    cmq: -12,
    elevatorCm: 0.2,
    trimCm: 0.03,
    flapCm: -0.02,
    aileronCl: 0.0507,
    adverseYaw: -0.008,
    cnBeta: 0.07,
    cnr: -0.1,
    rudderCn: 0.06,
    cyBeta: -0.6,
    swirl: 0.15,
    rollRig: -0.002231, // solved by npm run fit:rig (D73)
    yawRig: -0.001464, // solved by npm run fit:rig (D73)
    stallBias: -0.02, // left wing drops at the stall
  },
  controls: {
    pitchHinge: 0.0755, rollHinge: 0.034, yawHinge: 0.06, flapTime: 8, gearTime: 8,
    flapStops: 4, // handwheel; marked 0 to 40 degrees in tens
    flapTravel: 40 * DEG, // fully down, as marked
    flapTakeoff: 0.5, // 20 degrees for take-off (fraction of travel)
    flapLanding: 1, // fully down for landing
    elevatorUp: 31.6 * DEG, // elevator travel, full up (display and checks; the moments use aero.elevatorCm)
    trimTime: 18, // s: tailplane trim wheel from one end to the other
  },
  // Undercarriage and ground contact (Phase 2). Positions are from the centre of gravity in body axes
  // (+x forward, +y up, +z right), wheels with their legs extended, measured from the RAE's scaled drawing.
  gear: {
    main: { x: 0.584, y: -1.365, z: 0.95, radius: 0.315 },
    tail: { x: -5.22, y: 0.047, radius: 0.07, castor: 1 },
    groundAngle: 15.5 * DEG, // thrust line to the ground (17 degrees at the wing root)
    mainDeflection: 0.1,
    tailDeflection: 0.06,
    dampingRatio: 0.6,
    brake: 0.3,
  },
  // The cockpit's gun ammunition counter columns, left to right (product owner's choice, D64; not from a source).
  ammoCounter: ['mg17Left', 'cannon', 'mg17Right'],
  // Guns (Phase 5, D67): type, muzzle position in body axes (m; estimates placed on the airframe: no drawing found) and
  // rounds. MG 17s synchronised through the airscrew; belts as D61. The counter column each feeds (D64).
  harmonisation: 200, // m: range at which the guns' rounds cross the sight line
  guns: {
    // MG 17 muzzles at the front of the cowling, spread either side so their flashes show left and right of the Revi's
    // glass from the cockpit (product owner's choice, D67; the real guns sat closer together).
    mg17Left: { type: 'mg17', x: 2.1, y: 0.4, z: -0.37, rounds: 1000, synchronised: true, counter: 'mg17Left' },
    mg17Right: { type: 'mg17', x: 2.1, y: 0.4, z: 0.37, rounds: 1000, synchronised: true, counter: 'mg17Right' },
    cannonLeft: { type: 'mgffm', x: 0.85, y: -0.2, z: -1.95, rounds: 60, counter: 'cannon' },
    cannonRight: { type: 'mgffm', x: 0.85, y: -0.2, z: 1.95, rounds: 60, counter: 'cannon' },
  },
  // Engine cooling (Phase 5, D62). Estimates: the temperatures each engine settles at, used to solve the radiator's
  // conductance. Climb: the normal rating's sea-level power at the model's best-climb speed, radiator open. Cruise: 60%
  // of it at 100 m/s, radiator closed. Time constants of the coolant and oil, s.
  cooling: {
    climb: { eas: 67.1, power: 1, coolant: 105, oil: 95 },
    cruise: { eas: 100, power: 0.6, coolant: 85 },
    timeConstant: { coolant: 120, oil: 240 },
  },
  // Structural limits (Phase 5, D61-D62): g past `damage` wrinkles the airframe; at `fail` the wings fail.
  limits: {
    g: { damage: 9, fail: 13 },
    diveEas: 208.3, // m/s: 750 km/h (S15); past it, flutter damages the control surfaces
  },
  // Hit zones (Phase 5, D68): fuselage sections [front, back] x, fuselage size, the wing's chord band and height, the
  // tail surfaces (estimates from the aircraft model, m in body axes).
  hitZones: {
    sections: { engine: [2.76, 0.2], cockpit: [0.2, -1.9], fuselage: [-1.9, -4.6], tail: [-4.6, -6.0] },
    halfWidth: 0.42, top: 0.6, bottom: -0.62,
    wing: { front: 0.9, back: -1.3, y: -0.4, halfThickness: 0.16 },
    tailSpan: 3.1, finTop: 1.4,
  },
  // A fuel tank under and behind the pilot (self-sealing: an estimate), radiators under both wings, the oil cooler under
  // the nose; 8 mm pilot armour (S38).
  systems: {
    fuel: { cockpit: 'selfSealing' },
    coolant: { wingInnerLeft: 0, wingInnerRight: 0 },
    oil: { engine: 0 },
    armour: 0.008,
  },
  contacts: {
    leftTip: { x: -0.2, y: 0.1, z: -4.95 },
    rightTip: { x: -0.2, y: 0.1, z: 4.95 },
    nose: { x: 1.4, y: -0.61, z: 0 },
    belly: { x: -0.6, y: -0.65, z: 0 },
    tail: { x: -5.0, y: 0.2, z: 0 },
  },
  propHub: { x: 2.41, y: 0 },
  // Reflector gunsight: type and the angular diameter of its ring (an estimate, see AIRCRAFT_DATA.md).
  sight: { type: 'Revi C/12C', ringMils: 100 },
  eye: { x: -0.89, y: 0.556 },
  // Crew (Phase 6, D80): where each sits (m, body axes; estimates on the model) and how long after deciding to bail
  // out he is clear of the aircraft (s, estimates: hood or hatch, harness, over the side; one after another).
  crew: [
    { role: 'pilot', x: -0.89, y: 0.15, z: 0, exit: 4 },
  ],
  propeller: {
    type: 'manualPitch',
    diameter: 3.1,
    gearRatio: 0.6452, // engine 1.55 : propeller 1
    rotation: -1, // anticlockwise seen from the cockpit
    betaMin: 22.5 * DEG,
    betaMax: 55 * DEG,
    inertia: 35, // rotating inertia at propeller speed (rpm changes)
    gyroInertia: 25, // net gyroscopic inertia at propeller speed
    governorGain: 3, // used only by the engine-management assist
    pitchRate: 0.07, // manual thumb-switch pitch change
    rpmMin: 1500 * RPM,
    rpmMax: 2400 * RPM,
  },
  slats: { openAlpha: 12.4 * DEG, fullAlpha: 14.4 * DEG, clMaxClosed: 1.15, sectionGain: 0.3, rate: 4 },
};
