// The game's sound (Phase 7 checkpoint 5, D231), with the Web Audio API and generated in code: no recordings
// (GAME_SPEC §2). What each sound follows is worked out in src/audio/soundModel.js; this plays it.
//   The player's engines: per engine, a sawtooth at the firing frequency and a square at half of it (each cylinder's
//     beat) through a lowpass, with band-passed noise for the exhaust.
//   The wind: looping noise through a bandpass.
//   Guns and hits: short sounds generated once as buffers (a machine gun's crack, a cannon's thump, a hit's clang),
//     one played per round, at most MAX_SHOTS per gun group in a frame. The game's guns of a group fire together, a
//     volley at a time; real guns weren't locked together, so a volley's cracks are scattered over SPREAD s.
//   Other aircraft (the product owner, 9 Nov 2026): a pool of MAX_HEARD engine voices given each frame to the nearest
//     aircraft, panned and Doppler-shifted, and their gunfire through the same pan.
// The browser allows no sound until the page has been clicked or a key pressed: `start` is called then. While the game
// isn't advancing (menus, paused) the sound is suspended. Sound on or off is remembered in the browser's storage.
// Every level here is game design, tuned by ear (D231).

import { engineVoices, windVoice, ShotCounter, hearing, MAX_HEARD } from './soundModel.js';

const SOUND_KEY = 'bob1940.sound';
const MAX_SHOTS = 8; // rounds played per gun group per frame (a volley of eight Brownings; about 150 a second)
const SPREAD = 0.05; // s over which a volley's cracks are scattered (one Browning's interval at 1,100 rounds/min)
const SMOOTH = 0.05; // s: the time constant of every level and pitch change
// The product owner's first listen (10 Nov 2026): the engine halved (0.32 and 0.12 before), the machine guns half as
// loud again (0.22) and the cannon three-quarters louder (0.45).
const LEVEL = { master: 0.8, engine: 0.16, exhaust: 0.06, wind: 0.5, mg: 0.33, cannon: 0.7875, hit: 0.6, other: 0.35, otherShot: 0.3 };

