// The three scenes of Lantern Twins, every pixel drawn in code — no images, no
// copied art. Each scene is drawn twice: once plain for the left panel, once with
// its ten differences applied for the right panel. A difference is one small,
// deliberate change (a missing gull, a sail in another colour, a frog that hopped
// away) at a fixed spot, so it is fair to find and hard to spot at a glance.
// Decorative details use a seeded generator, so both panels agree on everything
// except the differences themselves.
//
// A scene is drawn in a 600x500 space. `draw(ctx, applied, rng)` paints it;
// `applied` is the set of difference ids to apply to this copy.

import { createRandom } from './random.js';

/* ---------- tiny drawing helpers, shared by the three scenes ---------- */

function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function strokeLine(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function skyGradient(ctx, top, bottom, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, height);
}

function cloud(ctx, x, y, scale, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 42 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 28 * scale, y + 5 * scale, 26 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 30 * scale, y + 5 * scale, 28 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- Scene 1: Harbour at Dusk ---------- */

const HARBOUR_DIFFERENCES = [
  { id: 'sun-rays', x: 470, y: 88, r: 40, hint: 'The sun itself' },
  { id: 'lighthouse-light', x: 85, y: 165, r: 30, hint: 'The lighthouse lamp' },
  { id: 'gull', x: 210, y: 130, r: 22, hint: 'A bird in the sky' },
  { id: 'sail-colour', x: 315, y: 318, r: 30, hint: 'The big sail' },
  { id: 'crate', x: 545, y: 372, r: 26, hint: 'The crates on the dock' },
  { id: 'lantern-glow', x: 180, y: 378, r: 26, hint: 'The dock lantern' },
  { id: 'fish', x: 380, y: 318, r: 26, hint: 'Something in the water' },
  { id: 'window', x: 215, y: 268, r: 22, hint: 'The harbour house' },
  { id: 'rope', x: 250, y: 415, r: 24, hint: 'The dock boards' },
  { id: 'flag', x: 302, y: 288, r: 20, hint: 'The top of the mast' },
];

function drawHarbour(ctx, applied, rng) {
  skyGradient(ctx, '#2b1e4f', '#c96f3f', 300);

  // The setting sun, with rays — unless this copy lost them.
  circle(ctx, 470, 88, 36, '#ffd97a');
  circle(ctx, 470, 88, 26, '#ffe9a8');
  if (!applied.has('sun-rays')) {
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      strokeLine(ctx, 470 + Math.cos(angle) * 44, 88 + Math.sin(angle) * 44,
        470 + Math.cos(angle) * 58, 88 + Math.sin(angle) * 58, '#ffd97a', 4);
    }
  }

  cloud(ctx, 120, 70, 1, 'rgba(255, 190, 160, 0.55)');
  cloud(ctx, 320, 50, 0.8, 'rgba(255, 190, 160, 0.45)');
  cloud(ctx, 200, 120, 0.7, 'rgba(255, 170, 150, 0.4)');

  // Three gulls wheel over the water — unless one flew off.
  const gulls = [[150, 150], [210, 130], [330, 160]];
  gulls.forEach(([x, y], index) => {
    if (index === 1 && applied.has('gull')) return;
    ctx.strokeStyle = '#241a33';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x - 7, y, 7, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(x + 7, y, 7, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  });

  // A dark headland across the bay, and the harbour house beneath it.
  poly(ctx, [[0, 300], [0, 262], [90, 272], [150, 258], [190, 300]], '#1d1430');
  rect(ctx, 140, 240, 100, 60, '#e8b06a');
  poly(ctx, [[132, 242], [190, 210], [248, 242]], '#8a3d2e');
  rect(ctx, 158, 262, 18, 22, '#ffd97a');
  rect(ctx, 206, 262, 18, 22, applied.has('window') ? '#3a2f4d' : '#ffd97a');
  rect(ctx, 182, 272, 16, 28, '#5e2f22');

  // The lighthouse, striped, its beam sweeping the bay — unless the lamp is out.
  const beamOn = !applied.has('lighthouse-light');
  poly(ctx, [[62, 300], [70, 168], [100, 168], [108, 300]], '#f4efe4');
  rect(ctx, 66, 240, 38, 18, '#c94f3d');
  rect(ctx, 68, 200, 34, 16, '#c94f3d');
  rect(ctx, 66, 168, 38, 10, '#3a2f4d');
  circle(ctx, 85, 156, 12, beamOn ? '#ffe9a8' : '#4a4260');
  if (beamOn) {
    ctx.fillStyle = 'rgba(255, 233, 168, 0.28)';
    ctx.beginPath();
    ctx.moveTo(95, 150);
    ctx.lineTo(300, 110);
    ctx.lineTo(300, 185);
    ctx.lineTo(95, 165);
    ctx.closePath();
    ctx.fill();
    circle(ctx, 85, 156, 20, 'rgba(255, 233, 168, 0.25)');
  }

  // The sea, with the sun's gold path and lazy wave strokes.
  const sea = ctx.createLinearGradient(0, 300, 0, 500);
  sea.addColorStop(0, '#2c5378');
  sea.addColorStop(1, '#16324f');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 300, 600, 200);
  for (let i = 0; i < 9; i += 1) {
    const y = 318 + i * 18;
    strokeLine(ctx, 452, y, 488, y, 'rgba(255, 217, 122, 0.5)', 3);
  }
  for (let i = 0; i < 26; i += 1) {
    const x = 20 + rng() * 560;
    const y = 310 + rng() * 175;
    strokeLine(ctx, x, y, x + 18 + rng() * 22, y, 'rgba(255,255,255,0.16)', 2);
  }

  // The sailing boat, its sail red — or teal, on the other picture.
  strokeLine(ctx, 300, 332, 300, 282, '#5e2f22', 4);
  poly(ctx, [[302, 288], [302, 330], [338, 330]], applied.has('sail-colour') ? '#3d9bd9' : '#d94f3d');
  poly(ctx, [[298, 296], [298, 330], [276, 330]], '#f4efe4');
  poly(ctx, [[302, 282], [322, 288], [302, 294]], applied.has('flag') ? '#f2c94c' : '#d94f3d');
  poly(ctx, [[268, 330], [342, 330], [330, 348], [280, 348]], '#6b3d24');
  // A little rowboat, and a fish that jumps — unless it already dived.
  poly(ctx, [[452, 366], [508, 366], [496, 380], [464, 380]], '#7a4a28');
  strokeLine(ctx, 470, 362, 458, 348, '#8a5a30', 3);
  strokeLine(ctx, 492, 362, 504, 348, '#8a5a30', 3);
  if (!applied.has('fish')) {
    ctx.strokeStyle = '#9fc4e8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(380, 322, 12, Math.PI, Math.PI * 2);
    ctx.stroke();
    poly(ctx, [[368, 318], [358, 310], [368, 310]], '#9fc4e8');
    strokeLine(ctx, 366, 332, 394, 332, 'rgba(255,255,255,0.5)', 2);
  }

  // The wooden dock along the bottom, with its posts and planks.
  rect(ctx, 0, 400, 600, 44, '#7a5230');
  for (let x = 0; x < 600; x += 48) {
    strokeLine(ctx, x, 400, x, 444, '#5e3d22', 2);
    rect(ctx, x + 6, 400, 6, 44, '#5e3d22');
  }
  for (let x = 30; x < 600; x += 90) rect(ctx, x, 444, 10, 26, '#5e3d22');

  // A coil of rope on the dock — unless someone took it.
  if (!applied.has('rope')) {
    circle(ctx, 250, 418, 14, '#c9a86a');
    circle(ctx, 250, 418, 9, '#a8874e');
    circle(ctx, 250, 418, 4, '#c9a86a');
  }

  // The lantern post: its lamp burns amber — or green, on the other picture.
  strokeLine(ctx, 180, 444, 180, 352, '#2e2438', 5);
  strokeLine(ctx, 180, 352, 198, 352, '#2e2438', 4);
  const glow = applied.has('lantern-glow') ? '#7ddc7a' : '#ffb347';
  circle(ctx, 190, 372, 16, glow + '55');
  rect(ctx, 182, 360, 16, 24, glow);
  rect(ctx, 180, 356, 20, 5, '#2e2438');

  // Crates stacked at the dock's end — one more, on the other picture.
  rect(ctx, 516, 372, 28, 28, '#a8763e');
  rect(ctx, 544, 372, 28, 28, '#a8763e');
  rect(ctx, 530, 344, 28, 28, '#a8763e');
  if (applied.has('crate')) rect(ctx, 558, 344, 24, 28, '#a8763e');
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 2;
  [[516, 372], [544, 372], [530, 344]].forEach(([x, y]) => ctx.strokeRect(x + 2, y + 2, 24, 24));
}

