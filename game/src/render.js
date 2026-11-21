// Drawing only: the game's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred. Each scene is
// painted once per panel into an offscreen canvas when the scene starts — the
// left copy plain, the right copy with all ten differences applied — and every
// frame just blits those two pictures, then draws the HUD, the gold rings on
// the differences found, the hint pulse, the sparkles and the screens on top.

import { FIELD, PALETTE, PANEL, FONT, SCENE_TIME } from './config.js';
import { SCENES, sceneRandom } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_SCENE_DONE = 'scene-done';
export const SCREEN_WON = 'won';
export const SCREEN_LOST = 'lost';

const PANEL_FRAME = 4;

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();
  const panelCache = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  /** Convert a point in canvas CSS pixels to logical playfield coordinates. */
  function toLogical(cssX, cssY) {
    const ratio = window.devicePixelRatio || 1;
    return {
      x: (cssX * ratio - view.x) / view.scale,
      y: (cssY * ratio - view.y) / view.scale,
    };
  }

  function text(value, x, y, size, color, align, baseline) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = baseline ?? 'alphabetic';
    context.fillText(value, x, y);
  }

  /** Paint one scene copy into an offscreen canvas: `applied` holds the ids to change. */
  function paintPanel(scene, applied) {
    const offscreen = document.createElement('canvas');
    offscreen.width = PANEL.width;
    offscreen.height = PANEL.height;
    const offCtx = offscreen.getContext('2d');
    scene.draw(offCtx, applied, sceneRandom(scene));
    return offscreen;
  }

  /** The two pre-painted pictures for a scene, left plain and right changed. */
  function panelsFor(scene) {
    let pair = panelCache.get(scene.id);
    if (!pair) {
      const all = new Set(scene.differences.map((diff) => diff.id));
      pair = { left: paintPanel(scene, new Set()), right: paintPanel(scene, all) };
      panelCache.set(scene.id, pair);
    }
    return pair;
  }

  function drawPanels(game) {
    const scene = SCENES[game.sceneIndex];
    const pair = panelsFor(scene);
    context.drawImage(pair.left, PANEL.leftX, PANEL.top);
    context.drawImage(pair.right, PANEL.rightX, PANEL.top);
    context.strokeStyle = PALETTE.panelFrame;
    context.lineWidth = PANEL_FRAME;
    context.strokeRect(PANEL.leftX - 2, PANEL.top - 2, PANEL.width + 4, PANEL.height + 4);
    context.strokeRect(PANEL.rightX - 2, PANEL.top - 2, PANEL.width + 4, PANEL.height + 4);
  }

  function drawFoundRings(game) {
    const scene = SCENES[game.sceneIndex];
    scene.differences.forEach((diff) => {
      if (!game.found.has(diff.id)) return;
      [PANEL.leftX, PANEL.rightX].forEach((panelX) => {
        const cx = panelX + diff.x;
        const cy = PANEL.top + diff.y;
        context.strokeStyle = PALETTE.gold;
        context.lineWidth = 4;
        context.beginPath();
        context.arc(cx, cy, 26, 0, Math.PI * 2);
        context.stroke();
        context.strokeStyle = PALETTE.gold;
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(cx - 10, cy);
        context.lineTo(cx - 3, cy + 8);
        context.lineTo(cx + 12, cy - 8);
        context.stroke();
      });
    });
  }

  function drawHint(game) {
    const target = game.hintTarget;
    if (!target) return;
    const pulse = 22 + Math.sin(game.elapsed * 6) * 5;
    [PANEL.leftX, PANEL.rightX].forEach((panelX) => {
      const cx = panelX + target.x;
      const cy = PANEL.top + target.y;
      context.strokeStyle = PALETTE.teal;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(cx, cy, pulse, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = 'rgba(79, 209, 197, 0.18)';
      context.beginPath();
      context.arc(cx, cy, pulse, 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawEffects(game) {
    game.particles.forEach((particle) => {
      const alpha = Math.max(0, particle.life / particle.max);
      [PANEL.leftX, PANEL.rightX].forEach((panelX) => {
        context.fillStyle = `rgba(242, 201, 76, ${alpha})`;
        context.beginPath();
        context.arc(panelX + particle.x, PANEL.top + particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });
    });
    game.floaters.forEach((floater) => {
      const alpha = Math.max(0, floater.life / floater.max);
      [PANEL.leftX, PANEL.rightX].forEach((panelX) => {
        text(floater.text, panelX + floater.x, PANEL.top + floater.y, 24, `rgba(242, 201, 76, ${alpha})`, 'center');
      });
    });
    game.marks.forEach((mark) => {
      const alpha = Math.max(0, mark.life / mark.max);
      const panelX = mark.panel === 'right' ? PANEL.rightX : PANEL.leftX;
      const cx = panelX + mark.x;
      const cy = PANEL.top + mark.y;
      context.strokeStyle = `rgba(229, 83, 75, ${alpha})`;
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(cx - 12, cy - 12);
      context.lineTo(cx + 12, cy + 12);
      context.moveTo(cx + 12, cy - 12);
      context.lineTo(cx - 12, cy + 12);
      context.stroke();
    });
  }

  function drawCursor(cursor) {
    if (!cursor.visible) return;
    const { x, y } = cursor;
    context.strokeStyle = cursor.fromMouse ? 'rgba(244, 239, 228, 0.55)' : PALETTE.gold;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, 12, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(x - 18, y);
    context.lineTo(x - 7, y);
    context.moveTo(x + 7, y);
    context.lineTo(x + 18, y);
    context.moveTo(x, y - 18);
    context.lineTo(x, y - 7);
    context.moveTo(x, y + 7);
    context.lineTo(x, y + 18);
    context.stroke();
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function drawHud(game) {
    const scene = SCENES[game.sceneIndex];
    const remaining = scene.differences.length - game.found.size;
    text('Lantern Twins', 24, 34, 26, PALETTE.title, 'left');
    text(`${scene.name}  ·  Scene ${game.sceneIndex + 1} of ${SCENES.length}`, FIELD.width / 2, 34, 22, PALETTE.text, 'center');
    text(`Score ${game.score}`, FIELD.width - 24, 34, 26, PALETTE.text, 'right');

    const low = game.timeLeft <= 30;
    text(`Time ${formatTime(game.timeLeft)}`, 24, 72, 22, low ? PALETTE.timerLow : PALETTE.text, 'left');
    text(`Found ${game.found.size} / ${scene.differences.length}  ·  ${remaining} to go`,
      FIELD.width / 2, 72, 24, remaining === 0 ? PALETTE.good : PALETTE.gold, 'center');
    text(game.hintsLeft > 0 ? `Hints ${game.hintsLeft}  ·  press H` : 'No hints left',
      FIELD.width - 24, 72, 22, PALETTE.muted, 'right');

    const fraction = Math.max(0, game.timeLeft / SCENE_TIME);
    context.fillStyle = '#2a2144';
    context.fillRect(24, 84, FIELD.width - 48, 8);
    context.fillStyle = low ? PALETTE.timerLow : PALETTE.gold;
    context.fillRect(24, 84, (FIELD.width - 48) * fraction, 8);
  }

  function drawBottomBar(game, cursor) {
    if (game.messageTimer > 0 && game.message) {
      text(game.message, FIELD.width / 2, 636, 22, PALETTE.text, 'center');
    }
    const combo = game.combo >= 2 ? `Combo x${Math.min(1 + (game.combo - 1) * 0.25, 3).toFixed(2)}  ·  ` : '';
    text(`${combo}Click a difference on either picture  ·  Arrows + Space work too  ·  H hint  ·  P pause  ·  M mute  ·  R restart`,
      FIELD.width / 2, 676, 18, PALETTE.muted, 'center');
    drawCursor(cursor);
  }

  function drawOverlay(title, lines, prompt, accent) {
    context.fillStyle = 'rgba(16, 11, 28, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    const width = 640;
    const height = 150 + lines.length * 34;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.hud;
    context.fillRect(x, y, width, height);
    context.strokeStyle = accent ?? PALETTE.panelFrame;
    context.lineWidth = 3;
    context.strokeRect(x, y, width, height);
    text(title, FIELD.width / 2, y + 72, 44, PALETTE.title, 'center');
    lines.forEach((line, index) => {
      text(line, FIELD.width / 2, y + 122 + index * 34, 22, PALETTE.text, 'center');
    });
    text(prompt, FIELD.width / 2, y + height - 30, 22, PALETTE.gold, 'center');
  }

  /** Paint one frame: the pictures, the HUD, the marks, then the screen overlay. */
  function draw(game, screen, best, cursor) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    drawPanels(game);
    if (screen === SCREEN_TITLE) {
      drawOverlay(
        'Lantern Twins',
        [
          'Two pictures, ten tiny changes. Find them all before the clock runs out.',
          'Click a difference on either picture — a gold ring marks every find.',
          'Three scenes grow harder: Harbour at Dusk, Foxglove Garden, Night Market.',
          `Best total score: ${best}`,
        ],
        'Press Space or click to start the hunt',
      );
      return;
    }
    drawHud(game);
    drawFoundRings(game);
    drawHint(game);
    drawEffects(game);
    drawBottomBar(game, cursor);

    if (screen === SCREEN_PAUSED) {
      drawOverlay('Paused', ['The lanterns will wait for you.'], 'Press P to keep hunting');
    } else if (screen === SCREEN_SCENE_DONE) {
      const scene = SCENES[game.sceneIndex];
      drawOverlay(
        'Scene complete!',
        [
          `You found all ${scene.differences.length} differences in ${scene.name}.`,
          `Time bonus +${game.sceneBonus}  ·  Score ${game.score}`,
          game.sceneIndex + 1 < SCENES.length
            ? `Next: ${SCENES[game.sceneIndex + 1].name}`
            : '',
        ].filter(Boolean),
        'Press Space or click for the next scene',
        PALETTE.good,
      );
    } else if (screen === SCREEN_WON) {
      drawOverlay(
        'You found them all!',
        [
          `Every difference in all three scenes — total score ${game.score}.`,
          `Best combo x${game.bestCombo}  ·  Best total score ${best}`,
          'The lanterns burn bright tonight.',
        ],
        'Press Space or click to hunt again',
        PALETTE.gold,
      );
    } else if (screen === SCREEN_LOST) {
      const scene = SCENES[game.sceneIndex];
      drawOverlay(
        'Out of time!',
        [
          `You found ${game.found.size} of ${scene.differences.length} differences in ${scene.name}.`,
          `Score ${game.score} — so close. The changes are still hiding there.`,
        ],
        'Press Space or click to try this scene again',
        PALETTE.danger,
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toLogical, panelsFor };
}
