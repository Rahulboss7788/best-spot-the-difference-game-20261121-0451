// The game's state: which scene is being hunted, what has been found, the clock,
// the score and the combo. The state knows nothing about pixels — the renderer
// reads it and the input feeds it clicks — so the same rules drive the live game
// and the staged screenshot scenes.
//
// Screens: 'title' | 'play' | 'paused' | 'scene-done' | 'won' | 'lost'
// Events returned by the methods tell main.js which sound to play.

import {
  CLICK_RADIUS,
  COMBO_MAX,
  COMBO_STEP,
  FIND_POINTS,
  HINTS_PER_SCENE,
  HINT_COOLDOWN,
  HINT_SHOW,
  MARK_FADE,
  SCENE_TIME,
  SPARKLE_LIFE,
  TIME_BONUS,
  WRONG_PENALTY,
} from './config.js';
import { SCENES } from './scenes.js';

export const EVENT_FOUND = 'found';
export const EVENT_WRONG = 'wrong';
export const EVENT_HINT = 'hint';
export const EVENT_SCENE_DONE = 'scene-done';
export const EVENT_WON = 'won';
export const EVENT_LOST = 'lost';
export const EVENT_TICK = 'tick';

export function createGame() {
  const game = {
    screen: 'title',
    sceneIndex: 0,
    found: new Set(),
    score: 0,
    combo: 0,
    bestCombo: 0,
    timeLeft: SCENE_TIME,
    hintsLeft: HINTS_PER_SCENE,
    hintCooldown: 0,
    hintTarget: null,
    hintTimer: 0,
    particles: [],
    floaters: [],
    marks: [],
    message: '',
    messageTimer: 0,
    sceneBonus: 0,
    totalFound: 0,
    muted: false,
    /** Seconds since the scene started; drives the hint pulse and sparkles. */
    elapsed: 0,
    /** The last whole second the tick sound played in. */
    lastTickSecond: -1,
  };

  function scene() {
    return SCENES[game.sceneIndex];
  }

  function remaining() {
    return scene().differences.length - game.found.size;
  }

  /** Start a fresh hunt from the title screen. */
  function start() {
    game.score = 0;
    game.totalFound = 0;
    game.bestCombo = 0;
    startScene(0);
  }

  /** (Re)start one scene: empty found set, full clock, fresh hints. */
  function startScene(index) {
    game.sceneIndex = index;
    game.found = new Set();
    game.timeLeft = SCENE_TIME;
    game.hintsLeft = HINTS_PER_SCENE;
    game.hintCooldown = 0;
    game.hintTarget = null;
    game.hintTimer = 0;
    game.combo = 0;
    game.particles = [];
    game.floaters = [];
    game.marks = [];
    game.elapsed = 0;
    game.lastTickSecond = -1;
    game.sceneBonus = 0;
    game.message = scene().tagline;
    game.messageTimer = 3;
    game.screen = 'play';
  }

  /** A burst of golden sparkles at a found difference, on both panels at once. */
  function burst(x, y) {
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 40 + Math.random() * 90;
      game.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: SPARKLE_LIFE,
        max: SPARKLE_LIFE,
        size: 2 + Math.random() * 3,
      });
    }
  }

  /**
   * A click at scene coordinates (the same spot on either panel). Returns an
   * event name, or null when the click was outside the pictures.
   */
  function clickAt(x, y, panel) {
    if (game.screen !== 'play') return null;
    const list = scene().differences;
    for (let i = 0; i < list.length; i += 1) {
      const diff = list[i];
      if (game.found.has(diff.id)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      if (dx * dx + dy * dy <= CLICK_RADIUS * CLICK_RADIUS) {
        game.found.add(diff.id);
        game.totalFound += 1;
        game.combo += 1;
        game.bestCombo = Math.max(game.bestCombo, game.combo);
        const multiplier = Math.min(1 + (game.combo - 1) * COMBO_STEP, COMBO_MAX);
        const points = Math.round(FIND_POINTS * multiplier);
        game.score += points;
        burst(diff.x, diff.y);
        game.floaters.push({ x: diff.x, y: diff.y - 30, text: `+${points}`, life: 1, max: 1 });
        game.message = diff.hint && remaining() > 0
          ? `Found! ${points} points — ${remaining()} to go.`
          : `Found! ${points} points.`;
        game.messageTimer = 2.5;
        if (game.hintTarget && game.hintTarget.id === diff.id) {
          game.hintTarget = null;
          game.hintTimer = 0;
        }
        if (remaining() === 0) {
          game.sceneBonus = Math.round(game.timeLeft) * TIME_BONUS;
          game.score += game.sceneBonus;
          game.screen = game.sceneIndex + 1 >= SCENES.length ? 'won' : 'scene-done';
          return game.screen === 'won' ? EVENT_WON : EVENT_SCENE_DONE;
        }
        return EVENT_FOUND;
      }
    }
    // Nothing there: a red X, five seconds off the clock, combo back to one.
    game.combo = 0;
    game.timeLeft = Math.max(0, game.timeLeft - WRONG_PENALTY);
    game.marks.push({ x, y, panel: panel ?? 'left', life: MARK_FADE, max: MARK_FADE });
    game.message = `Not there — ${WRONG_PENALTY}s lost. Look closer!`;
    game.messageTimer = 2;
    return EVENT_WRONG;
  }

  /** Light up one difference the player has not found yet, if a hint is ready. */
  function useHint() {
    if (game.screen !== 'play') return null;
    if (game.hintsLeft <= 0) {
      game.message = 'No hints left in this scene.';
      game.messageTimer = 2;
      return null;
    }
    if (game.hintCooldown > 0) {
      game.message = `Hint recharging — ${Math.ceil(game.hintCooldown)}s.`;
      game.messageTimer = 1.5;
      return null;
    }
    const unfound = scene().differences.filter((diff) => !game.found.has(diff.id));
    if (unfound.length === 0) return null;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    game.hintTarget = target;
    game.hintTimer = HINT_SHOW;
    game.hintsLeft -= 1;
    game.hintCooldown = HINT_COOLDOWN;
    game.message = 'A hint is glowing — look at the ring!';
    game.messageTimer = 2;
    return EVENT_HINT;
  }

  function nextScene() {
    startScene(game.sceneIndex + 1);
  }

  /** Advance the clock, the cooldowns and the little animations. */
  function update(dt) {
    if (game.screen !== 'play') return null;
    game.elapsed += dt;
    game.timeLeft -= dt;
    if (game.hintCooldown > 0) game.hintCooldown -= dt;
    if (game.hintTimer > 0) {
      game.hintTimer -= dt;
      if (game.hintTimer <= 0) game.hintTarget = null;
    }
    if (game.messageTimer > 0) game.messageTimer -= dt;
    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
      const particle = game.particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 120 * dt;
      if (particle.life <= 0) game.particles.splice(i, 1);
    }
    for (let i = game.floaters.length - 1; i >= 0; i -= 1) {
      const floater = game.floaters[i];
      floater.life -= dt;
      floater.y -= 34 * dt;
      if (floater.life <= 0) game.floaters.splice(i, 1);
    }
    for (let i = game.marks.length - 1; i >= 0; i -= 1) {
      const mark = game.marks[i];
      mark.life -= dt;
      if (mark.life <= 0) game.marks.splice(i, 1);
    }
    const wholeSecond = Math.ceil(game.timeLeft);
    if (game.timeLeft <= 10.5 && wholeSecond !== game.lastTickSecond && game.timeLeft > 0) {
      game.lastTickSecond = wholeSecond;
      return EVENT_TICK;
    }
    if (game.timeLeft <= 0) {
      game.timeLeft = 0;
      game.screen = 'lost';
      return EVENT_LOST;
    }
    return null;
  }

  /** For the staged screenshots only: mark differences found without clicking. */
  function forceFound(ids) {
    ids.forEach((id) => game.found.add(id));
    game.totalFound = game.found.size;
  }

  return {
    game,
    scene,
    remaining,
    start,
    startScene,
    clickAt,
    useHint,
    nextScene,
    update,
    forceFound,
  };
}
