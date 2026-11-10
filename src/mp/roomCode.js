// Room codes: six characters the host reads out or sends to the others ("K7QPM2"). Dawn Patrol's src/mp/roomCode.js
// (D243, with the product owner's approval).

import { CODE_ALPHABET, CODE_LENGTH } from './netConfig.js';

/** A new random code. rng() returns numbers in [0, 1); the server passes a cryptographic one. */
export function makeCode(rng = Math.random) {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length) % CODE_ALPHABET.length];
  return code;
}

/** A code as typed, tidied: capitals, with spaces and dashes ignored ("k7q-pm2" -> "K7QPM2"). */
export const tidyCode = (text) => String(text ?? '').toUpperCase().replace(/[\s-]+/g, '');

/** Whether this (tidied) text is a possible room code. */
export function isCode(text) {
  if (typeof text !== 'string' || text.length !== CODE_LENGTH) return false;
  for (const c of text) if (!CODE_ALPHABET.includes(c)) return false;
  return true;
}
