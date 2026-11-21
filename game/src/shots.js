// The screenshot scenes behind ?shot=start|play|play2|end. Each one sets the real
// game to a state a player could reach — never a hand-painted frame — so the
// screenshots are honest renders of the game's own code: the title over the
// harbour, a hunt halfway through with gold rings on the differences found and
// the counter showing how many are left, the garden deeper in, and the win
// screen after all three scenes. The same seed always gives the same frame.

import { SCENES } from './scenes.js';
import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_WON } from './render.js';

/** The differences the play scene shows as already found: four rings, six to go. */
const PLAY_FOUND = ['sun-rays', 'sail-colour', 'lantern-glow', 'fish'];
/** The garden scene shows six found, four still hiding. */
const GARDEN_FOUND = ['cloud', 'foxglove', 'frog', 'bee', 'butterfly', 'daisy'];

function settlePlay(gameApi, sceneIndex, foundIds, timeLeft, score) {
  gameApi.startScene(sceneIndex);
  gameApi.forceFound(foundIds);
  gameApi.game.timeLeft = timeLeft;
  gameApi.game.score = score;
  gameApi.game.message = `${foundIds.length} found — ${SCENES[sceneIndex].differences.length - foundIds.length} still hiding. Look closely!`;
  gameApi.game.messageTimer = 10;
  gameApi.game.screen = 'play';
}

/**
 * Set the game to the named scene (start, play, play2 or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, gameApi) {
  if (name === 'play') {
    settlePlay(gameApi, 0, PLAY_FOUND, 96, 460);
    return { screen: SCREEN_PLAY, best: 1240 };
  }
  if (name === 'play2') {
    settlePlay(gameApi, 1, GARDEN_FOUND, 74, 1380);
    return { screen: SCREEN_PLAY, best: 1240 };
  }
  if (name === 'end') {
    // The win screen over the last scene, all ten of its differences found.
    gameApi.start();
    gameApi.startScene(2);
    gameApi.forceFound(SCENES[2].differences.map((diff) => diff.id));
    gameApi.game.screen = 'won';
    gameApi.game.score = 3420;
    gameApi.game.bestCombo = 6;
    gameApi.game.totalFound = 30;
    gameApi.game.timeLeft = 41;
    return { screen: SCREEN_WON, best: 3420 };
  }
  gameApi.startScene(0);
  gameApi.game.screen = 'title';
  return { screen: SCREEN_TITLE, best: 1240 };
}
