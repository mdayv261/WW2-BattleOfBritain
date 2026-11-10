// The match's score line while flying (Phase 9, D245; after Dawn Patrol's src/ui/scoreLine.js): "RAF 2 – 1 LUFTWAFFE
// · 7:42 left · first to 5", top centre below the enemy pointers' strip.

const STYLE = 'position:fixed;top:44px;left:50%;transform:translateX(-50%);z-index:12;padding:4px 12px;'
  + 'font:bold 15px/1.3 "Courier New",monospace;color:#f3ead2;background:rgba(20,16,10,0.6);border:1px solid rgba(240,220,170,0.4);'
  + 'border-radius:3px;letter-spacing:0.05em;white-space:pre;pointer-events:none;display:none';

/** "7:42" (never below 0:00). */
export function clockText(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The line: score { teams } (or null before the first), seconds into the match, the match's settings. */
export function scoreLineText(score, seconds, settings) {
  const raf = score?.teams?.raf ?? 0;
  const lw = score?.teams?.luftwaffe ?? 0;
  return `RAF ${raf} – ${lw} LUFTWAFFE  ·  ${clockText(settings.timeLimit * 60 - seconds)} left  ·  first to ${settings.scoreLimit}`;
}

export class ScoreLine {
  constructor(parent = document.body) {
    this.root = document.createElement('div');
    this.root.style.cssText = STYLE;
    parent.appendChild(this.root);
  }

  /** text: the line, or '' to hide it. */
  set(text) {
    if (this.root.textContent !== text) this.root.textContent = text;
    this.root.style.display = text ? 'block' : 'none';
  }
}
