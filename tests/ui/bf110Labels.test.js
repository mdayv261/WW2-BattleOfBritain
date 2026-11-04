// The Bf 110 C's labels between the flying instruments, each centred under the dial above it (D206).
import { describe, it, expect } from 'vitest';
import { BF110_PANEL } from '../../src/ui/bf110Panel.js';

const L = BF110_PANEL;
const mid = ([l, , r]) => (l + r) / 2;

describe('Bf 110 C labels between the flying instruments (D206)', () => {
  it('centres the dive placard under the airspeed indicator, Umschaltwarnung under the turn and slip, the window under the climb', () => {
    for (const [label, dial] of [['dive', 'airspeed'], ['umschalt', 'turn'], ['window', 'climb']]) {
      expect(mid(L.boxes[label]), label).toBeCloseTo(L.dials[dial][0], 9);
    }
  });

  it('keeps each label\'s size and height, and the Umschaltwarnung lamps either side of their placard as before', () => {
    const K = 0.46;
    expect(L.boxes.dive[2] - L.boxes.dive[0]).toBeCloseTo(120 * K, 9);
    expect(L.boxes.umschalt[2] - L.boxes.umschalt[0]).toBeCloseTo(153 * K, 9);
    expect(L.boxes.window[2] - L.boxes.window[0]).toBeCloseTo(80 * K, 9);
    const [l, , r] = L.boxes.umschalt;
    expect(l - L.knobs.umschaltLeft[0]).toBeCloseTo(16 * K, 9);
    expect(L.knobs.umschaltRight[0] - r).toBeCloseTo(16 * K, 9);
  });

  it('keeps the window above the altimeter, on its centre line too', () => {
    expect(mid(L.boxes.window)).toBeCloseTo(L.dials.altimeter[0], 9);
  });
});
