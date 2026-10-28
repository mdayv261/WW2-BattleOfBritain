// One aircraft in the simulation (Phase 6, D79): its type and side, its flight-model state and control input, its guns,
// its gunners (D83), its damage dice and its pilot. AI aircraft are stepped here: the pilot sets the input, the guns fire into the shared
// pool of rounds, and the same flight model as the player's moves it. The player's aircraft is a craft with no pilot
// (the keyboard and joystick set its input), stepped by the simulation itself. Free of rendering.

import { createAircraft, stepAircraft } from '../physics/flightModel.js';
import { createArmament, stepGuns } from '../weapons/guns.js';
import { seededRandom } from '../weapons/random.js';
import { recordTrack } from '../ai/perception.js';
import { createGunners, stepGunners } from '../ai/gunner.js';

let nextId = 1;

/** The control input an AI pilot starts with: as the aircraft was set up, levers forward for combat. */
export function aiInput(ac, plane, throttle) {
  return {
    throttle, rpm: 1, pitch: 0, roll: 0, yaw: 0, trim: plane.trim, flaps: 0, gear: 0, radiator: 0,
    // Airscrew pitch set by the engine-management assist on the manual-pitch aircraft, as a player may choose (D18).
    engineAssist: ac.propeller.type === 'manualPitch', engines: ac.engines ? [{}, {}] : [{}],
  };
}

export class Craft {
  /**
   * An aircraft of type `ac`. `plane` and `input` default to a new aircraft in level flight (`start`: the options of
   * createAircraft); `pilot` is { fly(craft, sim, dt) } or null; `seed` sets its damage dice.
   */
  constructor(ac, { plane, input, start = {}, pilot = null, side = ac.side, label = ac.name, skill = 'regular', seed = 1, role = 'ai' } = {}) {
    this.id = nextId;
    nextId += 1;
    this.ac = ac;
    this.side = side;
    this.label = label;
    this.role = role;
    this.skill = skill;
    this.plane = plane ?? createAircraft(ac, start);
    this.input = input ?? aiInput(ac, this.plane, start.throttle ?? 0.7);
    this.armament = createArmament(ac);
    this.gunnery = ac.mounts ? createGunners(this, seed) : null; // flexible guns and their gunners (D83)
    this.random = seededRandom(seed);
    this.pilot = pilot;
    this.previous = { position: this.plane.body.position.clone(), quaternion: this.plane.body.quaternion.clone() };
    this.track = [];
  }

  get alive() {
    return !this.plane.damage.failed && !this.plane.ground.crash;
  }

  /** Steps an AI aircraft by dt in `sim`: its pilot (while he lives), its guns and gunners, its flight. */
  step(dt, sim) {
    const { plane, input } = this;
    this.previous.position.copy(plane.body.position);
    this.previous.quaternion.copy(plane.body.quaternion);
    if (this.pilot && plane.damage.pilot > 0 && !this.abandoned) this.pilot.fly(this, sim, dt);
    else input.fireMg = input.fireCannon = false; // a dead or departing pilot's hand is off the trigger
    const recoil = stepGuns(this.armament, plane, input, dt, plane.time, (round) => sim.projectiles.spawn(round, this));
    plane.recoil = recoil.force.lengthSq() > 0 ? recoil : null;
    stepGunners(this, sim, dt);
    stepAircraft(plane, input, dt);
    recordTrack(this, sim.clock);
  }
}
