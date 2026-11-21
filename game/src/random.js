// A small seeded random generator (mulberry32) so a scene's decorative details —
// stars, ripples, grass blades — land in exactly the same places on both panels.
// Only the ten differences are allowed to differ between the two pictures.

/** Build a generator from a 32-bit seed; every call returns a number in [0, 1). */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick an integer in [min, max] from the generator. */
export function range(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** Pick one item from an array with the generator. */
export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}
