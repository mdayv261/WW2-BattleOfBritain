// The match's score line and the other players' name tags (Phase 9, D245): their words, and where a tag goes.
import { describe, it, expect } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { scoreLineText, clockText } from '../../src/ui/scoreLine.js';
import { tagText, screenPoint } from '../../src/ui/nameTags.js';
import { DEFAULT_SETTINGS, NAME_TAG_RANGE } from '../../src/mp/netConfig.js';

describe('the score line', () => {
  it('reads the team scores, the time left and the limit', () => {
    expect(scoreLineText({ teams: { raf: 2, luftwaffe: 1 } }, 138, DEFAULT_SETTINGS)).toBe('RAF 2 – 1 LUFTWAFFE  ·  7:42 left  ·  first to 5');
    expect(scoreLineText(null, 0, DEFAULT_SETTINGS)).toMatch(/^RAF 0 – 0 LUFTWAFFE {2}· {2}10:00 left/);
    expect(clockText(-5)).toBe('0:00');
  });
});

describe('the name tags', () => {
  it('give the name and distance, out to 2 km (the product owner, D245)', () => {
    expect(tagText('Max', 1234)).toBe('Max 1.2 km');
    expect(tagText('Ann', 447)).toBe('Ann 450 m');
    expect(NAME_TAG_RANGE).toBe(2000);
  });

  it('sit where the camera sees the aircraft, and not behind the camera', () => {
    const camera = new PerspectiveCamera(60, 2, 1, 10000);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const ahead = screenPoint(camera, new Vector3(0, 0, -500), 800, 400);
    expect(ahead.x).toBeCloseTo(400, 0);
    expect(ahead.y).toBeCloseTo(200, 0);
    expect(screenPoint(camera, new Vector3(0, 0, 500), 800, 400)).toBeNull();
  });
});
