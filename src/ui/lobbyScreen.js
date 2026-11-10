// The room's lobby (Phase 9, D245; after Dawn Patrol's src/ui/screens/lobby.js, with the product owner's approval):
// the room code to send the others, the players (side, fighter, ready, host, connection), your own side, fighter and
// ready, and the host's match settings, start and respawn among them (the product owner, 10 Nov 2026), which the
// others see but can't change. It draws what the server last sent (mpClient.state) and passes choices on.

import { el, buttonRow } from './mpScreens.js';
import { timeLabel } from './missionSetup.js';
import { aircraftById } from '../aircraft/index.js';
import { TEAMS, TEAM_IDS, SETTING_CHOICES } from '../mp/netConfig.js';
import { aircraftOfTeam } from '../mp/roomCore.js';

const PLACES = { air: 'In the air: 8,000 ft, 5 km from the enemy', apron: 'On the airfield apron' };
// The host's settings: [key, label, value → text].
const SETTING_ROWS = [
  ['start', 'Start', (v) => PLACES[v]],
  ['respawn', 'Back after going down', (v) => PLACES[v]],
  ['hoursUtc', 'Time (15 Aug 1940)', timeLabel],
  ['scoreLimit', 'Score to win', (v) => `${v} kills`],
  ['timeLimit', 'Time limit', (v) => `${v} minutes`],
  ['friendlyFire', 'Friendly fire', (v) => (v ? 'On (you can hit your own side)' : 'Off')],
  ['structuralDamage', 'Structural damage', (v) => (v ? 'On (too much g or speed breaks the airframe)' : 'Off')],
];
const aircraftName = (id) => aircraftById[id]?.name ?? id;

/** A drop-down of [value, text] with `value` chosen; onPick(value) with the choice's own value (number, boolean, text). */
function select(options, value, onPick, disabled = false) {
  const s = el('select');
  for (const [v, text] of options) s.appendChild(Object.assign(el('option', '', text), { value: String(v) }));
  s.value = String(value);
  s.disabled = disabled;
  s.addEventListener('change', () => onPick(options.find(([v]) => String(v) === s.value)?.[0]));
  return s;
}

/**
 * The lobby: client (src/net/mpClient.js), note (the room's latest notice), ping (ms or null), netsim (the test
 * network in words, '' when off), onLeave(). Called again whenever the room changes.
 */
export function renderLobby(panel, { client, note = '', ping = null, netsim = '', onLeave }) {
  const { lobby, status, message } = client.state;
  if (!lobby) return;
  const me = client.me;
  const host = client.isHost;
  panel.replaceChildren(el('h2', '', 'Room'));
  const code = panel.appendChild(el('p', 'menu-code', lobby.code));
  const [copy] = buttonRow(panel, [['Copy the code', () => {
    navigator.clipboard?.writeText(lobby.code).then(() => { copy.textContent = 'Copied: send it to the others'; }, () => { copy.textContent = 'Could not copy: read it out instead'; });
  }]]);
  code.title = 'Send this code to the others';
  panel.appendChild(el('p', 'menu-message', status === 'reconnecting' ? 'Connection lost: reconnecting...' : message || note));

  // The players.
  const roster = panel.appendChild(el('table'));
  const head = roster.appendChild(el('tr'));
  for (const t of ['Pilot', 'Side', 'Fighter', '']) head.appendChild(el('th', '', t));
  for (const p of lobby.players) {
    const tr = roster.appendChild(el('tr'));
    const who = `${p.name}${p.id === lobby.hostId ? ' ★ host' : ''}${p.id === client.state.you ? ' (you)' : ''}`;
    const state = !p.connected ? 'reconnecting...' : p.ready ? 'READY' : 'not ready';
    for (const t of [who, TEAMS[p.team], aircraftName(p.aircraft), state]) tr.appendChild(el('td', '', t));
  }

  // Your side, fighter and ready.
  if (me) {
    panel.appendChild(el('h3', '', 'You'));
    const yours = panel.appendChild(el('table'));
    const row = (label, control) => {
      const tr = yours.appendChild(el('tr'));
      tr.append(el('th', '', label), el('td').appendChild(control).parentNode);
    };
    row('Side', select(TEAM_IDS.map((t) => [t, TEAMS[t]]), me.team, (v) => client.setTeam(v)));
    row('Fighter', select(aircraftOfTeam(me.team).map((id) => [id, aircraftName(id)]), me.aircraft, (v) => client.setAircraft(v)));
    buttonRow(panel, [[me.ready ? 'Not ready after all' : 'I am ready', () => client.setReady(!me.ready)]]);
  }

  // The host's settings.
  panel.appendChild(el('h3', '', host ? 'Match settings (you are the host)' : 'Match settings (set by the host)'));
  const settings = panel.appendChild(el('table'));
  for (const [key, label, text] of SETTING_ROWS) {
    const tr = settings.appendChild(el('tr'));
    const control = select(SETTING_CHOICES[key].map((v) => [v, text(v)]), lobby.settings[key], (v) => client.setSettings({ [key]: v }), !host);
    tr.append(el('th', '', label), el('td').appendChild(control).parentNode);
  }

  const can = lobby.canStart;
  panel.appendChild(el('p', 'menu-note', can.ok ? (host ? 'Everyone is ready: start when you like.' : 'Everyone is ready: waiting for the host to start.') : can.reason));
  const list = host ? [['Start the match', () => client.startMatch()]] : [];
  list.push(['Leave the room', onLeave]);
  const [start] = buttonRow(panel, list);
  if (host) start.disabled = !can.ok;
  panel.appendChild(el('p', 'menu-note', `${ping === null ? 'Ping: measuring...' : `Ping ${Math.round(ping)} ms`}${netsim ? ` (test network: ${netsim})` : ''}`));
}
