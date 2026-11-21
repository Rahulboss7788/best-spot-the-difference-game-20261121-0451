// Mouse and keyboard, in one place. The mouse clicks straight on the pictures;
// the keyboard drives a crosshair instead: arrows or WASD move it, Space or
// Enter clicks where it stands, H asks for a hint, P pauses, M mutes, R restarts
// the scene. Every action is queued and handed to main.js once a frame, so a
// fast double-click can never be swallowed by a slow frame.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

const CURSOR_SPEED = 520;

export function createInput(canvas, toLogical) {
  const clicks = [];
  const cursor = { x: 324, y: 346, visible: false, fromMouse: false };
  const held = new Set();
  let actions = 0;

  function logicalFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return toLogical(event.clientX - rect.left, event.clientY - rect.top);
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = logicalFromEvent(event);
    cursor.x = point.x;
    cursor.y = point.y;
    cursor.visible = true;
    cursor.fromMouse = true;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = logicalFromEvent(event);
    cursor.x = point.x;
    cursor.y = point.y;
    cursor.visible = true;
    cursor.fromMouse = true;
    clicks.push(point);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (key === 'p' || key === 'escape') actions |= ACTION_PAUSE;
    else if (key === 'h') actions |= ACTION_HINT;
    else if (key === 'm') actions |= ACTION_MUTE;
    else if (key === 'r') actions |= ACTION_RESTART;
    else if (key === 'arrowleft' || key === 'arrowright' || key === 'arrowup' || key === 'arrowdown'
      || key === 'a' || key === 'd' || key === 'w' || key === 's') {
      held.add(key);
      cursor.visible = true;
      cursor.fromMouse = false;
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.key.toLowerCase());
  });

  /** Move the keyboard crosshair for this frame's step. */
  function moveCursor(dt) {
    let dx = 0;
    let dy = 0;
    if (held.has('arrowleft') || held.has('a')) dx -= 1;
    if (held.has('arrowright') || held.has('d')) dx += 1;
    if (held.has('arrowup') || held.has('w')) dy -= 1;
    if (held.has('arrowdown') || held.has('s')) dy += 1;
    if (dx === 0 && dy === 0) return;
    const length = Math.hypot(dx, dy);
    cursor.x = Math.min(1256, Math.max(24, cursor.x + (dx / length) * CURSOR_SPEED * dt));
    cursor.y = Math.min(596, Math.max(96, cursor.y + (dy / length) * CURSOR_SPEED * dt));
  }

  return {
    cursor,
    moveCursor,
    /** The clicks since the last call, oldest first. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    /** The queued actions since the last call, as a bitmask. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
