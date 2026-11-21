// Lantern Twins — every tuning number, colour and layout constant in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The two picture panels: 600x500 each, side by side under the HUD. */
export const PANEL = { width: 600, height: 500, top: 96, leftX: 24, rightX: 656, gap: 32 };

/** Seconds on the clock when a scene starts; a wrong click costs WRONG_PENALTY seconds. */
export const SCENE_TIME = 150;
export const WRONG_PENALTY = 5;

/** Hints per scene, and the cooldown between two hints, in seconds. */
export const HINTS_PER_SCENE = 3;
export const HINT_COOLDOWN = 6;
/** How long a hint's pulsing ring stays on the picture, in seconds. */
export const HINT_SHOW = 2.5;

/** Scoring: a find is worth FIND_POINTS times the combo multiplier (1 + combo * 0.25,
 * capped at x3); finishing a scene pays TIME_BONUS per second left on the clock. */
export const FIND_POINTS = 100;
export const COMBO_STEP = 0.25;
export const COMBO_MAX = 3;
export const TIME_BONUS = 2;

/** How far, in scene pixels, a click may land from a difference's centre and still count. */
export const CLICK_RADIUS = 34;

/** Seconds a wrong-click X mark and a find's sparkle burst stay visible. */
export const MARK_FADE = 0.9;
export const SPARKLE_LIFE = 0.8;

export const PALETTE = {
  backdrop: '#14101f',
  hud: '#1d1830',
  panelFrame: '#3a2f5e',
  panelFrameFound: '#f2c94c',
  text: '#f4efe4',
  muted: '#a89ec4',
  gold: '#f2c94c',
  teal: '#4fd1c5',
  danger: '#e5534b',
  good: '#7ddc7a',
  timerLow: '#ff6b5e',
  title: '#ffd97a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'lantern-twins.best';
