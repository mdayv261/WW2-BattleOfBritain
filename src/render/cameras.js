// Cameras (Phase 2): the pilot's view from the cockpit and three outside views.
//   cockpit - at the pilot's eye (aircraft data), turning with the aircraft; the head turns with the mouse
//             or the joystick hat
//   chase   - behind along the flight path, horizon level
//   fixed   - rigidly behind and above, rolling with the aircraft
//   orbit   - round the aircraft at a distance, steered with the mouse
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
const FOV = { cockpit: 70, outside: 60 };

const _q = new THREE.Quaternion();
const _y = new THREE.Vector3(0, 1, 0);
const _x = new THREE.Vector3(1, 0, 0);
const FACE_NOSE = new THREE.Quaternion().setFromAxisAngle(_y, -Math.PI / 2); // camera -Z along the nose (+X)

/** Camera orientation for a head turn inside an aircraft whose attitude is `body`. */
export function cockpitQuaternion(body, look, out = new THREE.Quaternion()) {
  out.copy(body).multiply(FACE_NOSE);
  out.multiply(_q.setFromAxisAngle(_y, look.yaw));
  return out.multiply(_q.setFromAxisAngle(_x, look.pitch));
}

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
    this.zoom = 1;
    this.camPos = new THREE.Vector3();
    this.first = true;
    this.cockpitAllowed = true; // false for aircraft with no cockpit (the AI-only He 111)
  }

  get inCockpit() {
    return this.mode === 'cockpit';
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

  /** The hat overrides the mouse while it is held. */
  get look() {
    return this.hatLook ?? this.mouseLook;
  }

  /** Places the camera for the blended aircraft pose { position, quaternion } and its velocity. */
  update(ac, pose, velocity, dt) {
    const cam = this.camera;
    const fov = (this.inCockpit ? FOV.cockpit : FOV.outside) / this.zoom;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
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
