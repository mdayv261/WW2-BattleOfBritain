// The game's screens (Phase 7 checkpoint 1, D225), drawn as a page overlay over the 3D view: the main menu, the mission
// setup (src/ui/missionSetup.js), the pause menu and the results. Each screen is given its actions as callbacks; the
// game's state machine (src/core/gameState.js) decides which is shown.

import { renderSetup } from './missionSetup.js';
import { renderSettings } from './settingsScreen.js';
import { renderControls } from './controlsScreen.js';

const STYLE = `
.menu-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(20, 24, 18, 0.55); z-index: 50; font-family: Georgia, 'Times New Roman', serif; }
.menu-panel { background: #e9e2cf; color: #2a2a22; border: 3px solid #5d5a3c; padding: 24px 32px; min-width: 340px;
  max-width: 92vw; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5); }
.menu-panel h1 { margin: 0 0 4px; font-size: 26px; letter-spacing: 1px; }
.menu-panel h2 { margin: 0 0 14px; font-size: 20px; }
.menu-panel p { margin: 4px 0 14px; }
.menu-panel table { border-collapse: collapse; margin-bottom: 12px; }
.menu-panel th { text-align: left; padding: 4px 16px 4px 0; font-weight: normal; }
.menu-panel td { padding: 4px 0; }
.menu-panel select { font: inherit; padding: 2px 4px; min-width: 180px; }
.menu-buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.menu-buttons button { font: inherit; font-size: 17px; padding: 8px 14px; background: #5d5a3c; color: #f3eedd;
  border: none; cursor: pointer; text-align: left; }
.menu-buttons button:hover { background: #77734f; }
.menu-note { font-size: 13px; color: #555046; }
.menu-panel { max-height: 92vh; overflow: auto; }
.settings-keys { max-width: 620px; margin-top: 10px; }
.settings-keys td { padding: 1px 8px 1px 0; vertical-align: top; }
.menu-key { font: inherit; font-size: 13px; padding: 1px 8px; min-width: 64px; background: #f3eedd; color: #2a2a22;
  border: 1px solid #5d5a3c; cursor: pointer; }
.menu-key:hover { background: #fff8e2; }
`;

const soundLabel = (on) => `Sound: ${on ? 'on' : 'off'}`;

/** The Sound button (D231): its label says the state, and a click switches it. */
const soundButton = ({ on, toggle }) => ({
  label: soundLabel(on),
  action: (e) => { e.currentTarget.textContent = soundLabel(toggle()); },
});

export class Menus {
  constructor(parent = document.body) {
    if (!document.getElementById('menu-style')) {
      const style = document.createElement('style');
      style.id = 'menu-style';
      style.textContent = STYLE;
      document.head.appendChild(style);
    }
    this.overlay = document.createElement('div');
    this.overlay.className = 'menu-overlay';
    this.panel = document.createElement('div');
    this.panel.className = 'menu-panel';
    this.overlay.appendChild(this.panel);
    parent.appendChild(this.overlay);
    this.hide();
  }

  get visible() {
    return this.overlay.style.display !== 'none';
  }

  hide() {
    this.overlay.style.display = 'none';
    this.screen = null;
  }

  /** Shows a screen: a title, optional lines of text, and buttons [{ label, action }]. */
  show(screen, { title, subtitle, lines = [], buttons = [], note }) {
    this.screen = screen;
    this.panel.replaceChildren();
    const h = document.createElement(screen === 'main' ? 'h1' : 'h2');
    h.textContent = title;
    this.panel.appendChild(h);
    if (subtitle) this.panel.appendChild(Object.assign(document.createElement('p'), { textContent: subtitle }));
    if (lines.length) {
      const table = document.createElement('table');
      for (const [label, value] of lines) {
        const tr = document.createElement('tr');
        tr.append(Object.assign(document.createElement('th'), { textContent: label }), Object.assign(document.createElement('td'), { textContent: value }));
        table.appendChild(tr);
      }
      this.panel.appendChild(table);
    }
    const box = document.createElement('div');
    box.className = 'menu-buttons';
    for (const { label, action } of buttons) {
      const b = document.createElement('button');
      b.textContent = label;
      b.addEventListener('click', action);
      box.appendChild(b);
    }
    this.panel.appendChild(box);
    if (note) this.panel.appendChild(Object.assign(document.createElement('p'), { className: 'menu-note', textContent: note }));
    this.statusLine = screen === 'main' ? this.panel.appendChild(Object.assign(document.createElement('p'), { className: 'menu-note' })) : null;
    this.overlay.style.display = 'flex';
  }

