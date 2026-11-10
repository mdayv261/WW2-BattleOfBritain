// Mouse flying (Phase 8 checkpoint 2, D239): an option, off by default (the product owner's choice). With it on, a
// click on the view captures the mouse (pointer lock where the browser allows it, else following the cursor; Esc frees
// it, as the browser requires), and moving the mouse
// moves the stick, which stays where it was moved, like a joystick held there: right rolls right, towards you pulls
// back. The wheel moves the throttle, and the middle button or a bound key (Centre the mouse stick) centres the stick.
// The rudder stays on its keys or the twist grip. On the Bf 110's rear gun the mouse aims the gun instead (D234). The
// sensitivities are feel choices, not aircraft data.

/** Mouse travel (px) for full stick deflection at each sensitivity. */
export const MOUSE_TRAVEL = { low: 600, medium: 400, high: 250 };
const WHEEL_STEP = 0.05; // throttle per wheel notch

const clamp1 = (v) => Math.max(-1, Math.min(1, v));

export class MouseFlight {
  constructor() {
    this.enabled = false;
    this.travel = MOUSE_TRAVEL.medium;
    this.stick = { pitch: 0, roll: 0 };
    this.throttle = 0; // wheel notches to apply, as throttle travel
    this.locked = false;
  }

  /** The option and its sensitivity ('low', 'medium', 'high'). */
  configure(enabled, sensitivity = 'medium') {
    this.enabled = enabled;
    this.travel = MOUSE_TRAVEL[sensitivity] ?? MOUSE_TRAVEL.medium;
    if (!enabled) this.centre();
  }

  /** Mouse movement (px): moves the stick, held where it is moved. */
  move(dx, dy) {
    this.stick.roll = clamp1(this.stick.roll + dx / this.travel);
    this.stick.pitch = clamp1(this.stick.pitch + dy / this.travel); // towards you (down the screen) pulls back
  }

  /** A wheel turn: up opens the throttle. */
  wheel(deltaY) {
    this.throttle += deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP;
  }

  centre() {
    this.stick.pitch = 0;
    this.stick.roll = 0;
  }

  /** Sets the stick and throttle on `input` while the option is on and the mouse is captured. */
  apply(input) {
    if (!this.enabled || !this.locked) return;
    input.pitch = this.stick.pitch;
    input.roll = this.stick.roll;
    input.throttle = Math.max(0, Math.min(1, input.throttle + this.throttle));
    this.throttle = 0;
  }

  /**
   * Listens on the view `element`: a click captures the mouse, movement flies (or, with `aimInstead()` true, turns the
   * rig: the Bf 110's gun), the wheel moves the throttle, the middle button centres. `rig` is the camera rig.
   */
  listen(element, rig, aimInstead = () => false) {
    element.addEventListener('click', () => {
      if (!this.enabled || this.locked) return;
      // Captured: with the pointer locked where the browser allows it, else following the cursor over the view (a
      // browser may refuse the lock, as in a window without the focus).
      this.locked = true;
      try {
        element.requestPointerLock?.()?.catch?.(() => {});
      } catch {
        // refused: fly with the cursor
      }
    });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === element) this.pointerLocked = true;
      else if (this.pointerLocked) {
        this.pointerLocked = false;
        this.locked = false; // Esc freed the mouse
      }
    });
    element.addEventListener('mousemove', (e) => {
      if (!this.enabled || !this.locked) return;
      if (aimInstead()) rig.turn(-e.movementX * 0.005, -e.movementY * 0.005);
      else this.move(e.movementX, e.movementY);
    });
    element.addEventListener('mousedown', (e) => {
      if (this.enabled && this.locked && e.button === 1) {
        e.preventDefault();
        this.centre();
      }
    });
  }

  /**
   * The stick's position, bottom right, while the option is on in flight (`show`): a dot in a square, or a reminder to
   * click the view to take the mouse.
   */
  draw(show) {
    if (!this.box) {
      this.box = document.createElement('div');
      this.box.style.cssText = 'position:fixed;right:16px;bottom:16px;width:64px;height:64px;border:1px solid rgba(232,237,242,0.7);'
        + 'background:rgba(20,28,36,0.45);border-radius:4px;pointer-events:none;display:none;font:11px/1.2 ui-monospace,Menlo,monospace;'
        + 'color:#e8edf2;text-align:center;';
      this.dot = document.createElement('div');
      this.dot.style.cssText = 'position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#ffd25a;';
      this.box.append(this.dot);
      this.hint = document.createElement('div');
      this.hint.style.cssText = 'position:absolute;inset:6px 2px;';
      this.hint.textContent = 'click the view to fly';
      this.box.append(this.hint);
      document.body.append(this.box);
    }
    this.box.style.display = show && this.enabled ? 'block' : 'none';
    if (!show || !this.enabled) return;
    this.hint.style.display = this.locked ? 'none' : 'block';
    this.dot.style.display = this.locked ? 'block' : 'none';
    this.dot.style.left = `${32 + this.stick.roll * 28}px`;
    this.dot.style.top = `${32 + this.stick.pitch * 28}px`;
  }

  /** Frees the mouse (on the menus). */
  release() {
    if (this.pointerLocked) document.exitPointerLock?.();
    this.locked = false;
  }
}
