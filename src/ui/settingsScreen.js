// The settings screen (Phase 7 checkpoint 6, D232), reached from the main menu and the pause menu: sound (volume and
// on/off), graphics (Low, Medium, High), the modern HUD in the cockpit, the four assists (each off unless switched on,
// D16), and the controls (the Controls screen for keys and joystick buttons, D238; the key list; the joystick panel).

const ASSISTS = [
  ['autoRudder', 'Auto-rudder', 'Rudder against the sideslip while your feet are off the pedals.'],
  ['stallWarning', 'Stall warning', 'A beep and a red line close to the stall.'],
  ['gWarning', 'g warning', 'A double beep and a red line near the airframe\'s g limit.'],
  ['engineManagement', 'Engine management', 'Automatic airscrew pitch (Bf 109, Bf 110) and radiator.'],
  ['overspeedWarning', 'Overspeed warning', 'A triple beep and a red line when an engine is over its red line, or in a dive near the airframe\'s limit.'],
];
const GRAPHICS = [['high', 'High'], ['medium', 'Medium'], ['low', 'Low']];

const el = (tag, props = {}, ...children) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
};

/**
 * Draws the settings in `container` for `values` (src/core/settings.js). `onChange(changes)` saves a change and
 * returns the new values; `sound` is { on, toggle() } (D231); `onJoystick` opens the joystick panel; `helpHtml` is the
 * key list; `onBack` leaves.
 */
export function renderSettings(container, values, { onChange, onBack, onJoystick, onControls, sound, helpHtml }) {
  let v = values;
  let showKeys = false;
  const draw = () => {
    container.replaceChildren(el('h2', { textContent: 'Settings' }));
    const table = el('table');
    const row = (label, ...cells) => table.append(el('tr', {}, el('th', { textContent: label }), el('td', {}, ...cells)));
    // Sound.
    const volume = el('input', { type: 'range', min: 0, max: 100, step: 5, value: v.volume });
    const volumeText = el('span', { textContent: ` ${v.volume}%` });
    volume.addEventListener('input', () => { v = onChange({ volume: Number(volume.value) }); volumeText.textContent = ` ${v.volume}%`; });
    row('Volume', volume, volumeText);
    const engine = el('input', { type: 'range', min: 0, max: 100, step: 5, value: v.engineVolume });
    const engineText = el('span', { textContent: ` ${v.engineVolume}%` });
    engine.addEventListener('input', () => { v = onChange({ engineVolume: Number(engine.value) }); engineText.textContent = ` ${v.engineVolume}%`; });
    row('Engine volume', engine, engineText);
    if (sound) {
      const box = el('input', { type: 'checkbox', checked: sound.on });
      box.addEventListener('change', () => { box.checked = sound.toggle(); });
      row('Sound', el('label', {}, box, ' on'));
    }
    // Graphics.
    const graphics = el('select');
    for (const [value, label] of GRAPHICS) graphics.append(el('option', { value, textContent: label, selected: value === v.graphics }));
    graphics.addEventListener('change', () => { v = onChange({ graphics: graphics.value }); });
    row('Graphics', graphics, el('span', { className: 'menu-note', textContent: ' sharpness at once; land, towns and clouds on the next flight' }));
    // HUD.
    const hud = el('input', { type: 'checkbox', checked: v.hudInCockpit });
    hud.addEventListener('change', () => { v = onChange({ hudInCockpit: hud.checked }); });
    row('Modern HUD', el('label', {}, hud, ' in the cockpit too'));
    const mouse = el('input', { type: 'checkbox', checked: v.mouseFlight });
    mouse.addEventListener('change', () => { v = onChange({ mouseFlight: mouse.checked }); });
    const feel = el('select');
    for (const [value, label] of [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]) feel.append(el('option', { value, textContent: `${label} sensitivity`, selected: value === v.mouseSensitivity }));
    feel.addEventListener('change', () => { v = onChange({ mouseSensitivity: feel.value }); });
    row('Mouse flying', el('label', {}, mouse, ' the mouse flies '), feel, el('div', {
      className: 'menu-note',
      textContent: 'Click the view to take the mouse (Esc frees it). Mouse moves the stick, the wheel the throttle, the middle button or Num 5 centres. Look round with the hat or Num 4 / 6 / 2 / 8.',
    }));
    const pointers = el('input', { type: 'checkbox', checked: v.enemyPointers });
    pointers.addEventListener('change', () => { v = onChange({ enemyPointers: pointers.checked }); });
    row('Enemy pointers', el('label', {}, pointers, ' on'), el('div', { className: 'menu-note', textContent: 'Red arrowheads along the top for enemies within 5 km: ahead in the middle, behind at the ends; pointing up above you, down below.' }));
    // Assists.
    for (const [key, label, about] of ASSISTS) {
      const box = el('input', { type: 'checkbox', checked: v.assists[key] });
      box.addEventListener('change', () => { v = onChange({ assists: { [key]: box.checked } }); });
      row(label, el('label', {}, box, ' on'), el('div', { className: 'menu-note', textContent: about }));
    }
    container.append(table);
    const buttons = el('div', { className: 'menu-buttons' });
    const button = (label, action) => {
      const b = el('button', { textContent: label });
      b.addEventListener('click', action);
      buttons.append(b);
    };
    if (onControls) button('Controls (keys and joystick buttons)', onControls);
    button(showKeys ? 'Hide the key list' : 'Key list', () => { showKeys = !showKeys; draw(); });
    if (onJoystick) button('Joystick axes and calibration', onJoystick);
    button('Back', onBack);
    container.append(buttons);
    if (showKeys) container.append(el('div', { className: 'menu-note settings-keys', innerHTML: helpHtml }));
    container.append(el('p', { className: 'menu-note', textContent: 'Assists are off unless switched on.' }));
  };
  draw();
}