  /** The main menu's status line (the joystick's connection, D226); other screens have none. */
  setStatus(text) {
    if (this.statusLine && this.statusLine.textContent !== text) this.statusLine.textContent = text;
  }

  /**
   * The main menu, with each side's career (`career`: [[side, text]], D229). "Reset careers" asks for a second click
   * before `onResetCareer` clears them.
   */
  showMain({ onMission, onTest, onSettings, career = [], onResetCareer, sound }) {
    const buttons = [{ label: 'Fly a mission', action: onMission }, { label: 'Test flight', action: onTest }, { label: 'Settings', action: onSettings }];
    if (sound) buttons.push(soundButton(sound));
    if (onResetCareer) {
      buttons.push({
        label: 'Reset careers',
        action: (e) => {
          if (e.currentTarget.dataset.armed) onResetCareer();
          else Object.assign(e.currentTarget, { textContent: 'Click again to reset both careers' }).dataset.armed = '1';
        },
      });
    }
    this.show('main', {
      title: 'Battle of Britain 1940',
      subtitle: 'South-east England and the Channel, summer 1940',
      lines: career,
      buttons,
      note: 'In flight: Esc pauses. H lists the keys. Ranks come from mission kills only.',
    });
  }

  /** The settings screen (D232, src/ui/settingsScreen.js). */
  showSettings({ values, onChange, onBack, onJoystick, onControls, sound, helpHtml }) {
    this.screen = 'settings';
    renderSettings(this.panel, values, { onChange, onBack, onJoystick, onControls, sound, helpHtml });
    this.overlay.style.display = 'flex';
  }

  /** The Controls screen (D238, src/ui/controlsScreen.js). */
  showControls(options) {
    this.screen = 'controls';
    renderControls(this.panel, options);
    this.overlay.style.display = 'flex';
  }

  /** The mission setup form. */
  showSetup(setup, { onFly, onBack }) {
    this.screen = 'setup';
    renderSetup(this.panel, setup, { onFly, onBack });
    this.overlay.style.display = 'flex';
  }

  /** The pause menu; a test flight has no mission to restart or end. */
  showPause({ mission, onResume, onRestart, onEnd, onMenu, sound, onSettings }) {
    const buttons = [{ label: 'Resume', action: onResume }];
    if (mission) buttons.push({ label: 'Restart mission', action: onRestart }, { label: 'End mission', action: onEnd });
    if (sound) buttons.push(soundButton(sound));
    if (onSettings) buttons.push({ label: 'Settings', action: onSettings });
    buttons.push({ label: 'Main menu', action: onMenu });
    this.show('pause', { title: 'Paused', buttons, note: 'Esc resumes.' });
  }

  /** The results of a mission (src/core/mission.js missionResults). */
  showResults(r, { onAgain, onMenu }) {
    const minutes = Math.floor(r.flightTime / 60);
    const seconds = String(Math.floor(r.flightTime % 60)).padStart(2, '0');
    const lines = [
      ['Your kills', String(r.kills)],
      ['Shared', String(r.shared)],
      ['Damaged', String(r.damaged)],
      ['Enemy destroyed', `${r.enemiesDestroyed} of ${r.enemies}`],
      ['Enemy gone home', String(r.enemiesHome)],
    ];
    // The raid (D227): the bombers' fate, and the raid's own escort in an interception.
    if (r.raid) {
      lines.push(['Bombers shot down', `${r.bombersDestroyed} of ${r.bombers}`], ['Bombers that reached the target', String(r.bombersReachedTarget)]);
      if (r.bombersHome !== null) lines.push(['Bombers escorted back to mid-Channel', String(r.bombersHome)]);
      if (r.escortsDestroyed) lines.push(['Escort fighters shot down', String(r.escortsDestroyed)]);
    }
    if (r.wingmen) lines.push(["Your wingmen's kills", String(r.wingmenKills)], ['Wingmen lost', `${r.wingmenLost} of ${r.wingmen}`]);
    lines.push(
      ['Your hits on the enemy', String(r.hitsGiven)],
      ['Hits taken', String(r.hitsTaken)],
      ['Rounds fired', String(r.roundsFired)],
      ['Flight time', `${minutes}:${seconds}`],
    );
    if (r.assists) lines.push(['Assists', r.assists]); // D232
    // The career (D229): the rank now, and a promotion this mission earned.
    if (r.career) {
      if (r.career.promoted) lines.unshift(['Promoted', r.career.rank]);
      lines.push([`Career (${r.career.side})`, r.career.text]);
    }
    this.show('results', {
      title: 'Results',
      subtitle: r.outcomeText,
      lines,
      buttons: [{ label: 'Fly again', action: onAgain }, { label: 'Main menu', action: onMenu }],
    });
  }
}