/** Sound on or off as last chosen in this browser (on unless switched off). */
function savedEnabled() {
  try {
    return globalThis.localStorage?.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** A buffer of `seconds` of sound from `sample(t)` (t in s), at the context's rate. */
function makeBuffer(ctx, seconds, sample) {
  const buffer = ctx.createBuffer(1, Math.ceil(seconds * ctx.sampleRate), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = sample(i / ctx.sampleRate);
  return buffer;
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = savedEnabled();
    this.shots = new ShotCounter();
    this.hits = 0;
  }

  /** Creates the sound on the first click or key press (the browser's rule); later calls just resume it. */
  start() {
    if (this.ctx) return;
    const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Context) return;
    const ctx = new Context();
    this.ctx = ctx;
    const compressor = ctx.createDynamicsCompressor();
    compressor.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? LEVEL.master : 0;
    this.master.connect(compressor);
    const noise = () => Math.random() * 2 - 1;
    this.buffers = {
      noise: makeBuffer(ctx, 2, noise),
      mg: makeBuffer(ctx, 0.025, (t) => noise() * Math.exp(-t / 0.006)),
      cannon: makeBuffer(ctx, 0.11, (t) => (0.6 * noise() + Math.sin(2 * Math.PI * 70 * t)) * Math.exp(-t / 0.03)),
      hit: makeBuffer(ctx, 0.09, (t) => (0.7 * noise() + Math.sin(2 * Math.PI * 140 * t)) * Math.exp(-t / 0.025)),
    };
    this.engines = [];
    this.wind = this.noiseVoice('bandpass', 0);
    this.others = Array.from({ length: MAX_HEARD }, () => this.otherVoice());
  }

  /** Sound on or off, remembered in this browser. */
  setEnabled(on) {
    this.enabled = on;
    try {
      globalThis.localStorage?.setItem(SOUND_KEY, on ? 'on' : 'off');
    } catch {
      // Storage blocked: the choice lasts until the page is closed.
    }
    if (this.master) this.master.gain.setTargetAtTime(on ? LEVEL.master : 0, this.ctx.currentTime, SMOOTH);
  }

  /** Looping noise through a filter of `type`, into `out` (the master unless given): { filter, gain }. */
  noiseVoice(type, level, out = this.master) {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    src.buffer = this.buffers.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    const gain = ctx.createGain();
    gain.gain.value = level;
    src.connect(filter).connect(gain).connect(out);
    src.start();
    return { filter, gain };
  }

  /** An engine's voice into `out`: { saw, beat, filter, gain, exhaust }. */
  engineVoice(out = this.master) {
    const { ctx } = this;
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    const beat = ctx.createOscillator();
    beat.type = 'square';
    const beatLevel = ctx.createGain();
    beatLevel.gain.value = 0.35;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const gain = ctx.createGain();
    gain.gain.value = 0;
    saw.connect(filter);
    beat.connect(beatLevel).connect(filter);
    filter.connect(gain).connect(out);
    saw.start();
    beat.start();
    return { saw, beat, filter, gain, exhaust: this.noiseVoice('bandpass', 0, out) };
  }

  /** One of the pooled voices for other aircraft: an engine voice behind a stereo panner. */
  otherVoice() {
    const panner = this.ctx.createStereoPanner();
    panner.connect(this.master);
    return { panner, voice: this.engineVoice(panner) };
  }

  /** Sets an engine voice to { freq, gain, cutoff } at `level`. */
  setEngine(v, { freq, gain, cutoff }, level) {
    const t = this.ctx.currentTime;
    const f = Math.max(1, freq);
    v.saw.frequency.setTargetAtTime(f, t, SMOOTH);
    v.beat.frequency.setTargetAtTime(f / 2, t, SMOOTH);
    v.filter.frequency.setTargetAtTime(cutoff, t, SMOOTH);
    v.gain.gain.setTargetAtTime(gain * level, t, SMOOTH);
    v.exhaust.filter.frequency.setTargetAtTime(Math.min(4000, f * 4), t, SMOOTH);
    v.exhaust.gain.gain.setTargetAtTime(gain * LEVEL.exhaust * (level / LEVEL.engine), t, SMOOTH);
  }

  /** Plays `n` rounds (up to MAX_SHOTS) of buffer `kind` scattered over SPREAD s, at `level`, into `out`. */
  play(kind, n, level, out = this.master) {
    const count = Math.min(n, MAX_SHOTS);
    for (let i = 0; i < count; i += 1) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers[kind];
      src.playbackRate.value = 0.94 + Math.random() * 0.12;
      const gain = this.ctx.createGain();
      gain.gain.value = level;
      src.connect(gain).connect(out);
      src.start(this.ctx.currentTime + Math.random() * SPREAD);
    }
  }

  /** Follows the simulation for one frame; `active` is false on the menus and the pause menu. */
  update(sim, active) {
    if (!this.ctx) return;
    if (!active) {
      if (this.ctx.state === 'running') this.ctx.suspend();
      return;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const { plane } = sim;
    const silent = sim.crashed || !!sim.playerJumper;
    // The player's engines, one voice each (a twin's two).
    const voices = engineVoices(sim.ac, plane, sim.input);
    while (this.engines.length < voices.length) this.engines.push(this.engineVoice());
    this.engines.forEach((v, i) => this.setEngine(v, voices[i] && !silent ? voices[i] : { freq: 50, gain: 0, cutoff: 300 }, LEVEL.engine));
    // The wind.
    const w = windVoice(sim.crashed ? 0 : plane.last?.eas ?? 0, { gear: plane.surfaces.gear, flaps: plane.surfaces.flaps });
    const t = this.ctx.currentTime;
    this.wind.filter.frequency.setTargetAtTime(w.cutoff, t, SMOOTH);
    this.wind.gain.gain.setTargetAtTime(w.gain * LEVEL.wind, t, SMOOTH);
    // The player's guns, and hits on him.
    const fired = this.shots.count(sim.player);
    this.play('mg', fired.mg, LEVEL.mg);
    this.play('cannon', fired.cannon, LEVEL.cannon);
    const hits = plane.damage.hits ?? 0;
    if (hits > this.hits) this.play('hit', hits - this.hits, LEVEL.hit);
    this.hits = hits;
    // Other aircraft: the nearest few heard, their engines and guns. Every gun is counted each frame, heard or not.
    const heard = hearing(plane.body, sim.others);
    const firedBy = new Map(sim.others.map((c) => [c, this.shots.count(c)]));
    this.others.forEach((o, i) => {
      const h = heard[i];
      if (!h) {
        o.voice.gain.gain.setTargetAtTime(0, t, SMOOTH);
        o.voice.exhaust.gain.gain.setTargetAtTime(0, t, SMOOTH);
        return;
      }
      o.panner.pan.setTargetAtTime(h.pan, t, SMOOTH);
      const [v] = engineVoices(h.craft.ac, h.craft.plane, h.craft.input);
      this.setEngine(o.voice, { ...v, freq: v.freq * h.doppler }, LEVEL.other * h.gain);
      const f = firedBy.get(h.craft);
      this.play('mg', f.mg, LEVEL.otherShot * h.gain, o.panner);
      this.play('cannon', f.cannon, LEVEL.otherShot * 1.5 * h.gain, o.panner);
    });
  }
}
