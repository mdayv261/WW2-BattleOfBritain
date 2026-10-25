// Joystick check panel (J): shows every raw axis and button live, and lets the player choose which
// axis drives roll, pitch, rudder and throttle, and whether each is reversed. Kept in browser storage.

import { DEFAULT_MAPPING } from '../input/joystick.js';

const FUNCTIONS = [['roll', 'Roll'], ['pitch', 'Pitch (pull back = +)'], ['yaw', 'Rudder (twist)'], ['throttle', 'Throttle slider']];

export class JoystickPanel {
  constructor(joystick) {
    this.joystick = joystick;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);display:none;'
      + 'background:rgba(20,28,36,0.92);color:#e8edf2;font:13px/1.5 ui-monospace,Menlo,monospace;padding:14px 18px;'
      + 'border-radius:8px;min-width:420px;';
    document.body.appendChild(this.el);
    this.el.innerHTML = `<b>Joystick check (J to close)</b>
      <div id="joy-name" style="margin:6px 0 8px">No joystick found: plug it in and move the stick.</div>
      <div id="joy-axes"></div><div id="joy-buttons" style="margin:6px 0 10px"></div>
      <table>${FUNCTIONS.map(([key, label]) => `<tr><td>${label}</td>
        <td>axis <select data-fn="${key}">${[...Array(10).keys()].map((i) => `<option value="${i}">${i}</option>`).join('')}</select></td>
        <td><label><input type="checkbox" data-inv="${key}"> reverse</label></td></tr>`).join('')}</table>
      <button id="joy-reset" style="margin-top:8px">Reset to default</button>`;
    this.el.querySelectorAll('select').forEach((s) => s.addEventListener('change', () => {
      this.joystick.mapping[s.dataset.fn].axis = Number(s.value);
      this.joystick.saveMapping();
    }));
    this.el.querySelectorAll('input[type=checkbox]').forEach((c) => c.addEventListener('change', () => {
      this.joystick.mapping[c.dataset.inv].invert = c.checked;
      this.joystick.saveMapping();
    }));
    this.el.querySelector('#joy-reset').addEventListener('click', () => {
      this.joystick.mapping = structuredClone(DEFAULT_MAPPING);
      this.joystick.saveMapping();
      this.syncControls();
    });
    this.syncControls();
    this.visible = false;
  }

  syncControls() {
    for (const [key] of FUNCTIONS) {
      this.el.querySelector(`select[data-fn="${key}"]`).value = String(this.joystick.mapping[key].axis);
      this.el.querySelector(`input[data-inv="${key}"]`).checked = this.joystick.mapping[key].invert;
    }
  }

  toggle() {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'block' : 'none';
  }

  update() {
    if (!this.visible) return;
    const pad = this.joystick.pad;
    this.el.querySelector('#joy-name').textContent = pad ? pad.id : 'No joystick found: plug it in and move the stick.';
    if (!pad) return;
    const bar = (v) => {
      const n = Math.round((v + 1) * 10);
      return `[${'#'.repeat(n).padEnd(20, '.')}] ${v.toFixed(2).padStart(5)}`;
    };
    this.el.querySelector('#joy-axes').innerHTML = pad.axes.map((v, i) => `axis ${i}: ${bar(v)}`).join('<br>');
    this.el.querySelector('#joy-buttons').textContent = `buttons pressed: ${pad.buttons.map((b, i) => (b.pressed ? i : null)).filter((i) => i !== null).join(' ') || 'none'}`;
  }
}
