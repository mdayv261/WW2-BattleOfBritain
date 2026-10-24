// Flight-model parameters shared by every aircraft. All are estimates or physical theory; each has a
// row, keyed by its path, in docs/AIRCRAFT_DATA.md, section "Common flight-model parameters".

export const common = {
  sectionLiftSlope: 5.655, // per rad: 0.9 x 2 pi, typical real wing section
  stallWidth: 0.026, // rad: how sharply lift falls past the stall (about 1.5 degrees)
  flatPlateCd: 1.3, // drag coefficient of a wing-shaped flat plate across the wind (fully stalled)
  halfWingArm: 0.424, // fraction of the semispan: centroid of an elliptical lift distribution
  ramRecovery: 0.5, // fraction of dynamic pressure recovered at the supercharger intake
  tailSlipstream: 0.5, // fraction of the propeller's extra dynamic pressure felt at the tail
  pilotMaxForce: { pitch: 222, roll: 133, yaw: 667 }, // N: 50 lb, 30 lb, 150 lb
};
