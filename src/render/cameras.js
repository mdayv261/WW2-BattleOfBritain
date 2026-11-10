// Cameras (Phase 2): the pilot's view from the cockpit and three outside views.
//   cockpit - at the pilot's eye (aircraft data), turning with the aircraft; the head turns with the mouse
//             or the joystick hat
//   chase   - behind along the flight path, horizon level
//   fixed   - rigidly behind and above, rolling with the aircraft
//   orbit   - round the aircraft at a distance, steered with the mouse
//   gunner  - the Bf 110's rear gunner looking along his MG 15 (D234): the eye just behind and above the gun's pivot,
//             looking where the gun points, so the ring-and-bead sight is in the middle of the view
// `look` is the head's turn: yaw (rad, + to the left) and pitch (rad, + up).

import * as THREE from 'three';

export const OUTSIDE_VIEWS = ['chase', 'fixed', 'orbit'];

/** Head turn for each hat direction (0 up, clockwise to 7 up-left): ahead-up, the sides, and behind. */
export const HAT_LOOKS = [
  { yaw: 0, pitch: 0.6 }, { yaw: -Math.PI / 4, pitch: 0.3 }, { yaw: -Math.PI / 2, pitch: 0.1 },
  { yaw: -Math.PI * 0.75, pitch: 0.2 }, { yaw: Math.PI * 0.9, pitch: 0.3 }, { yaw: Math.PI * 0.75, pitch: 0.2 },
  { yaw: Math.PI / 2, pitch: 0.1 }, { yaw: Math.PI / 4, pitch: 0.3 },
];
const LOOK_LIMITS = { yaw: Math.PI * 0.9, pitchUp: 1.4, pitchDown: -0.7 };

/**
 * The look keys' head turn (D239) for which are held ({ left, right, back, up }): left or right 90°, behind 160° to the
 * side held (left if neither), up 60°, combined; null with none held.
 */
export function keyLook({ left, right, back, up }) {
  if (!left && !right && !back && !up) return null;
  const side = left && !right ? 1 : right && !left ? -1 : 0;
  const yaw = back ? (side || 1) * Math.PI * 0.9 : side * (Math.PI / 2);
  return { yaw, pitch: up ? (side || back ? 0.6 : 1.05) : back || side ? 0.15 : 0 };
}
// rad: a head turned further than this to the side, or raised further, is looking away from the instrument panel, which
// is then hidden (D58). Every hat view is beyond it; looking down at the panel never hides it.
export const PANEL_LOOK_LIMIT = 20 * (Math.PI / 180);
export const FOV = { cockpit: 70, outside: 60 };

const _q = new THREE.Quaternion();
const _y = new THREE.Vector3(0, 1, 0);
const _x = new THREE.Vector3(1, 0, 0);
const _eye = new THREE.Vector3();
const _at = new THREE.Vector3();
const _up = new THREE.Vector3();
const _m = new THREE.Matrix4();
const FACE_NOSE = new THREE.Quaternion().setFromAxisAngle(_y, -Math.PI / 2); // camera -Z along the nose (+X)

/** Camera orientation for a head turn inside an aircraft whose attitude is `body`. */
export function cockpitQuaternion(body, look, out = new THREE.Quaternion()) {
  out.copy(body).multiply(FACE_NOSE);
  out.multiply(_q.setFromAxisAngle(_y, look.yaw));
  return out.multiply(_q.setFromAxisAngle(_x, look.pitch));
}

const GUNNER_EYE = { back: 0.45, up: 0.11 }; // m: the gunner's eye behind the gun's pivot along its line (clear of the
// breech), and above its line, both in the gun's own frame so they hold at any angle of the gun

/**
 * The direction (body axes) the player wants the rear gun pointed, from the gunner's look: `yaw` turns from dead astern
 * (+ to the gunner's left, the aircraft's right), `pitch` up. Azimuth from the nose is π - yaw.
 */
export const gunnerAim = (look, out = new THREE.Vector3()) => {
  const az = Math.PI - look.yaw;
  return out.set(Math.cos(look.pitch) * Math.cos(az), Math.sin(look.pitch), Math.cos(look.pitch) * Math.sin(az));
};

