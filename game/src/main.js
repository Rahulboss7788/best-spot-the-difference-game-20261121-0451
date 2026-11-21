// Boot and the one loop: input is read every frame, the game advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between six screens: title, play,
// paused, scene-done, won and lost.
//
// ?seed=N fixes the decorative random seed (the scenes use their own fixed seeds,
// so a plain load is already deterministic). ?shot=start|play|play2|end stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, PANEL, STEP } from './config.js';
import { SCENES } from './scenes.js';
import {
  EVENT_FOUND,
  EVENT_HINT,
  EVENT_LOST,
  EVENT_SCENE_DONE,
  EVENT_TICK,
  EVENT_WON,
  EVENT_WRONG,
  createGame,
} from './state.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM,
  ACTION_HINT,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const gameApi = createGame();
const game = gameApi.game;
const audio = createAudio();
const renderer = createRenderer(canvas);
const input = createInput(canvas, renderer.toLogical);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

/** A click on the canvas: which picture it landed on, and where inside it. */
function panelHit(point) {
  const insideY = point.y >= PANEL.top && point.y <= PANEL.top + PANEL.height;
  if (!insideY) return null;
  if (point.x >= PANEL.leftX && point.x <= PANEL.leftX + PANEL.width) {
    return { panel: 'left', x: point.x - PANEL.leftX, y: point.y - PANEL.top };
  }
  if (point.x >= PANEL.rightX && point.x <= PANEL.rightX + PANEL.width) {
    return { panel: 'right', x: point.x - PANEL.rightX, y: point.y - PANEL.top };
  }
  return null;
}

function playSound(event) {
  if (event === EVENT_FOUND) audio.find();
  else if (event === EVENT_WRONG) audio.wrong();
  else if (event === EVENT_HINT) audio.hint();
  else if (event === EVENT_TICK) audio.tick();
  else if (event === EVENT_SCENE_DONE || event === EVENT_WON) audio.win();
  else if (event === EVENT_LOST) audio.lose();
}

function runShot(name) {
  const scene = stageShot(name, gameApi);
  let painted = 0;
  function paint() {
    renderer.draw(game, scene.screen, scene.best, input.cursor);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each find.
  function announce(message) {
    status.textContent = message;
  }

  function startHunt() {
    audio.unlock();
    gameApi.start();
    announce(`Playing ${SCENES[0].name}. Find 10 differences.`);
  }

  function handleClicks() {
    const clicks = input.takeClicks();
    for (let i = 0; i < clicks.length; i += 1) {
      const point = clicks[i];
      audio.unlock();
      if (game.screen === 'title' || game.screen === 'won') {
        startHunt();
        continue;
      }
      if (game.screen === 'scene-done') {
        gameApi.nextScene();
        announce(`Playing ${SCENES[game.sceneIndex].name}. Find 10 differences.`);
        continue;
      }
      if (game.screen === 'lost') {
        gameApi.startScene(game.sceneIndex);
        announce(`Trying ${SCENES[game.sceneIndex].name} again.`);
        continue;
      }
      if (game.screen !== 'play') continue;
      const hit = panelHit(point);
      if (!hit) continue;
      playSound(gameApi.clickAt(hit.x, hit.y, hit.panel));
      if (game.screen === 'won' && game.score > best) {
        best = game.score;
        saveBest(best);
      }
      announce(game.message);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && game.screen === 'play') {
      gameApi.startScene(game.sceneIndex);
      announce(`Restarted ${SCENES[game.sceneIndex].name}.`);
      return;
    }
    if (actions & ACTION_HINT && game.screen === 'play') {
      playSound(gameApi.useHint());
      announce(game.message);
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (game.screen === 'title' || game.screen === 'won') startHunt();
      else if (game.screen === 'scene-done') {
        gameApi.nextScene();
        announce(`Playing ${SCENES[game.sceneIndex].name}. Find 10 differences.`);
      } else if (game.screen === 'lost') {
        gameApi.startScene(game.sceneIndex);
        announce(`Trying ${SCENES[game.sceneIndex].name} again.`);
      } else if (game.screen === 'play') {
        // The keyboard crosshair clicks where it stands.
        const hit = panelHit(input.cursor);
        if (hit) {
          playSound(gameApi.clickAt(hit.x, hit.y, hit.panel));
          if (game.screen === 'won' && game.score > best) {
            best = game.score;
            saveBest(best);
          }
          announce(game.message);
        }
      }
    }
    if (actions & ACTION_PAUSE) {
      if (game.screen === 'play') {
        game.screen = 'paused';
        announce('Paused.');
      } else if (game.screen === 'paused') {
        game.screen = 'play';
        announce('Playing.');
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleClicks();
    handleActions();
    input.moveCursor(STEP);
    if (game.screen === 'play') {
      while (accumulator >= STEP && game.screen === 'play') {
        playSound(gameApi.update(STEP));
        accumulator -= STEP;
      }
      if (game.screen === 'won' && game.score > best) {
        best = game.score;
        saveBest(best);
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(game, game.screen, best, input.cursor);
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.screen === 'play') {
      game.screen = 'paused';
      announce('Paused.');
    }
  });

  announce('Lantern Twins. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
