// Mouse flying (Phase 8 checkpoint 2, D239): off by default; the mouse moves the stick and it stays there (right rolls
// right, towards you pulls back), clamped to full travel at the sensitivity's distance; centring; the wheel works the
// throttle; nothing reaches the controls until the mouse is captured. And the look keys' head turns.
import { describe, it, expect } from 'vitest';
import { MouseFlight, MOUSE_TRAVEL } from '../../src/input/mouseFlight.js';
import { keyLook } from '../../src/render/cameras.js';
import { Settings } from '../../src/core/settings.js';
import { Bindings } from '../../src/input/bindings.js';

const input = () => ({ pitch: 0.3, roll: -0.2, throttle: 0.5 });

describe('mouse flying', () => {
  it('is off by default, in the settings and the flight', () => {
    expect(new Settings(null).values.mouseFlight).toBe(false);
    expect(new Settings(null).values.mouseSensitivity).toBe('medium');
    const m = new MouseFlight();
    m.locked = true;
    const i = input();
    m.move(200, 200);
    m.apply(i);
    expect(i).toEqual(input()); // off: the controls are untouched
  });

  it('moves the stick and holds it there, full travel at the sensitivity\'s distance, clamped', () => {
    const m = new MouseFlight();
    m.configure(true, 'medium');
    m.locked = true;
    m.move(MOUSE_TRAVEL.medium / 2, MOUSE_TRAVEL.medium / 4); // right and towards you
    const i = input();
    m.apply(i);
    expect(i.roll).toBeCloseTo(0.5, 9);
    expect(i.pitch).toBeCloseTo(0.25, 9); // pulled back
    m.apply(i);
    expect(i.roll).toBeCloseTo(0.5, 9); // held
    m.move(10 * MOUSE_TRAVEL.medium, -10 * MOUSE_TRAVEL.medium);
    m.apply(i);
    expect([i.roll, i.pitch]).toEqual([1, -1]);
    m.configure(true, 'high');
    m.centre();
    m.move(MOUSE_TRAVEL.high, 0);
    m.apply(i);
    expect(i.roll).toBe(1);
  });

  it('centres; the wheel works the throttle; nothing until the mouse is captured', () => {
    const m = new MouseFlight();
    m.configure(true);
    m.move(100, 100);
    const i = input();
    m.apply(i);
    expect(i).toEqual(input()); // not captured yet
    m.locked = true;
    m.centre();
    m.wheel(-100); // up: open
    m.wheel(-100);
    m.apply(i);
    expect([i.pitch, i.roll]).toEqual([0, 0]);
    expect(i.throttle).toBeCloseTo(0.6, 9);
    m.wheel(100);
    m.apply(i);
    expect(i.throttle).toBeCloseTo(0.55, 9);
  });

  it('the centring key is bound (Num 5 by default)', () => {
    expect(new Bindings(null).of('mouseCentre')).toEqual(['Numpad5']);
  });
});

describe('the look keys', () => {
  it('turn the head left, right, behind and up, and combine; none held, none', () => {
    expect(keyLook({})).toBeNull();
    expect(keyLook({ left: true }).yaw).toBeCloseTo(Math.PI / 2, 9);
    expect(keyLook({ right: true }).yaw).toBeCloseTo(-Math.PI / 2, 9);
    expect(Math.abs(keyLook({ back: true }).yaw)).toBeGreaterThan(2.5);
    expect(keyLook({ back: true, right: true }).yaw).toBeLessThan(-2.5);
    expect(keyLook({ up: true })).toEqual({ yaw: 0, pitch: 1.05 });
    expect(keyLook({ left: true, up: true }).pitch).toBeGreaterThan(0.3);
  });
});