/** World position of the pilot's eye. */
export function eyePosition(ac, position, body, out = new THREE.Vector3()) {
  return out.set(ac.eye.x, ac.eye.y, 0).applyQuaternion(body).add(position);
}

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'cockpit';
    this.outside = 'chase';
    this.mouseLook = { yaw: 0, pitch: 0 };
    this.hatLook = null;
    this.keyLook = null; // the look keys' turn while held (D239)
    this.zoom = 1;
    this.camPos = new THREE.Vector3();
    this.first = true;
    this.cockpitAllowed = true; // false for aircraft with no cockpit (the AI-only He 111)
    // Where the guns' line stands in the cockpit view, as a fraction of the screen's height from its top: the middle,
    // or higher for a cockpit whose whole panel is drawn below the sight (the Bf 109's, D93).
    this.aim = 0.5;
  }

  get inCockpit() {
    return this.mode === 'cockpit';
  }

  /** On the Bf 110's rear gun (D234). */
  get atGun() {
    return this.mode === 'gunner';
  }

  /** Inside the aircraft: in the pilot's cockpit or at the rear gun. */
  get inside() {
    return this.inCockpit || this.atGun;
  }

  /** In the cockpit with the head turned to the side, up or behind (hat or mouse): the panel is out of view. */
  get lookingAway() {
    const { yaw, pitch } = this.look;
    return this.inCockpit && (Math.abs(yaw) > PANEL_LOOK_LIMIT || pitch > PANEL_LOOK_LIMIT);
  }

  /** C: between the cockpit and the last outside view. */
  toggleCockpit() {
    this.mode = this.inCockpit || !this.cockpitAllowed ? this.outside : 'cockpit';
    this.first = true;
  }

  /** V: the next outside view (from the cockpit, the current one). */
  nextOutside() {
    if (!this.inCockpit) this.outside = OUTSIDE_VIEWS[(OUTSIDE_VIEWS.indexOf(this.outside) + 1) % OUTSIDE_VIEWS.length];
    this.mode = this.outside;
    this.first = true;
  }

  /** Mouse drag: turns the head (cockpit) or the orbit (outside), in radians. */
  turn(dYaw, dPitch) {
    const l = this.mouseLook;
    l.yaw = THREE.MathUtils.clamp(l.yaw + dYaw, -LOOK_LIMITS.yaw, LOOK_LIMITS.yaw);
    l.pitch = THREE.MathUtils.clamp(l.pitch + dPitch, LOOK_LIMITS.pitchDown, LOOK_LIMITS.pitchUp);
  }

  resetLook() {
    this.mouseLook = { yaw: 0, pitch: 0 };
    this.zoom = 1;
  }

  /** The hat overrides the look keys, and they the mouse, while held. */
  get look() {
    return this.hatLook ?? this.keyLook ?? this.mouseLook;
  }

  /**
   * Shifts the camera's picture so that straight ahead falls `aim` of the way down the screen (0.5: the middle, no
   * shift). A lens shift, not a tilt: verticals stay upright and the field of view is unchanged (D93).
   */
  shiftPicture(aim) {
    const cam = this.camera;
    if (aim === 0.5) {
      if (cam.view?.enabled) cam.clearViewOffset();
      return;
    }
    const v = cam.view;
    const offset = 0.5 - aim; // of the picture's height
    if (v?.enabled && v.offsetY === offset && v.fullWidth === cam.aspect) return;
    cam.setViewOffset(cam.aspect, 1, 0, offset, cam.aspect, 1);
  }

  /** Places the camera for the blended aircraft pose { position, quaternion } and its velocity. */
  update(ac, pose, velocity, dt) {
    const cam = this.camera;
    const fov = (this.inside ? FOV.cockpit : FOV.outside) / this.zoom;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    this.shiftPicture(this.inCockpit ? this.aim : 0.5);
    if (this.atGun && this.gun) {
      // Along the gun: `gun` is its mount ({ position, bore }, body axes).
      const { position, bore } = this.gun;
      // The gun's own up: the aircraft's up, square to the bore.
      _up.set(0, 1, 0).addScaledVector(bore, -bore.y).normalize();
      _eye.copy(position).addScaledVector(bore, -GUNNER_EYE.back).addScaledVector(_up, GUNNER_EYE.up);
      _at.copy(_eye).add(bore);
      _m.lookAt(_eye, _at, _up);
      cam.quaternion.setFromRotationMatrix(_m).premultiply(pose.quaternion);
      cam.position.copy(_eye).applyQuaternion(pose.quaternion).add(pose.position);
      this.camPos.copy(cam.position);
      this.first = true;
      return;
    }
    if (this.inCockpit) {
      eyePosition(ac, pose.position, pose.quaternion, cam.position);
      cockpitQuaternion(pose.quaternion, this.look, cam.quaternion);
      this.camPos.copy(cam.position);
      this.first = true;
      return;
    }
    let target;
    if (this.mode === 'fixed') {
      target = new THREE.Vector3(-22, 5, 0).applyQuaternion(pose.quaternion).add(pose.position);
      cam.up.set(0, 1, 0).applyQuaternion(pose.quaternion);
    } else if (this.mode === 'orbit') {
      const { yaw, pitch } = this.look;
      const r = 25;
      // Starts behind the aircraft (relative to its heading) and swings round with the mouse.
      const nose = new THREE.Vector3(1, 0, 0).applyQuaternion(pose.quaternion);
      const heading = Math.atan2(-nose.z, nose.x);
      target = new THREE.Vector3(-Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch) + 0.15, Math.cos(pitch) * Math.sin(yaw))
        .applyAxisAngle(_y, heading).multiplyScalar(r).add(pose.position);
      cam.up.set(0, 1, 0);
    } else {
      const dir = velocity.lengthSq() > 4 ? velocity.clone().normalize() : new THREE.Vector3(1, 0, 0).applyQuaternion(pose.quaternion).setY(0).normalize();
      target = pose.position.clone().addScaledVector(dir, -24).add(new THREE.Vector3(0, 6, 0));
      cam.up.set(0, 1, 0);
    }
    const k = this.first ? 1 : 1 - Math.exp(-dt * 8);
    this.camPos.lerp(target, k);
    this.first = false;
    this.camPos.y = Math.max(this.camPos.y, 1.5);
    cam.position.copy(this.camPos);
    cam.lookAt(pose.position);
  }
}
