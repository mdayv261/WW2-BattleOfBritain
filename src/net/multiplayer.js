// Multiplayer in the page (Phase 9, D245; after Dawn Patrol's src/net/attachMultiplayer.js, with the product owner's
// approval): the room client, its screens in the game's menu panel, and the match flown in the page's own Simulation.
// The room decides the screen:
//   joined -> the lobby; match started -> flying (once the server has placed your aircraft); match over -> the results;
//   refused or lost -> the Multiplayer screen with the reason.
// While a match is on the game state (src/core/gameState.js) keeps the physics running even with a menu open: a match
// never pauses. A reload rejoins the same room (its place is kept for 60 s).

import { createMpClient } from './mpClient.js';
import { serverBase } from './serverUrl.js';
import { parseNetsim, cleanNetsim, netsimActive, netsimText } from './netSim.js';
import { NetFlight } from './netFlight.js';
import { renderMultiplayer, renderMpEsc, renderMpResults } from '../ui/mpScreens.js';
import { renderLobby } from '../ui/lobbyScreen.js';
import { ScoreLine, scoreLineText } from '../ui/scoreLine.js';
import { NameTags } from '../ui/nameTags.js';
import { aircraftById } from '../aircraft/index.js';
import { dropAll } from '../core/scenarios.js';
import { prepareAirStart } from '../mp/spawn.js';
import { AIR_SPAWN, RESULTS_S, TICK_HZ } from '../mp/netConfig.js';

const NETSIM_KEY = 'bob1940.netsim';
const NAME_KEY = 'bob1940.mpName';
const ROOM_SCREENS = ['lobby', 'flying', 'esc', 'settings', 'results'];
const WAITING = { creating: 'Creating a room...', connecting: 'Connecting to the room...' };

