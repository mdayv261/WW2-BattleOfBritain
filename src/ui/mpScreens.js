// The multiplayer screens (Phase 9, D245; after Dawn Patrol's src/ui/screens, with the product owner's approval, drawn
// in this game's menu panel, src/ui/menus.js): the Multiplayer screen (your name, create or join a room, the test
// network), the match's Esc menu (the match never pauses), and the results. The lobby is src/ui/lobbyScreen.js. Each
// draws into the menu panel and calls back; src/net/multiplayer.js does the rest.

import { NAME_MAX, CODE_LENGTH, TEAMS } from '../mp/netConfig.js';
import { NETSIM_LIMITS, cleanNetsim } from '../net/netSim.js';

/** A new element: tag, its class, its text. */
export function el(tag, className = '', text = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

/** A row of the panel's olive buttons: [[label, action]]. Returns the buttons. */
export function buttonRow(parent, list) {
  const box = el('div', 'menu-buttons');
  const out = list.map(([label, action]) => {
    const b = el('button', '', label);
    b.type = 'button';
    b.addEventListener('click', action);
    box.appendChild(b);
    return b;
  });
  parent.appendChild(box);
  return out;
}

const field = (type = 'text') => Object.assign(el('input', 'menu-field'), { type, autocomplete: 'off', spellcheck: false });

/**
 * The Multiplayer screen. name: the last name used; netsim: the test network's settings; message: a line at the top
 * (why the room was left, or that this copy has no server). Returns { say(text) }.
 */
export function renderMultiplayer(panel, { name, netsim, message = '', onCreate, onJoin, onNetsim, onBack }) {
  panel.replaceChildren(el('h2', '', 'Multiplayer'), el('p', '', 'A private room for 2-4 players: RAF against the Luftwaffe.'));
  const status = panel.appendChild(el('p', 'menu-message', message));
  const table = panel.appendChild(el('table'));
  const nameBox = Object.assign(field(), { maxLength: NAME_MAX, placeholder: 'Your name', value: name });
  const codeBox = Object.assign(field(), { maxLength: CODE_LENGTH + 3, placeholder: 'Code' });
  const row = (label, ...cells) => {
    const tr = table.appendChild(el('tr'));
    tr.append(el('th', '', label), ...cells.map((c) => el('td').appendChild(c).parentNode));
  };
  row('Your name', nameBox);
  const join = () => onJoin(codeBox.value, nameBox.value);
  codeBox.addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
  row('Room code', codeBox);
  buttonRow(panel, [['Create a room', () => onCreate(nameBox.value)], ['Join the room', join]]);

  // The test network (Dawn Patrol's network simulator): this window's connection as if on a slow line.
  const test = panel.appendChild(el('details', 'menu-note'));
  test.appendChild(el('summary', '', 'Test network (this window only)'));
  const fields = {};
  for (const [key, label] of [['ping', 'extra ping, ms'], ['jitter', 'jitter, ms'], ['loss', 'loss, %']]) {
    const f = Object.assign(field('number'), { min: '0', max: String(NETSIM_LIMITS[key]), step: key === 'loss' ? '0.5' : '10', value: String(netsim[key]) });
    f.style.width = '70px';
    f.addEventListener('change', () => onNetsim(cleanNetsim({ ping: Number(fields.ping.value), jitter: Number(fields.jitter.value), loss: Number(fields.loss.value) })));
    fields[key] = f;
    test.append(f, el('span', '', ` ${label}  `));
  }
  test.appendChild(el('p', '', 'Leave at 0 to play. For testing, try 150 ms ping, 20 ms jitter and 2% loss.'));
  panel.appendChild(el('p', 'menu-note', 'One player creates a room and sends the six-character code to the others, who join with it.'));
  buttonRow(panel, [['Back', onBack]]);
  (nameBox.value ? codeBox : nameBox).focus();
  return { say: (text) => { status.textContent = text; } };
}

/** "RAF 2 – 1 LUFTWAFFE" from a score ({ teams } or null). */
export const scoreText = (score) => `RAF ${score?.teams.raf ?? 0} – ${score?.teams.luftwaffe ?? 0} LUFTWAFFE`;

/** The match's Esc menu: the score, your own tally, and Resume, Settings, End match (the host), Leave room. */
export function renderMpEsc(panel, { score, me, isHost, note = '', onResume, onSettings, onEnd, onLeave }) {
  panel.replaceChildren(el('h2', '', 'Match'), el('p', '', 'The match goes on while this menu is open.'));
  panel.appendChild(el('p', 'menu-score', scoreText(score)));
  if (me) panel.appendChild(el('p', '', `You: ${me.kills} shot down, ${me.deaths} times down, ${me.hits} hits from ${me.shots} rounds`));
  if (note) panel.appendChild(el('p', 'menu-message', note));
  const list = [['Resume', onResume], ['Settings', onSettings]];
  if (isHost) list.push(['End the match for everyone', onEnd]);
  list.push(['Leave the room', onLeave]);
  buttonRow(panel, list);
  panel.appendChild(el('p', 'menu-note', 'Esc resumes.'));
}

const REASONS = { score: 'the score limit', time: 'the time limit', left: 'a team leaving', host: 'the host' };

/** The results: who won, the team scores, and each player's kills, deaths and accuracy. secondsLeft: until the lobby. */
export function renderMpResults(panel, { result, isHost, secondsLeft, onLobby, onLeave }) {
  const winner = result.winner === 'draw' ? 'A draw' : `${TEAMS[result.winner]} win`;
  panel.replaceChildren(el('h2', '', 'Results'), el('p', 'menu-score', `${winner}: ${scoreText({ teams: result.teams })}`));
  panel.appendChild(el('p', '', `Ended by ${REASONS[result.reason] ?? result.reason} after ${Math.floor(result.seconds / 60)}:${String(result.seconds % 60).padStart(2, '0')}.`));
  const table = panel.appendChild(el('table'));
  const head = table.appendChild(el('tr'));
  for (const t of ['Pilot', 'Side', 'Shot down', 'Times down', 'Hits / rounds']) head.appendChild(el('th', '', t));
  for (const p of result.players) {
    const tr = table.appendChild(el('tr'));
    const accuracy = p.shots ? ` (${Math.round((100 * p.hits) / p.shots)}%)` : '';
    for (const t of [p.name, TEAMS[p.team], String(p.kills), String(p.deaths), `${p.hits} / ${p.shots}${accuracy}`]) tr.appendChild(el('td', '', t));
  }
  panel.appendChild(el('p', 'menu-note', `Back to the room in ${Math.max(0, Math.ceil(secondsLeft))} s.`));
  const list = isHost ? [['Back to the room now', onLobby]] : [];
  list.push(['Leave the room', onLeave]);
  buttonRow(panel, list);
}