/* ---------- Scene 2: Foxglove Garden ---------- */

const GARDEN_DIFFERENCES = [
  { id: 'cloud', x: 420, y: 60, r: 34, hint: 'The sky' },
  { id: 'fence', x: 360, y: 268, r: 24, hint: 'The garden fence' },
  { id: 'foxglove', x: 460, y: 190, r: 24, hint: 'The tall pink flowers' },
  { id: 'frog', x: 400, y: 405, r: 26, hint: 'The pond' },
  { id: 'mushroom', x: 96, y: 408, r: 22, hint: 'The mushrooms' },
  { id: 'bee', x: 350, y: 170, r: 22, hint: 'Something buzzing' },
  { id: 'butterfly', x: 250, y: 240, r: 24, hint: 'Near the flowers' },
  { id: 'snail', x: 280, y: 380, r: 22, hint: 'A leaf on the ground' },
  { id: 'watering-can', x: 530, y: 300, r: 26, hint: 'The gardener’s tools' },
  { id: 'daisy', x: 170, y: 430, r: 22, hint: 'A small white flower' },
];

function drawGarden(ctx, applied, rng) {
  skyGradient(ctx, '#9fd4f2', '#e8f7ff', 260);
  circle(ctx, 90, 70, 30, '#ffd97a');
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    strokeLine(ctx, 90 + Math.cos(angle) * 38, 70 + Math.sin(angle) * 38,
      90 + Math.cos(angle) * 50, 70 + Math.sin(angle) * 50, '#ffd97a', 4);
  }
  cloud(ctx, 200, 90, 0.9, 'rgba(255,255,255,0.9)');
  cloud(ctx, 520, 120, 0.8, 'rgba(255,255,255,0.85)');
  if (!applied.has('cloud')) cloud(ctx, 420, 60, 1, 'rgba(255,255,255,0.9)');

  // Rolling hills, the fence, and the pond.
  ellipse(ctx, 180, 330, 260, 110, '#7ec850');
  ellipse(ctx, 470, 350, 280, 120, '#5da83f');
  rect(ctx, 0, 400, 600, 100, '#4c8f36');

  // The white picket fence — unless one picket went missing.
  rect(ctx, 0, 248, 600, 8, '#f4efe4');
  rect(ctx, 0, 282, 600, 8, '#f4efe4');
  for (let x = 10; x < 600; x += 40) {
    if (x === 370 && applied.has('fence')) continue;
    poly(ctx, [[x, 300], [x, 240], [x + 8, 232], [x + 16, 240], [x + 16, 300]], '#f4efe4');
  }

  // Foxgloves: tall stalks with hanging bells — one bell turned white.
  const stalks = [120, 300, 460];
  stalks.forEach((x, stalkIndex) => {
    strokeLine(ctx, x, 330, x, 150, '#3e7a2e', 5);
    for (let i = 0; i < 5; i += 1) {
      const y = 175 + i * 26;
      const isOddBell = stalkIndex === 2 && i === 1;
      const bellColor = isOddBell && applied.has('foxglove') ? '#f4efe4' : '#e56aa0';
      ellipse(ctx, x - 12, y, 9, 13, bellColor);
      ellipse(ctx, x + 12, y + 6, 9, 13, bellColor);
    }
    circle(ctx, x, 148, 8, '#e56aa0');
  });

  // The pond, its lily pads, and the frog — unless it hopped away.
  ellipse(ctx, 430, 425, 130, 52, '#3d9bd9');
  ellipse(ctx, 430, 425, 110, 40, '#5cb3e8');
  ellipse(ctx, 380, 415, 34, 12, '#3e7a2e');
  ellipse(ctx, 480, 435, 30, 11, '#3e7a2e');
  if (!applied.has('frog')) {
    ellipse(ctx, 400, 402, 18, 13, '#5da83f');
    circle(ctx, 392, 392, 6, '#5da83f');
    circle(ctx, 408, 392, 6, '#5da83f');
    circle(ctx, 390, 390, 2, '#1d1430');
    circle(ctx, 410, 390, 2, '#1d1430');
  }
  // Ripples where the frog sat, and the little daisy by the bank.
  strokeLine(ctx, 380, 428, 420, 428, 'rgba(255,255,255,0.5)', 2);
  strokeLine(ctx, 470, 440, 500, 440, 'rgba(255,255,255,0.5)', 2);
  if (!applied.has('daisy')) {
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      ellipse(ctx, 170 + Math.cos(angle) * 9, 430 + Math.sin(angle) * 9, 5, 3, '#f4efe4');
    }
    circle(ctx, 170, 430, 5, '#f2c94c');
    strokeLine(ctx, 170, 438, 170, 452, '#3e7a2e', 3);
  }

  // Mushrooms under the old oak's shade — the smallest one, sometimes gone.
  function mushroom(x, y, scale) {
    strokeLine(ctx, x, y, x, y - 18 * scale, '#f4efe4', 7 * scale);
    ctx.fillStyle = '#d94f3d';
    ctx.beginPath();
    ctx.arc(x, y - 18 * scale, 16 * scale, Math.PI, 0);
    ctx.fill();
    circle(ctx, x - 6 * scale, y - 26 * scale, 2.5, '#f4efe4');
    circle(ctx, x + 5 * scale, y - 22 * scale, 2.5, '#f4efe4');
  }
  mushroom(130, 420, 1.2);
  mushroom(168, 424, 0.9);
  if (!applied.has('mushroom')) mushroom(96, 420, 0.7);

  // A snail on its leaf, and the watering can by the beds.
  ellipse(ctx, 280, 384, 26, 10, '#3e7a2e');
  if (!applied.has('snail')) {
    circle(ctx, 280, 372, 10, '#c98a5a');
    circle(ctx, 280, 372, 5, '#a86a3e');
    circle(ctx, 292, 378, 4, '#c98a5a');
  }
  if (!applied.has('watering-can')) {
    rect(ctx, 516, 288, 30, 26, '#4f8f5a');
    strokeLine(ctx, 546, 296, 566, 282, '#4f8f5a', 5);
    strokeLine(ctx, 516, 296, 500, 282, '#4f8f5a', 5);
    circle(ctx, 566, 280, 4, '#4f8f5a');
  }

  // A butterfly — orange on one picture, blue on the other — and two bees.
  const wing = applied.has('butterfly') ? '#4f8ff2' : '#f28c2e';
  ellipse(ctx, 240, 236, 12, 16, wing);
  ellipse(ctx, 260, 236, 12, 16, wing);
  circle(ctx, 250, 240, 4, '#3a2f4d');
  function bee(x, y) {
    ellipse(ctx, x, y, 11, 8, '#f2c94c');
    strokeLine(ctx, x - 3, y - 7, x - 3, y + 7, '#1d1430', 3);
    strokeLine(ctx, x + 3, y - 7, x + 3, y + 7, '#1d1430', 3);
    ellipse(ctx, x - 4, y - 9, 7, 4, 'rgba(255,255,255,0.7)');
  }
  bee(200, 200);
  if (!applied.has('bee')) bee(350, 170);

  // Grass blades and tiny wildflowers, scattered by the seeded generator.
  for (let i = 0; i < 40; i += 1) {
    const x = 10 + rng() * 580;
    const y = 350 + rng() * 130;
    strokeLine(ctx, x, y, x + 3, y - 10, '#3e7a2e', 2);
  }
}

