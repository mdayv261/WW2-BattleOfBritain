// The undercarriage indicators' words (product owner, D66): the Luftwaffe panels read OBEN (up) and UNTEN (down) and are
// labelled GEAR; the RAF panels keep UP, DOWN and UNDERCARRIAGE. Each panel is drawn on a stand-in canvas that records
// the text it writes.
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
  it('Bf 109: OBEN, UNTEN and GEAR; EIN/AUS only on the ammunition counter\'s gun switch', () => {
    const g = recordingContext();
    bf109Panel(g, 500, 0, 40, readings('bf109e4'));
    for (const word of ['OBEN', 'UNTEN', 'GEAR']) expect(g.texts, word).toContain(word);
    expect(g.texts.filter((t) => t === 'EIN')).toHaveLength(1);
    expect(g.texts.filter((t) => t === 'AUS')).toHaveLength(1);
  });

  it('Bf 110: OBEN, UNTEN and GEAR, and no EIN, AUS, UP, DOWN or FAHRWERK', () => {
    const g = recordingContext();
    bf110Panel(g, 500, 0, 40, readings('bf110c4'));
    for (const word of ['OBEN', 'UNTEN', 'GEAR']) expect(g.texts, word).toContain(word);
    for (const word of ['EIN', 'AUS', 'UP', 'DOWN', 'FAHRWERK']) expect(g.texts, word).not.toContain(word);
  });

  it('RAF: still UP, DOWN and UNDERCARRIAGE', () => {
    const g = recordingContext();
    undercarriageDisplay(g, { x: 100, y: 100, w: 100, h: 90 }, 40, readings('spitfire'), 'UNDERCARRIAGE');
    for (const word of ['UP', 'DOWN', 'UNDERCARRIAGE']) expect(g.texts, word).toContain(word);
  });
});
