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
};
