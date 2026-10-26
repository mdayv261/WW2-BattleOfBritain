// Flight-model parameters shared by every aircraft. All are estimates or physical theory; each has a
// row, keyed by its path, in docs/AIRCRAFT_DATA.md, section "Common flight-model parameters".

export const common = {
  sectionLiftSlope: 5.655, // per rad: 0.9 x 2 pi, typical real wing section
  stallWidth: 0.07, // rad: how sharply lift falls past the stall (about 1.5 degrees)
  flatPlateCd: 1.3, // drag coefficient of a wing-shaped flat plate across the wind (fully stalled)
  // Share of a wing half's lift on its inner and outer panel, and each panel's lift centre as a fraction
  // of the semispan, for an elliptical lift distribution.
  panel: { innerLift: 0.609, outerLift: 0.391, innerArm: 0.244, outerArm: 0.705 },
  stalledRollDamping: -0.25, // extra roll damping (per unit pb/2V) when the outer wing is stalled
  stallNoseDown: 0.35, // centre-of-pressure shift (fraction of chord) of a stalled wing: nose-down moment
  lowWingDihedral: -3 * (Math.PI / 180), // rad: a low wing's junction with the fuselage cancels about 3 degrees of dihedral
  ramRecovery: 0.5, // fraction of dynamic pressure recovered at the supercharger intake
  tailSlipstream: 0.5, // fraction of the propeller's extra dynamic pressure felt at the tail
  pilotMaxForce: { pitch: 222, roll: 133, yaw: 667 }, // N: 50 lb, 30 lb, 150 lb
  // Tyres on a grass aerodrome (Phase 2). Friction values are fractions of the wheel's load.
  grass: {
    rolling: 0.06, // rolling resistance of a free wheel
    friction: 0.5, // most grip a tyre can give, sideways and braking together
    slipPeak: 0.14, // rad: tyre slip angle at which the side force reaches its peak (about 8 degrees)
  },
  castorFriction: 0.1, // sideways drag of a castoring tailwheel (friction in its pivot)
  slipSpeed: 0.1, // m/s: sliding speed below which tyre friction fades out, so a parked aircraft stays still
  groundEffect: 16, // McCormick's constant: induced drag in ground effect x (16h/b)^2 / (1 + (16h/b)^2)
  lowSpeed: 15, // m/s: below this the airflow angles and rotation terms are worked out as at this speed
  sinkLimit: 3.5, // m/s: wheel descent rate at touchdown that collapses the undercarriage
  starterSpeed: 600 * ((2 * Math.PI) / 60), // rad/s: crankshaft speed a starting engine is turned to (L key, D49)
  deadEngineFriction: 0.1, // friction of a stopped engine's internals, as a fraction of its rated torque
  // Engine heat (Phase 5, D62; src/physics/cooling.js). Estimates: no measured values found.
  cooling: {
    flowExponent: 0.8, // radiator conductance against air mass flow (turbulent flow through a radiator core)
    eta: 0.8, // airscrew efficiency assumed when working out the slipstream of the calibration flights
    idleHeat: 0.05, // heat of a turning engine at idle (friction), as a fraction of its rated sea-level power
  },
  engineWear: {
    overheatSpan: 20, // °C over a limit at which wear builds up at 1 / overheatLife per second
    overheatLife: 120, // s: an engine 20 °C over a limit seizes in about two minutes
    overRevSpan: 300, // rpm over the diving limit at which wear builds up at 1 / overRevLife per second
    overRevLife: 10, // s
    lossFrom: 0.3, // wear below this costs no power
    lossAtSeize: 0.6, // power lost by the time the engine seizes
    boilMargin: 15, // °C over the coolant limit at which the coolant boils off
    boilRate: 0.01, // fraction of the coolant lost per second while boiling
    coolantNeeded: 0.4, // with less than this fraction of the coolant left, the radiator carries less heat away
    seizedFriction: 3, // friction of a seized engine, as a fraction of its rated torque: the airscrew stops
  },
  // Structural damage (Phase 5, D62; src/physics/structure.js). Estimates: no measured values found.
  structure: {
    negativeShare: 0.5, // negative-g limits as a share of the positive ones
    airframeDrag: 0.3, // extra parasite drag of a fully wrinkled airframe, as a fraction of cd0
    flutterSpan: 0.1, // excess over the diving limit (fraction) at which flutter damage builds up at 1 / flutterLife per second
    flutterLife: 5, // s: 10% over the limit tears the surfaces away in about five seconds
    flutterLoss: 0.8, // effect lost by fluttering surfaces just before they tear away
    tornSurfaceDrag: 0.1, // extra parasite drag once the surfaces are torn away, as a fraction of cd0
  },
  // Engines at a ground start are warm, as after a run-up (estimate): the Merlin's minimum take-off coolant temperature.
  groundStartHeat: { coolant: 60, oil: 40 },
};
