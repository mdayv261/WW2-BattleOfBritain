// Mouse look (Phase 2, D28): drag with the left button to turn the head in the cockpit or swing the orbit
// camera outside; the wheel zooms; a double click looks straight ahead again. Mouse flying comes in Phase 8.

const RADIANS_PER_PIXEL = 0.005;

export class MouseLook {
  constructor(element, rig) {
    this.rig = rig;
    this.dragging = false;
    element.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
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
      this.rig.zoom = Math.min(2.5, Math.max(0.8, this.rig.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    }, { passive: false });
    element.addEventListener('dblclick', () => this.rig.resetLook());
  }
}
