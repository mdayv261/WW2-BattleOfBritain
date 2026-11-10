// The Controls screen (Phase 8 checkpoint 1, D238; Settings → Controls): every action with its key and, where a
// joystick button can do it, its button. Click a key to change it ("press a key…", Esc to cancel); a key another action
// already uses is offered as a swap, so no key is ever bound twice. A joystick button is set the same way by pressing
// it. "Reset to defaults" restores the game's own keys. The joystick's axes and their calibration stay in the joystick
// panel (J), reached from here.

import { ACTIONS, GROUPS, RESERVED, keyLabel, comboOf } from '../input/bindings.js';

/** The joystick mapping's button for each action that a button can do (src/input/joystick.js DEFAULT_MAPPING). */
export const JOY_BUTTONS = {
  fireMg: 'fireMg', fireCannon: 'fireCannon', flapsUp: 'flapsUp', flapsDown: 'flapsDown', gear: 'gear', brakes: 'brake',
  trimUp: 'trimUp', trimDown: 'trimDown', rpmUp: 'pitchFine', rpmDown: 'pitchCoarse', cockpit: 'view', bailOut: 'bailOut',
  seat: 'seat',
};

const el = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
};

/**
 * Assigns joystick button `index` to the mapping's `name`, swapping with any other name that had it. Returns the name
 * swapped with, or null.
 */
export function assignButton(mapping, name, index) {
  const other = Object.keys(mapping.buttons).find((n) => n !== name && mapping.buttons[n] === index) ?? null;
  if (other) mapping.buttons[other] = mapping.buttons[name] ?? -1;
  mapping.buttons[name] = index;
  return other;
}

/**
 * Draws the Controls screen in `container`. `bindings`: the keys (src/input/bindings.js); `joystick`: the stick
 * (its mapping and pad); `onChange()` after any change (the key list redraws); `onJoystick` opens the joystick panel;
 * `onBack` leaves.
 */
export function renderControls(container, { bindings, joystick, onChange = () => {}, onJoystick, onBack }) {
  let capture = null; // { kind: 'key' | 'button', id, note }
  let stop = () => {};
  const label = (id) => ACTIONS.find((a) => a.id === id)?.label ?? id;

  const finish = (note) => {
    stop();
    capture = note ? { note } : null;
    onChange();
    draw();
  };

  /** Waits for a key for action `id`: Esc cancels; a key in use asks to swap. */
  const takeKey = (id) => {
    const onKey = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation(); // the game doesn't act on it meanwhile
      if (e.code === 'Escape') return finish('Cancelled.');
      if (RESERVED.has(e.code)) return undefined; // Shift alone: wait for the key
      const key = comboOf(e);
      const other = bindings.user(key, id);
      if (other) {
        // In use: ask on the screen whether to swap (no browser dialog).
        stop();
        capture = { kind: 'swap', id, key, other, note: `${keyLabel(key)} is used by "${label(other)}". Swap the two?` };
        draw();
        return undefined;
      }
      bindings.bind(id, key);
      return finish(`${keyLabel(key)} now: ${label(id)}.`);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    stop = () => window.removeEventListener('keydown', onKey, { capture: true });
  };

  /** Waits for a joystick button for action `id` (polling the pad, as the browser gives no button events). */
  const takeButton = (id) => {
    const name = JOY_BUTTONS[id];
    const was = new Set((joystick.pad?.buttons ?? []).map((b, i) => (b.pressed ? i : -1)));
    let frame = 0;
    const onKey = (e) => {
      if (e.code !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      finish('Cancelled.');
    };
    const look = () => {
      joystick.poll?.();
      const pressed = (joystick.pad?.buttons ?? []).findIndex((b, i) => b.pressed && !was.has(i));
      if (pressed >= 0) {
        const swapped = assignButton(joystick.mapping, name, pressed);
        joystick.saveMapping();
        const other = swapped ? Object.keys(JOY_BUTTONS).find((k) => JOY_BUTTONS[k] === swapped) : null;
        finish(`Button ${pressed + 1} now: ${label(id)}.${other ? ` ${label(other)} took its old button.` : ''}`);
        return;
      }
      frame = requestAnimationFrame(look);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    frame = requestAnimationFrame(look);
    stop = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey, { capture: true });
    };
  };

  const draw = () => {
    container.replaceChildren(el('h2', { textContent: 'Controls' }));
    container.append(el('p', {
      className: 'menu-note',
      textContent: capture?.note ?? 'Click a key or a button to change it. A key already in use is offered as a swap. Esc and the test flight\'s test keys are fixed.',
    }));
    if (capture?.kind === 'swap') {
      const { id, key, other } = capture;
      const swap = el('button', { textContent: 'Swap', className: 'menu-key' });
      swap.addEventListener('click', () => {
        bindings.bind(id, key);
        finish(`${keyLabel(key)} now: ${label(id)}. ${label(other)} took its old key.`);
      });
      const cancel = el('button', { textContent: 'Cancel', className: 'menu-key' });
      cancel.addEventListener('click', () => finish('Cancelled.'));
      container.append(el('p', {}, swap, ' ', cancel));
    }
    const columns = el('div', { style: 'column-count:2;column-gap:24px;max-width:860px' });
    for (const g of GROUPS) {
      const table = el('table', { style: 'break-inside:avoid;margin-bottom:8px' });
      table.append(el('tr', {}, el('th', { textContent: g, style: 'font-weight:bold' })));
      for (const a of ACTIONS.filter((x) => x.group === g)) {
        const keyBtn = el('button', { textContent: bindings.of(a.id).map(keyLabel).join(' / ') || '(none)', className: 'menu-key' });
        keyBtn.addEventListener('click', () => {
          stop();
          capture = { kind: 'key', id: a.id, note: `Press a key for "${a.label}" (Esc to cancel)…` };
          draw();
          takeKey(a.id);
        });
        const cells = [el('td', {}, keyBtn)];
        const name = JOY_BUTTONS[a.id];
        if (name && joystick) {
          const b = joystick.mapping.buttons[name];
          const joyBtn = el('button', { textContent: b >= 0 ? `Btn ${b + 1}` : '—', className: 'menu-key' });
          joyBtn.addEventListener('click', () => {
            stop();
            capture = { kind: 'button', id: a.id, note: `Press a joystick button for "${a.label}" (Esc to cancel)…` };
            draw();
            takeButton(a.id);
          });
          cells.push(el('td', {}, joyBtn));
        }
        table.append(el('tr', {}, el('th', { textContent: a.label }), ...cells));
      }
      columns.append(table);
    }
    container.append(columns);
    const buttons = el('div', { className: 'menu-buttons' });
    const button = (text, action) => {
      const b = el('button', { textContent: text });
      b.addEventListener('click', action);
      buttons.append(b);
    };
    button('Reset keys to defaults', () => {
      bindings.reset();
      finish('The keys are back to the defaults.');
    });
    if (onJoystick) button('Joystick axes and calibration', onJoystick);
    button('Back', () => {
      stop();
      onBack();
    });
    container.append(buttons);
  };
  draw();
}