/* ---------- Scene 3: Night Market ---------- */

const MARKET_DIFFERENCES = [
  { id: 'star', x: 120, y: 60, r: 22, hint: 'The night sky' },
  { id: 'moon', x: 510, y: 62, r: 24, hint: 'The moon' },
  { id: 'bulb', x: 300, y: 118, r: 22, hint: 'The string lights' },
  { id: 'fruit', x: 150, y: 305, r: 22, hint: 'The fruit stall' },
  { id: 'steam', x: 210, y: 282, r: 24, hint: 'The teapot' },
  { id: 'hat', x: 430, y: 248, r: 26, hint: 'The stallkeeper' },
  { id: 'cat', x: 150, y: 172, r: 26, hint: 'On the awning' },
  { id: 'lantern', x: 300, y: 210, r: 28, hint: 'The hanging lantern' },
  { id: 'sack', x: 500, y: 420, r: 24, hint: 'The cart' },
  { id: 'balloon', x: 540, y: 380, r: 24, hint: 'Something floating' },
];

function drawMarket(ctx, applied, rng) {
  skyGradient(ctx, '#0d1030', '#232a5e', 300);
  // Stars, one of them bright with a sparkle — unless it went out.
  for (let i = 0; i < 42; i += 1) {
    const x = 10 + rng() * 580;
    const y = 10 + rng() * 220;
    circle(ctx, x, y, rng() > 0.85 ? 2.5 : 1.5, 'rgba(255,255,255,0.85)');
  }
  if (!applied.has('star')) {
    circle(ctx, 120, 60, 4, '#ffffff');
    strokeLine(ctx, 120, 48, 120, 72, '#ffffff', 2);
    strokeLine(ctx, 108, 60, 132, 60, '#ffffff', 2);
  }

  // The moon, and the crater that is only on one picture.
  circle(ctx, 500, 70, 30, '#f4ead2');
  circle(ctx, 492, 62, 5, '#d8c9a3');
  circle(ctx, 508, 78, 4, '#d8c9a3');
  if (!applied.has('moon')) circle(ctx, 510, 62, 4, '#d8c9a3');

  // String lights sagging across the top, one bulb dark on the other picture.
  const lightSpots = [];
  for (let x = 40; x <= 560; x += 46) {
    const y = 92 + Math.sin((x / 600) * Math.PI) * 26;
    lightSpots.push([x, y]);
  }
  ctx.strokeStyle = '#3a2f5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 88);
  lightSpots.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(580, 88);
  ctx.stroke();
  lightSpots.forEach(([x, y], index) => {
    const dark = index === 6 && applied.has('bulb');
    circle(ctx, x, y + 8, 7, dark ? '#3a2f5e' : '#ffd97a');
    if (!dark) circle(ctx, x, y + 8, 12, 'rgba(255, 217, 122, 0.25)');
  });

  // The two stalls: striped awnings, counters, goods.
  function stall(x, awningA, awningB) {
    for (let i = 0; i < 5; i += 1) rect(ctx, x + i * 44, 180, 22, 34, i % 2 ? awningB : awningA);
    rect(ctx, x, 180, 220, 34, 'rgba(0,0,0,0)');
    rect(ctx, x + 6, 320, 208, 60, '#6b3d24');
    rect(ctx, x + 6, 320, 208, 10, '#8a5a30');
    strokeLine(ctx, x + 8, 214, x + 8, 320, '#3a2f4d', 4);
    strokeLine(ctx, x + 212, 214, x + 212, 320, '#3a2f4d', 4);
  }
  stall(40, '#c94f3d', '#f4efe4');
  stall(340, '#2e8f86', '#f4efe4');

  // The cat asleep on the left awning — unless it wandered off.
  if (!applied.has('cat')) {
    ellipse(ctx, 150, 172, 26, 10, '#e8a34c');
    circle(ctx, 172, 166, 9, '#e8a34c');
    poly(ctx, [[168, 158], [172, 150], [176, 158]], '#e8a34c');
    strokeLine(ctx, 128, 176, 112, 172, '#e8a34c', 5);
  }

  // Fruit piled on the left counter — one orange is a green apple, other side.
  const fruits = [[90, 306], [118, 300], [150, 305], [176, 310], [132, 312], [104, 314]];
  fruits.forEach(([x, y], index) => {
    const isApple = index === 2 && applied.has('fruit');
    circle(ctx, x, y, 11, isApple ? '#7ddc7a' : '#f28c2e');
    if (isApple) strokeLine(ctx, x, y - 11, x + 3, y - 17, '#3e7a2e', 2);
  });

  // The teapot, steaming — unless the steam faded.
  ellipse(ctx, 210, 300, 16, 12, '#8a6fc9');
  poly(ctx, [[196, 292], [188, 284], [196, 284]], '#8a6fc9');
  circle(ctx, 210, 284, 5, '#8a6fc9');
  if (!applied.has('steam')) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(210, 276);
    ctx.quadraticCurveTo(204, 264, 210, 254);
    ctx.quadraticCurveTo(216, 244, 210, 236);
    ctx.stroke();
  }

  // The stallkeeper behind the right stall, red hat — or green, other side.
  circle(ctx, 430, 262, 16, '#e8b98a');
  poly(ctx, [[414, 252], [430, 228], [446, 252]], applied.has('hat') ? '#4f8f5a' : '#c94f3d');
  rect(ctx, 410, 250, 40, 6, applied.has('hat') ? '#4f8f5a' : '#c94f3d');
  poly(ctx, [[400, 330], [460, 330], [452, 278], [408, 278]], '#2e6f8f');

  // The paper lantern hanging between the stalls — pink, or gold, other side.
  strokeLine(ctx, 300, 130, 300, 186, '#3a2f5e', 3);
  const lanternColor = applied.has('lantern') ? '#f2c94c' : '#f28bb0';
  ellipse(ctx, 300, 212, 22, 26, lanternColor);
  circle(ctx, 300, 212, 28, lanternColor + '44');
  rect(ctx, 292, 182, 16, 6, '#c94f3d');
  strokeLine(ctx, 300, 238, 300, 252, '#f2c94c', 3);

  // The cart with its sacks — one sack more, other side — and the balloon.
  rect(ctx, 440, 400, 110, 14, '#7a5230');
  rect(ctx, 446, 414, 98, 8, '#5e3d22');
  circle(ctx, 462, 428, 12, '#3a2f4d');
  circle(ctx, 528, 428, 12, '#3a2f4d');
  ellipse(ctx, 470, 392, 22, 14, '#c9a86a');
  ellipse(ctx, 500, 394, 20, 13, '#b08a4e');
  if (applied.has('sack')) ellipse(ctx, 522, 388, 18, 12, '#c9a86a');
  strokeLine(ctx, 540, 400, 540, 372, '#f4efe4', 2);
  circle(ctx, 540, 356, 16, applied.has('balloon') ? '#9b6df2' : '#d94f3d');
  poly(ctx, [[540, 372], [534, 380], [546, 380]], applied.has('balloon') ? '#9b6df2' : '#d94f3d');

  // Cobblestones underfoot.
  for (let i = 0; i < 30; i += 1) {
    const x = 10 + rng() * 580;
    const y = 440 + rng() * 50;
    ellipse(ctx, x, y, 12 + rng() * 8, 5, 'rgba(255,255,255,0.07)');
  }
}

/* ---------- the scene catalogue ---------- */

export const SCENES = [
  {
    id: 'harbour',
    name: 'Harbour at Dusk',
    tagline: 'Ten changes hide where the sun meets the sea.',
    seed: 20261121,
    differences: HARBOUR_DIFFERENCES,
    draw: drawHarbour,
  },
  {
    id: 'garden',
    name: 'Foxglove Garden',
    tagline: 'Ten changes hide among the bells and bees.',
    seed: 711171,
    differences: GARDEN_DIFFERENCES,
    draw: drawGarden,
  },
  {
    id: 'market',
    name: 'Night Market',
    tagline: 'Ten changes hide under the string lights.',
    seed: 314159,
    differences: MARKET_DIFFERENCES,
    draw: drawMarket,
  },
];

/** A fresh seeded generator for one scene's decorative details. */
export function sceneRandom(scene) {
  return createRandom(scene.seed);
}
