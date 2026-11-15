// Redrawing a multiplayer menu panel without getting in the player's way (Phase 9, D246).
//
// The lobby and the results are redrawn once a second (the ping, the countdown) and whenever the room changes.
// Building the panel afresh each time closed an open drop-down list within a second, and lost any click whose press
// and release fell either side of a rebuild (the product owner's report: the lists didn't work and "I am ready", so
// "Start the match", seemed dead). Now a panel is rebuilt only when what it shows has changed; otherwise only its live
// text is updated. A rebuild also waits while the player is choosing: a drop-down list has the focus, or a mouse
// button is held down on the panel. The next redraw (within a second) catches up. A list closed without a change
// keeps the focus, so the wait ends after MAX_WAIT_MS all the same (game design).

export const MAX_WAIT_MS = 8000;

/** What to do with a panel: 'update' its live text only, 'wait' for the player, or 'rebuild' it. */
export function refreshPlan({ showing, same, busy, waitedMs = 0 }) {
  if (showing && same) return 'update';
  if (showing && busy && waitedMs < MAX_WAIT_MS) return 'wait';
  return 'rebuild';
}

/** Whether a mouse button is held down on this panel (watched from the first call on). */
function pressing(panel) {
  if (!panel.pressWatch) {
    panel.pressWatch = { down: false };
    panel.addEventListener('pointerdown', () => { panel.pressWatch.down = true; });
    const up = () => { panel.pressWatch.down = false; };
    globalThis.addEventListener?.('pointerup', up);
    globalThis.addEventListener?.('pointercancel', up);
  }
  return panel.pressWatch.down;
}

/** Whether the player is in the middle of a choice on this panel: a drop-down list focused, or a button held. */
export function busy(panel) {
  const a = globalThis.document?.activeElement;
  return Boolean(a && a.tagName === 'SELECT' && panel.contains(a)) || pressing(panel);
}

/**
 * Refreshes `panel` as screen `name` showing `content` (anything JSON can hold). `build()` draws it afresh;
 * `live` maps a class name to the text of an element that changes on its own (the ping, a countdown), set in place.
 * Returns what was done.
 */
export function refreshPanel(panel, name, content, build, live = {}) {
  const key = JSON.stringify(content);
  pressing(panel); // watch the mouse from the first drawing on
  const showing = panel.dataset.screen === name && panel.isConnected !== false && panel.querySelector(`[data-screen-root="${name}"]`) !== null;
  const now = Date.now();
  const waitedMs = panel.waitingSince ? now - panel.waitingSince : 0;
  const plan = refreshPlan({ showing, same: panel.dataset.shown === key, busy: showing && busy(panel), waitedMs });
  panel.waitingSince = plan === 'wait' ? (panel.waitingSince ?? now) : null;
  if (plan === 'rebuild') {
    build();
    panel.dataset.screen = name;
    panel.dataset.shown = key;
    panel.firstElementChild?.setAttribute('data-screen-root', name);
  }
  for (const [cls, text] of Object.entries(live)) {
    const e = panel.querySelector(`.${cls}`);
    if (e) e.textContent = text;
  }
  return plan;
}
