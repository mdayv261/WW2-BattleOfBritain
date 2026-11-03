// The undercarriage indicators' words (product owner, D66): the RAF panels keep UP, DOWN and UNDERCARRIAGE; the Bf
// 109's (D89) and the Bf 110's (D106) have their real switches' words, Ein and Aus, in place of the added OBEN, UNTEN and
// GEAR. Each panel is drawn on a stand-in canvas that records the text it writes.
import { describe, it, expect } from 'vitest';
import { bf109Panel } from '../../src/ui/bf109Panel.js';
import { bf110Panel } from '../../src/ui/bf110Panel.js';
import { undercarriageDisplay } from '../../src/ui/panelControls.js';
import { instrumentReadings } from '../../src/ui/instruments.js';
import { Simulation } from '../../src/core/simulation.js';
import { aircraftById } from '../../src/aircraft/index.js';

/** A 2D context that accepts every drawing call and records the words written with fillText. */
function recordingContext() {
  const texts = [];
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(target, prop) {
      if (prop === 'texts') return texts;
      if (prop === 'fillText') return (t) => texts.push(String(t));
      if (prop === 'measureText') return (t) => ({ width: String(t).length * 6 });
      if (prop in target) return target[prop];
      if (String(prop).startsWith('create')) return () => gradient;
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
  return ctx;
}

const readings = (id) => instrumentReadings(new Simulation(aircraftById[id], 'air'));

describe('undercarriage indicator words (D66)', () => {
  it('Bf 109: the undercarriage switch\'s words (Fahrwerk, Ein, Ruhe, Aus, D89, D95) with UP and DN (D92), not OBEN, UNTEN or GEAR', () => {
    const g = recordingContext();
    bf109Panel(g, 500, 0, 40, readings('bf109e4'));
    for (const word of ['Fahrwerk', 'Ein', 'Ruhe', 'Aus', 'UP', 'DN']) expect(g.texts, word).toContain(word);
    for (const word of ['OBEN', 'UNTEN', 'GEAR', 'DOWN']) expect(g.texts, word).not.toContain(word);
  });

  it('Bf 110: the Fahrwerk EIN/AUS switch and lights since D106, not OBEN, UNTEN or GEAR', () => {
    const g = recordingContext();
    bf110Panel(g, 500, 0, 40, readings('bf110c4'));
    for (const word of ['Fahrwerk', 'Ein', 'Aus', 'EIN', 'AUS']) expect(g.texts, word).toContain(word);
    // No UP or DOWN since the Spitfire trim gauge went (D140).
    for (const word of ['OBEN', 'UNTEN', 'GEAR', 'UP', 'DOWN']) expect(g.texts, word).not.toContain(word);
  });

  it('RAF: still UP, DOWN and UNDERCARRIAGE', () => {
    const g = recordingContext();
    undercarriageDisplay(g, { x: 100, y: 100, w: 100, h: 90 }, 40, readings('spitfire'), 'UNDERCARRIAGE');
    for (const word of ['UP', 'DOWN', 'UNDERCARRIAGE']) expect(g.texts, word).toContain(word);
  });
});
