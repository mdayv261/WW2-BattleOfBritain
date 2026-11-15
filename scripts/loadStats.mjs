// The load test's numbers (Phase 9 checkpoint 4, D246), kept apart from scripts/mpLoad.mjs so they can be tested.

export const MIN_SNAPSHOT_RATE = 25; // a second; the server sends 30
export const LATE_GAP_MS = 100; // a gap between snapshots longer than this is counted (three snapshots missed)

/** The middle value of a list of numbers (null for none). */
export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * One player's snapshots and pings over the timed part of a load test.
 * arrivals: snapshot arrival times (ms); pings: round trips (ms); from, to: the timed window (ms).
 * Returns snapshots a second, the worst gap, how many gaps were late, and the median and worst ping.
 */
export function summarise({ arrivals, pings }, from, to) {
  const inside = arrivals.filter((t) => t >= from && t <= to);
  const gaps = inside.slice(1).map((t, i) => t - inside[i]);
  const seconds = (to - from) / 1000;
  return {
    rate: seconds > 0 ? inside.length / seconds : 0,
    worstGapMs: gaps.length ? Math.max(...gaps) : null,
    lateGaps: gaps.filter((g) => g > LATE_GAP_MS).length,
    pingMedian: median(pings),
    pingWorst: pings.length ? Math.max(...pings) : null,
  };
}

/** Whether one player's run passed: still connected, and snapshots at MIN_SNAPSHOT_RATE or more. */
export function passed(stats, closed) {
  return !closed && stats.rate >= MIN_SNAPSHOT_RATE;
}
