// What an AI pilot or gunner can see of the other aircraft (Phase 6, D79): their positions and velocities as they were
// one reaction time ago, from a short track each aircraft leaves behind it. Nothing else of theirs (no controls, no
// plans) is visible. Free of rendering, so the multiplayer server can run it.

import { Vector3 } from 'three';

const SAMPLE = 0.05; // s between track points (20 a second)
const KEEP = 2; // s of track kept

/** Adds the aircraft's present state to its track, at most once a sample. */
export function recordTrack(craft, time) {
  const track = (craft.track ??= []);
  if (track.length && time - track[track.length - 1].time < SAMPLE - 1e-9) return;
  const { position, velocity } = craft.plane.body;
  track.push({ time, position: position.clone(), velocity: velocity.clone() });
  while (track.length > 2 && track[0].time < time - KEEP) track.shift();
}

/**
 * Where an aircraft was seen `delay` seconds before `time`: { position, velocity }, interpolated along its track (its
 * oldest point if the track is too short, its newest for no delay).
 */
export function seen(craft, time, delay) {
  const track = craft.track;
  const { body } = craft.plane;
  if (!track?.length || delay <= 0) return { position: body.position.clone(), velocity: body.velocity.clone() };
  const at = time - delay;
  if (at <= track[0].time) return { position: track[0].position.clone(), velocity: track[0].velocity.clone() };
  for (let i = track.length - 1; i > 0; i -= 1) {
    const a = track[i - 1];
    const b = track[i];
    if (at >= a.time) {
      const f = Math.min(1, (at - a.time) / Math.max(b.time - a.time, 1e-9));
      return {
        position: new Vector3().lerpVectors(a.position, b.position, f),
        velocity: new Vector3().lerpVectors(a.velocity, b.velocity, f),
      };
    }
  }
  const last = track[track.length - 1];
  return { position: last.position.clone(), velocity: last.velocity.clone() };
}
