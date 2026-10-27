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
  // The target aircraft's autopilot (Phase 5, D68): tuning gains of a test aid, not aircraft data.
  autopilot: {
    headingToBank: 1.0, // rad of bank per rad of heading error
    maxBank: 0.26, // rad: about 15°
    bankGain: 2.5, // stick per rad of bank error
    rollDamping: 0.8, // stick per rad/s of roll rate
    altitudeToClimb: 0.08, // m/s of climb per m of height error
    maxClimb: 5, // m/s
    climbGain: 0.08, // stick per m/s of climb error
    pitchDamping: 0.6, // stick per rad/s of pitch rate
    slipGain: 1.5, // rudder per rad of sideslip
    yawDamping: 0.6, // rudder per rad/s of yaw rate
    speedGain: 0.01, // throttle per second per m/s of speed error
  },
  // Hit zones and damage from hits (Phase 5, D68; src/weapons). Estimates: no measured vulnerability data found.
  hitZones: {
    innerShare: 0.45, // the wing's inner hit zone runs out to this share of the semispan
  },
  damage: {
    // Components in each kind of zone, by weight; a zone holding a tank, radiator or oil cooler adds systemWeights.
    weights: {
      engine: { engine: 0.45, coolant: 0.25, oil: 0.15, nothing: 0.15 },
      nose: { cables: 0.2, nothing: 0.8 },
      cockpit: { pilot: 0.3, cables: 0.15, nothing: 0.3 },
      fuselage: { cables: 0.3, nothing: 0.7 },
      tail: { elevator: 0.35, rudder: 0.35, tailStructure: 0.3 },
      wingInner: { wing: 0.4, flap: 0.1, gear: 0.1, nothing: 0.2 },
      wingOuter: { wing: 0.6, aileron: 0.3, nothing: 0.1 },
    },
    systemWeights: { fuel: 0.25, coolant: 0.15, oil: 0.1 },
    engineWear: 0.06, // engine wear per unit of hit strength (seizure at 1)
    engineFireChance: 0.05, // chance an incendiary hit on the engine starts a fire
    leakRate: 0.004, // fraction of the coolant or oil lost per second per unit of hit strength
    oilStarve: 0.3, // with less oil than this left, the engine wears out
    oilWearLife: 30, // s: an engine with no oil left seizes in about this time
    fireChance: { plain: 0.3, linatex: 0.15, selfSealing: 0.05 }, // chance an incendiary hit on a tank starts a fire
    fireTime: 30, // s: a fire burns this long before the aircraft breaks up
    armourArc: 1.05, // rad: rounds from within this angle of dead astern meet the pilot's rear armour
    apPenetrationSpeed: 650, // m/s: armour-piercing rifle rounds faster than this get through (S37: 10 mm at 100 yd)
    pilotWound: 0.35, // pilot's health lost per wound (x the square root of the hit strength)
    cableCut: 0.3, // chance per unit of hit strength that a hit on the cables cuts one
    surfaceLoss: 0.1, // control effect lost per unit of hit strength on an aileron, elevator or rudder
    wingDamage: 0.04, // wing panel damage per unit of hit strength (the wing breaks at 1)
    wingLiftLoss: 0.6, // lift a fully damaged panel loses
    wingDrag: 0.05, // drag coefficient a fully damaged panel adds (on its share of the wing)
    tailDamage: 0.05, // tail structure damage per unit of hit strength (it breaks away at 1)
  },
  // The target aircraft (Phase 5, D68): a test aid.
  target: {
    distance: 400, // m ahead of the player when it appears
    throttle: 0.6, // it cruises at its level speed at this throttle
    minHeight: 300, // m above the ground, at least
  },
  // A destroyed aircraft falling, and the parts that broke off it (Phase 5, D69): a simple body under gravity and drag,
  // turning at a set rate, since a broken airframe no longer flies. Estimates: no measurements of falling wrecks found.
  wreck: {
    terminalSpeed: 90, // m/s at sea level: a tumbling airframe, about a fighter's speed in a spin's steep descent
    debrisTerminalSpeed: 35, // m/s at sea level: a wing or tail falling flat and fluttering
    spinUp: 1.5, // s: how quickly the wreck takes up its spin
    wingSpin: 3.5, // rad/s: roll towards the side that lost its wing
    tailSpin: 2.5, // rad/s: nose-down pitch of an airframe that lost its tail
    fallSpin: 0.6, // rad/s: slow nose-down tumble of a wreck still in one piece (a burnt-out engine, both wings gone)
    debrisSpin: 4, // rad/s: tumbling of a broken-off part
  },
};
