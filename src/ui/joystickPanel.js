// Joystick check panel (J): shows every raw axis and button live, and lets the player choose which
// axis drives roll, pitch, rudder, throttle and the hat (and whether each is reversed), and which button
// works the brakes, flaps, undercarriage and view. Kept in browser storage.

import { DEFAULT_MAPPING, hatDirection } from '../input/joystick.js';

const FUNCTIONS = [['roll', 'Roll'], ['pitch', 'Pitch (pull back = +)'], ['yaw', 'Rudder (twist)'], ['throttle', 'Throttle slider']];
const BUTTONS = [['brake', 'Brakes (hold)'], ['flapsUp', 'Flaps up a stop'], ['flapsDown', 'Flaps down a stop'], ['gear', 'Undercarriage'], ['view', 'Cockpit / outside']];
const HAT_NAMES = ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'];

const options = (n) => [...Array(n).keys()].map((i) => `<option value="${i}">${i}</option>`).join('');

export class JoystickPanel {
  constructor(joystick) {
    this.joystick = joystick;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);display:none;'
      + 'background:rgba(20,28,36,0.92);color:#e8edf2;font:13px/1.5 ui-monospace,Menlo,monospace;padding:14px 18px;'
      + 'border-radius:8px;min-width:440px;max-height:90vh;overflow:auto;z-index:10;';
    document.body.appendChild(this.el);
    this.el.innerHTML = `<b>Joystick check (J to close)</b>
      <div id="joy-name" style="margin:6px 0 8px">No joystick found: plug it in and move the stick.</div>
      <div id="joy-axes"></div><div id="joy-buttons" style="margin:6px 0"></div><div id="joy-hat" style="margin:0 0 10px"></div>
      <table>${FUNCTIONS.map(([key, label]) => `<tr><td>${label}</td>
        <td>axis <select data-fn="${key}">${options(10)}</select></td>
        <td><label><input type="checkbox" data-inv="${key}"> reverse</label></td></tr>`).join('')}
        <tr><td>Hat (look around)</td><td>axis <select data-hat="1">${options(10)}</select></td><td></td></tr>
        ${BUTTONS.map(([key, label]) => `<tr><td>${label}</td><td>button <select data-btn="${key}">${options(12)}</select></td><td></td></tr>`).join('')}
      </table>
      <div style="margin-top:6px;opacity:0.8">Buttons count from 0: button 1 is the one printed "2" (the thumb button).</div>
      <button id="joy-reset" style="margin-top:8px">Reset to default</button>`;
    const save = () => this.joystick.saveMapping();
    this.el.querySelectorAll('select[data-fn]').forEach((s) => s.addEventListener('change', () => {
      this.joystick.mapping[s.dataset.fn].axis = Number(s.value);
      save();
    }));
    this.el.querySelectorAll('input[type=checkbox]').forEach((c) => c.addEventListener('change', () => {
      this.joystick.mapping[c.dataset.inv].invert = c.checked;
      save();
    }));
    this.el.querySelector('select[data-hat]').addEventListener('change', (e) => {
      this.joystick.mapping.hat.axis = Number(e.target.value);
      save();
    });
    this.el.querySelectorAll('select[data-btn]').forEach((s) => s.addEventListener('change', () => {
      this.joystick.mapping.buttons[s.dataset.btn] = Number(s.value);
      save();
    }));
    this.el.querySelector('#joy-reset').addEventListener('click', () => {
      this.joystick.mapping = structuredClone(DEFAULT_MAPPING);
      save();
      this.syncControls();
    });
    this.syncControls();
    this.visible = false;
  }

  syncControls() {
    const m = this.joystick.mapping;
    for (const [key] of FUNCTIONS) {
      this.el.querySelector(`select[data-fn="${key}"]`).value = String(m[key].axis);
      this.el.querySelector(`input[data-inv="${key}"]`).checked = m[key].invert;
    }
    this.el.querySelector('select[data-hat]').value = String(m.hat.axis);
    for (const [key] of BUTTONS) this.el.querySelector(`select[data-btn="${key}"]`).value = String(m.buttons[key]);
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
      const n = Math.max(0, Math.min(20, Math.round((v + 1) * 10)));
      return `[${'#'.repeat(n).padEnd(20, '.')}] ${v.toFixed(2).padStart(5)}`;
    };
    this.el.querySelector('#joy-axes').innerHTML = pad.axes.map((v, i) => `axis ${i}: ${bar(v)}`).join('<br>');
    this.el.querySelector('#joy-buttons').textContent = `buttons pressed: ${pad.buttons.map((b, i) => (b.pressed ? i : null)).filter((i) => i !== null).join(' ') || 'none'}`;
    const dir = hatDirection(pad.axes[this.joystick.mapping.hat.axis]);
    this.el.querySelector('#joy-hat').textContent = `hat: ${dir === null ? 'centred' : HAT_NAMES[dir]}`;
  }
}
