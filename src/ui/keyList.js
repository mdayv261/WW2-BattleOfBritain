// The key list (H, and Settings → Keys): every action with the key the player has bound to it (src/input/bindings.js,
// D238), by group, then the keys that are fixed: Esc, the mouse, and the test flight's test keys.

import { ACTIONS, GROUPS, keyLabel } from '../input/bindings.js';

const escape = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const FIXED = [
  ['Esc', 'pause menu (resume, restart or end the mission, settings, main menu)'],
  ['Mouse', 'drag to look around; wheel to zoom; double-click to look ahead'],
  ['1 – 5', 'test flight: Hurricane, Spitfire, Bf 109, Bf 110, He 111'],
  ['R  N', 'test flight: restart; next start (ground, approach, air)'],
  ['6  7  8  0', 'test flight AI: enemy fighters / a bomber formation / AI skill / clear the AI'],
  ['Shift+7  9', 'test flight: twelve aircraft (frame-rate check) / a test 20 mm hit on your own aircraft'],
];

/** The key list as HTML, for `bindings`. */
export function keyListHtml(bindings) {
  const row = (keys, label) => `<tr><td style="white-space:nowrap;padding-right:10px">${escape(keys)}</td><td>${escape(label)}</td></tr>`;
  const groups = GROUPS.map((g) => {
    const rows = ACTIONS.filter((a) => a.group === g).map((a) => row(bindings.of(a.id).map(keyLabel).join(' / ') || '(none)', a.label));
    return `<div style="break-inside:avoid;margin-bottom:6px"><b>${g}</b><table>${rows.join('')}</table></div>`;
  });
  const fixed = `<div style="break-inside:avoid"><b>Fixed keys</b><table>${FIXED.map(([k, l]) => row(k, l)).join('')}</table></div>`;
  return `<b>Battle of Britain 1940 — keys</b> <span style="opacity:0.7">(change them in Settings → Controls)</span>`
    + `<div style="column-count:2;column-gap:18px;margin-top:6px">${groups.join('')}${fixed}</div>`
    + 'Joystick: trigger machine guns, thumb button cannon, hat to look round; the buttons are set in Settings → Controls.';
}
