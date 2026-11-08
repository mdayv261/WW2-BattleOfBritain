// The mission setup screen (Phase 7 checkpoint 1, D225): side, aircraft, mission type, enemy type and number, skill,
// start height and time of day. The choices are worked out by plain functions (tested without a page); `renderSetup`
// builds the form in a container element.
//   Heights: 1,000-8,000 m in steps of 500 m, shown in each side's units (RAF feet, Luftwaffe metres; CLAUDE.md).
//   Time of day: the chosen date (15 August 1940 unless given), in half-hour steps, in daylight only: the sun at least
//     MIN_SUN degrees up over the map (src/world/sun.js). Times are shown in UTC; local times are a later choice.
//   Enemy number: 1 to MAX_ENEMIES, inside the game's twelve-aircraft limit (src/core/scenarios.js MAX_AI).

import { aircraftById } from '../aircraft/index.js';
import { SKILLS } from '../ai/skill.js';
import { MAX_AI } from '../core/scenarios.js';
import { sunPosition } from '../world/sun.js';
import { UNIT } from '../core/constants.js';

export const MIN_SUN = 5; // degrees: the lowest sun a mission may start under
export const MAX_ENEMIES = Math.min(6, MAX_AI);
const HEIGHTS = { from: 1000, to: 8000, step: 500 }; // m

/** The flyable aircraft of each side (the He 111 is AI only). */
export const FLYABLE = { RAF: ['hurricane', 'spitfire'], Luftwaffe: ['bf109e4', 'bf110c4'] };
/** The fighters each side meets in a dogfight. */
export const ENEMIES = { RAF: ['bf109e4', 'bf110c4'], Luftwaffe: ['hurricane', 'spitfire'] };
export const MISSION_TYPES = { dogfight: 'Dogfight' };

/** The start heights (m) on offer, with their labels in `side`'s units. [{ value, label }] */
export function heightChoices(side) {
  const out = [];
  for (let m = HEIGHTS.from; m <= HEIGHTS.to; m += HEIGHTS.step) {
    const label = side === 'RAF' ? `${(Math.round(m / UNIT.FT / 100) * 100).toLocaleString('en-GB')} ft` : `${m.toLocaleString('de-DE')} m`;
    out.push({ value: m, label });
  }
  return out;
}

/** The daylight start times (UTC hours, half-hour steps) on `date`: the sun at least MIN_SUN degrees up. */
export function daylightHours(date) {
  const out = [];
  for (let h = 0; h < 24; h += 0.5) if (sunPosition({ ...date, hoursUtc: h }).elevation >= MIN_SUN) out.push(h);
  return out;
}

/** "14:30 UTC" for 14.5. */
export const timeLabel = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'} UTC`;

const nearest = (list, value) => list.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a), list[0]);

/** A setup made consistent: the aircraft and enemy belong to the side, the number, height and time are on offer. */
export function normaliseSetup(setup) {
  const s = { ...setup };
  if (!FLYABLE[s.side]) s.side = 'RAF';
  if (!FLYABLE[s.side].includes(s.aircraft)) [s.aircraft] = FLYABLE[s.side];
  if (!ENEMIES[s.side].includes(s.enemy)) [s.enemy] = ENEMIES[s.side];
  if (!MISSION_TYPES[s.type]) s.type = 'dogfight';
  if (!SKILLS[s.skill]) s.skill = 'regular';
  s.count = Math.max(1, Math.min(MAX_ENEMIES, Math.round(s.count) || 1));
  s.altitude = nearest(heightChoices(s.side).map((c) => c.value), s.altitude);
  s.hoursUtc = nearest(daylightHours(s.date), s.hoursUtc);
  return s;
}

/** Builds a <select> from [{ value, label }], calling `onPick(value)` on change. */
function select(choices, current, onPick) {
  const el = document.createElement('select');
  for (const { value, label } of choices) {
    const o = document.createElement('option');
    o.value = String(value);
    o.textContent = label;
    if (value === current) o.selected = true;
    el.appendChild(o);
  }
  el.addEventListener('change', () => onPick(choices[el.selectedIndex].value));
  return el;
}

/**
 * Renders the setup form in `container` for `setup`; any change re-renders it with the normalised setup. `onFly(setup)`
 * starts the mission, `onBack()` returns to the main menu.
 */
export function renderSetup(container, setup, { onFly, onBack }) {
  let s = normaliseSetup(setup);
  const draw = () => {
    container.replaceChildren();
    const title = document.createElement('h2');
    title.textContent = 'Mission setup';
    container.appendChild(title);
    const table = document.createElement('table');
    const row = (label, el) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.textContent = label;
      const td = document.createElement('td');
      td.appendChild(el);
      tr.append(th, td);
      table.appendChild(tr);
    };
    const set = (key) => (value) => { s = normaliseSetup({ ...s, [key]: value }); draw(); };
    const named = (ids) => ids.map((id) => ({ value: id, label: aircraftById[id].name }));
    row('Side', select([{ value: 'RAF', label: 'RAF' }, { value: 'Luftwaffe', label: 'Luftwaffe' }], s.side, set('side')));
    row('Aircraft', select(named(FLYABLE[s.side]), s.aircraft, set('aircraft')));
    row('Mission', select(Object.entries(MISSION_TYPES).map(([value, label]) => ({ value, label })), s.type, set('type')));
    row('Enemy', select(named(ENEMIES[s.side]), s.enemy, set('enemy')));
    row('Number', select(Array.from({ length: MAX_ENEMIES }, (_, i) => ({ value: i + 1, label: String(i + 1) })), s.count, set('count')));
    row('Enemy skill', select(Object.entries(SKILLS).map(([value, k]) => ({ value, label: k.name })), s.skill, set('skill')));
    row('Start height', select(heightChoices(s.side), s.altitude, set('altitude')));
    row('Time (15 Aug 1940)', select(daylightHours(s.date).map((h) => ({ value: h, label: timeLabel(h) })), s.hoursUtc, set('hoursUtc')));
    container.appendChild(table);
    const buttons = document.createElement('div');
    buttons.className = 'menu-buttons';
    const button = (label, action) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.addEventListener('click', action);
      buttons.appendChild(b);
    };
    button('Fly', () => onFly(s));
    button('Back', onBack);
    container.appendChild(buttons);
  };
  draw();
}
