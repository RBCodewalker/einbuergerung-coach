/**
 * Mulberry32 pseudorandom number generator
 * Provides deterministic random numbers based on a seed
 * @param {number} seed - The seed value
 * @returns {Function} Random number generator function
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}