// Mouse look (Phase 2, D28): drag with the left button to turn the head in the cockpit or swing the orbit
// camera outside; the wheel zooms; a double click looks straight ahead again. With mouse flying on (D239,
// src/input/mouseFlight.js) the mouse flies instead: no drag-looking, and the wheel is the throttle.

const RADIANS_PER_PIXEL = 0.005;

export class MouseLook {
  /** `flight`: the mouse-flying option (src/input/mouseFlight.js), or null. */
  constructor(element, rig, flight = null) {
    this.rig = rig;
    this.dragging = false;
    const flying = () => !!flight?.enabled;
    element.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || flying()) return;
      this.dragging = true;
      element.setPointerCapture(e.pointerId);
    });
    element.addEventListener('pointerup', () => {
      this.dragging = false;
    });
    element.addEventListener('pointermove', (e) => {
      if (this.dragging) this.rig.turn(-e.movementX * RADIANS_PER_PIXEL, -e.movementY * RADIANS_PER_PIXEL);
    });
    element.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (flying()) {
        flight.wheel(e.deltaY);
        return;
      }
      this.rig.zoom = Math.min(2.5, Math.max(0.8, this.rig.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    }, { passive: false });
    element.addEventListener('dblclick', () => {
      if (!flying()) this.rig.resetLook();
    });
  }
}
