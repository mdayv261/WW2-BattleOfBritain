// The take-off rudder trim (D248). S33, the Spitfire I's Pilot's Notes, sets the rudder trim "fully to starboard" in
// the drill before take-off, against the Merlin's swing to the left. An aircraft's setting is `controls.takeoffRudderTrim`
// in its data file; only the Spitfire has one. The Hurricane and the Bf 109 have no rudder trim tab, and no take-off
// setting was found for the Bf 110, whose engines turn the other way (the product owner: the key does nothing there).
// A ground start begins at the setting (src/core/simulation.js); a key toggles it and neutral (src/input/keyboard.js).

/** The aircraft's take-off rudder trim (-1..1, +1 fully right), or null if none is given. */
export function takeoffRudderTrim(ac) {
  if (!ac.aero?.rudderTrimCn) return null;
  return ac.controls.takeoffRudderTrim ?? null;
}

/** Sets the rudder trim to the take-off setting, or back to neutral if it is there; returns the message to show. */
export function toggleTakeoffTrim(ac, input) {
  if (!ac.aero?.rudderTrimCn) return `The ${ac.name} has no rudder trim tab`;
  const setting = takeoffRudderTrim(ac);
  if (setting === null) return `No take-off rudder trim given for the ${ac.name}`;
  const atTakeoff = Math.abs((input.rudderTrim ?? 0) - setting) < 0.01;
  input.rudderTrim = atTakeoff ? 0 : setting;
  if (atTakeoff) return 'Rudder trim: neutral';
  return `Rudder trim: take-off (fully ${setting > 0 ? 'right' : 'left'})`;
}
