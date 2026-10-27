// Joystick check panel (J): shows every raw axis and button live, and lets the player choose which
// axis drives roll, pitch, rudder, throttle and the hat (and whether each is reversed), and which button
// works the elevator trim, brakes, flaps, undercarriage and view. Kept in browser storage. Axes 0-5 each have a
// "Set neutral" button that takes the hands-off reading as 0.00 (D70); their bars show the calibrated reading. Roll,
// pitch and rudder each have a sensitivity choice (D71).

import { DEFAULT_MAPPING, CALIBRATED_AXES, SENSITIVITIES, FLIGHT_AXES, hatDirection } from '../input/joystick.js';

const FUNCTIONS = [['roll', 'Roll'], ['pitch', 'Pitch (pull back = +)'], ['yaw', 'Rudder (twist)'], ['throttle', 'Throttle slider']];
const BUTTONS = [
  ['trimUp', 'Elevator trim nose up (hold)'], ['trimDown', 'Elevator trim nose down (hold)'], ['brake', 'Brakes (hold)'],
  ['flapsUp', 'Flaps up a stop'], ['flapsDown', 'Flaps down a stop'], ['gear', 'Undercarriage'], ['view', 'Cockpit / outside'],
];
// Sensitivity choices, each with what half stick gives.
const sensitivityOptions = SENSITIVITIES.map(([name, k]) => `<option value="${k}">${name} (half stick ${Math.round(100 * 0.5 ** k)}%)</option>`).join('');
const AXES = 10; // axis rows drawn (those the joystick lacks are hidden)
const HAT_NAMES = ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'];

const options = (n) => [...Array(n).keys()].map((i) => `<option value="${i}">${i}</option>`).join('');
// Buttons are listed by the number printed on the stick (one more than the browser's index).
const buttonOptions = (n) => [...Array(n).keys()].map((i) => `<option value="${i}">${i + 1}</option>`).join('');

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
      <div style="margin-bottom:4px;opacity:0.8">To set neutral: leave the stick and twist alone (hands off), then press the button.</div>
      <div id="joy-axes">${[...Array(AXES).keys()].map((i) => `<div data-axis-row="${i}">axis ${i}: <span data-axis="${i}" style="white-space:pre"></span>${
        CALIBRATED_AXES.includes(i) ? ` <button data-centre="${i}">Set neutral</button> <span data-centre-shown="${i}" style="opacity:0.8"></span>` : ''}</div>`).join('')}</div>
      <button id="joy-centre-all" style="margin-top:4px">Set all neutral (hands off)</button>
      <button id="joy-centre-clear" style="margin-top:4px">Clear neutral settings</button>
      <div id="joy-buttons" style="margin:6px 0"></div><div id="joy-hat" style="margin:0 0 10px"></div>
      <table>${FUNCTIONS.map(([key, label]) => `<tr><td>${label}</td>
        <td>axis <select data-fn="${key}">${options(10)}</select></td>
        <td><label><input type="checkbox" data-inv="${key}"> reverse</label></td>
        <td>${FLIGHT_AXES.includes(key) ? `sensitivity <select data-curve="${key}">${sensitivityOptions}</select>` : ''}</td></tr>`).join('')}
        <tr><td>Hat (look around)</td><td>axis <select data-hat="1">${options(10)}</select></td><td></td></tr>
        ${BUTTONS.map(([key, label]) => `<tr><td>${label}</td><td>button <select data-btn="${key}">${buttonOptions(12)}</select></td><td></td></tr>`).join('')}
      </table>
      <div style="margin-top:6px;opacity:0.8">Sensitivity: lower softens small stick movements; full stick always gives full control.</div>
      <div style="opacity:0.8">Buttons are numbered as printed on the stick (the trigger is 1, the thumb button 2).</div>
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
    this.el.querySelectorAll('select[data-curve]').forEach((s) => s.addEventListener('change', () => {
      this.joystick.mapping[s.dataset.curve].curve = Number(s.value);
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
    this.el.querySelectorAll('button[data-centre]').forEach((b) => b.addEventListener('click', () => {
      this.joystick.setCentre(Number(b.dataset.centre));
    }));
    this.el.querySelector('#joy-centre-all').addEventListener('click', () => {
      for (const i of CALIBRATED_AXES) this.joystick.setCentre(i);
    });
    this.el.querySelector('#joy-centre-clear').addEventListener('click', () => this.joystick.clearCentres());
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
    for (const key of FLIGHT_AXES) this.el.querySelector(`select[data-curve="${key}"]`).value = String(m[key].curve ?? 1);
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
    for (let i = 0; i < AXES; i += 1) {
      this.el.querySelector(`[data-axis-row="${i}"]`).style.display = i < pad.axes.length ? '' : 'none';
      if (i >= pad.axes.length) continue;
      this.el.querySelector(`[data-axis="${i}"]`).textContent = bar(this.joystick.axis(i));
      const shown = this.el.querySelector(`[data-centre-shown="${i}"]`);
      const c = this.joystick.mapping.centres?.[i];
      if (shown) shown.textContent = c ? `centre ${c.toFixed(2)}` : '';
    }
    this.el.querySelector('#joy-buttons').textContent = `buttons pressed: ${pad.buttons.map((b, i) => (b.pressed ? i + 1 : null)).filter((i) => i !== null).join(' ') || 'none'}`;
    const dir = hatDirection(pad.axes[this.joystick.mapping.hat.axis]);
    this.el.querySelector('#joy-hat').textContent = `hat: ${dir === null ? 'centred' : HAT_NAMES[dir]}`;
  }
}