const storageOf = (kind) => {
  try {
    return window[kind];
  } catch {
    return null;
  }
};
const read = (store, key) => {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const write = (store, key, value) => {
  try {
    store?.setItem(key, value);
  } catch {
    // not remembered (a private window)
  }
};

/**
 * game: the GameState; sim: the page's Simulation; menus: the menu panel (src/ui/menus.js); onFlight({ ac, time }): a
 * match's flight starts (the view, the sky); onRespawn(): your aircraft is back after going down.
 */
export function attachMultiplayer({ game, sim, menus, onFlight, onRespawn }) {
  const session = storageOf('sessionStorage');
  const local = storageOf('localStorage');
  const params = new URLSearchParams(window.location.search);
  let netsim = parseNetsim(params.get('netsim'));
  if (!netsim) {
    try {
      netsim = cleanNetsim(JSON.parse(read(session, NETSIM_KEY) ?? 'null'));
    } catch {
      netsim = cleanNetsim(null);
    }
  }
  let screen = null; // which multiplayer screen is up: 'menu', 'lobby', 'flying', 'esc', 'settings', 'results', or null
  let say = () => {};
  let note = ''; // the room's latest notice
  let noteTimer = null;
  let flight = null; // { match (the matchStart it is for), net (NetFlight) } while a match is on
  const scoreLine = new ScoreLine();
  const nameTags = new NameTags();

  const options = {
    base: serverBase({ search: window.location.search, env: import.meta.env, location: window.location, dev: import.meta.env.DEV }),
    storage: session,
    netsim,
    onChange: () => sync(),
    onBinary: (buffer) => flight?.net.receive(buffer),
    onFx: (list) => flight?.net.onFx(list),
    onNotice: (text) => {
      if (flight?.net.ready) sim.notice = { text, until: sim.plane.time + 4 };
      note = text;
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => { note = ''; redraw(); }, 5000);
      redraw();
    },
  };
  const client = createMpClient(options);
  const lookup = (slot) => {
    const p = client.state.lobby?.players.find((q) => q.id === `p${slot}`) ?? flight?.match.players.find((q) => q.id === `p${slot}`);
    return p ? { name: p.name, team: p.team, aircraft: p.aircraft } : null;
  };

  // ---- the screens ----
  function showMenu(message = '') {
    screen = 'menu';
    game.enterMultiplayer();
    const text = message || (client.available ? '' : 'Multiplayer is not available on this copy of the game yet.');
    ({ say } = menus.showPanel('multiplayer', (panel) => renderMultiplayer(panel, {
      name: read(local, NAME_KEY) ?? '',
      netsim: options.netsim,
      message: text,
      onCreate: (name) => { write(local, NAME_KEY, name); client.createRoom(name); },
      onJoin: (code, name) => { write(local, NAME_KEY, name); client.joinRoom(code, name); },
      onNetsim: (s) => {
        options.netsim = s;
        write(session, NETSIM_KEY, JSON.stringify(s));
        say(netsimActive(s) ? `Test network on: ${netsimText(s)} (from the next connection)` : 'Test network off');
      },
      onBack: () => { screen = null; game.menu(); },
    })) ?? {});
  }

  const showLobby = () => {
    screen = 'lobby';
    game.enterMultiplayer();
    menus.showPanel('lobby', (panel) => renderLobby(panel, {
      client, note: flight && !flight.net.ready ? 'Joining the match...' : note, ping: client.ping, netsim: netsimActive(options.netsim) ? netsimText(options.netsim) : '', onLeave: leave,
    }));
  };

  const showEsc = () => {
    screen = 'esc';
    menus.showPanel('mpEsc', (panel) => renderMpEsc(panel, {
      score: client.state.score, me: client.state.score?.players.find((p) => p.id === client.state.you), isHost: client.isHost, note,
      onResume: resume, onSettings: () => { screen = 'settings'; game.settings(showEsc); }, onEnd: () => client.toLobby(), onLeave: leave,
    }));
  };

  const secondsLeft = () => RESULTS_S - (Date.now() - client.state.resultAt) / 1000;
  const showResults = () => {
    screen = 'results';
    game.enterMultiplayer();
    menus.showPanel('mpResults', (panel) => renderMpResults(panel, {
      result: client.state.result, isHost: client.isHost, secondsLeft: secondsLeft(), onLobby: () => client.toLobby(), onLeave: leave,
    }));
  };

  function resume() {
    screen = 'flying';
    menus.hide();
  }

  function redraw() {
    if (screen === 'lobby') showLobby();
    if (screen === 'esc') showEsc();
    if (screen === 'results') showResults();
  }

  // ---- the flight ----
  function startFlight(match) {
    stopFlight();
    const me = match.players.find((p) => p.id === client.state.you);
    const ac = aircraftById[me?.aircraft];
    if (!ac) return;
    dropAll(sim);
    sim.escortRaid = null;
    sim.paused = false;
    sim.mode = 'air';
    sim.startOverride = { altitude: AIR_SPAWN.altitude };
    sim.reset(ac);
    const net = new NetFlight({
      send: (buffer) => client.sendBinary(buffer),
      lookup,
      ping: () => client.ping ?? 0,
      jitter: () => client.jitter,
      notice: (text) => { sim.notice = { text, until: sim.plane.time + 2 }; },
      onReady: () => {
        game.startNetFlight();
        onFlight({ ac, time: { year: 1940, month: 8, day: 15, hoursUtc: match.settings.hoursUtc } });
        screen = 'flying';
        menus.hide();
        sync();
      },
      onRespawn,
    });
    net.attach(sim);
    flight = { match, net };
  }

  function stopFlight() {
    if (!flight) return;
    flight.net.detach();
    flight = null;
    game.stopNetFlight();
  }

  function leave() {
    client.leave();
    stopFlight();
    showMenu('You left the room.');
  }

  // ---- following the room ----
  function sync() {
    const st = client.state;
    if ((st.status === 'inRoom' || st.status === 'reconnecting') && st.lobby) {
      const phase = st.lobby.phase;
      if (phase === 'match' && st.match && st.match !== flight?.match) startFlight(st.match);
      if (phase !== 'match' && flight) stopFlight();
      if (phase === 'results' && st.result) return screen === 'results' ? undefined : showResults();
      if (phase === 'match' && flight?.net.ready) return ['esc', 'settings'].includes(screen) ? redraw() : (screen === 'flying' ? undefined : resume());
      if (phase === 'lobby' && client.me && aircraftById[client.me.aircraft]) prepareAirStart(aircraftById[client.me.aircraft]); // so the start is quick
      return showLobby();
    }
    if (['error', 'lost', 'idle'].includes(st.status)) {
      stopFlight();
      if (ROOM_SCREENS.includes(screen)) return showMenu(st.message);
      if (screen === 'menu' && st.message) say(st.message);
      return undefined;
    }
    if (screen === 'menu' && WAITING[st.status]) say(WAITING[st.status]);
    return undefined;
  }

  // The lobby's ping and the results' countdown, once a second.
  setInterval(() => {
    if (screen === 'lobby' || screen === 'results') redraw();
  }, 1000);

  // Leaving the page closes the connection at once but keeps the place; coming back rejoins.
  window.addEventListener('pagehide', () => client.drop());
  const rejoin = () => {
    const saved = client.savedRoom();
    if (!saved || !client.available) return;
    showMenu('Rejoining the room...');
    client.joinRoom(saved, read(local, NAME_KEY) ?? '');
  };
  window.addEventListener('pageshow', (e) => { if (e.persisted) rejoin(); });
  setTimeout(rejoin, 0);

  return {
    open: () => showMenu(),
    /** Esc in a match: its menu, or back to flying. True if multiplayer took the key. */
    escape() {
      if (screen === 'flying') showEsc();
      else if (screen === 'esc') resume();
      else return false;
      return true;
    },
    get flying() {
      return Boolean(flight?.net.ready);
    },
    /** Once a frame, before drawing: the other aircraft moved to where they are drawn, their guns, the score line. */
    frame(dt) {
      const on = Boolean(flight?.net.ready);
      if (on) flight.net.frame(dt);
      scoreLine.set(on ? scoreLineText(client.state.score, flight.net.serverTick / TICK_HZ, flight.match.settings) : '');
    },
    /** Once a frame, after the camera has moved: the names over the others. */
    tags(camera) {
      const on = Boolean(flight?.net.ready) && screen !== 'settings';
      nameTags.update(camera, sim.plane.body.position, on ? flight.net.drawn() : [], client.me?.team, on);
    },
    debugLines: () => flight?.net.debugLines() ?? [],
  };
}
