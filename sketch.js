// ---- Tuning numbers (tune here) ----
const TAP_TEXT_Y = 0.94;       // how far down the screen the text sits, as a fraction of its height
const TAP_TEXT_SIZE = 16;      // "tap to start" text size in pixels
const MOVE_SMOOTHING = 0.2;    // how closely the movement number follows each frame's change (0-1)
const STEP_LEVEL = 1.0;        // how big a bump must be to count as a step (set from Step 4 readings)
const STEP_GAP_MIN_MS = 250;   // bumps closer together than this are shaking, not walking
const STEP_GAP_MAX_MS = 900;   // bumps further apart than this break the walking pace
const STEPS_NEEDED = 3;        // bumps at a walking pace needed before walking turns true
const WALK_TIMEOUT_MS = 1200;  // time with no bump before walking turns false
const FADE_IN_S = 1;           // seconds for the glow to come back when walking starts
const FADE_OUT_S = 5;          // seconds for the glow to sink when walking stops
const GLOW_MIN = 0.06;         // how bright "almost dark" is (never 0)
const BIG_SCALE = 1.15;        // how much bigger the glow gets at full level
const GLOW_Y = 0.65;           // glow centre, as a fraction of screen height (sits below the middle)
const GLOW_SIZE = 0.75;        // outer edge of the glow, as a fraction of the smaller screen side
const CORE_SIZE = 0.48;        // bright core, as a fraction of the smaller screen side
const GLOW_LAYERS = 30;        // stacked circles making up the glow (more = smoother edge)
const GLOW_LAYER_ALPHA = 12;   // transparency of each layer at full level; the centre stacks to bright
const LANTERN_COLORS = [       // each lantern picks one at page load, kept until the page reloads
  [255, 170, 80],              // amber, the warm one in the layout
  [110, 190, 255],             // cool blue
  [185, 120, 255],             // violet
  [130, 255, 175],             // pale green
];
const OBJECT_SIZE = 0.25;      // object inside the glow, as a fraction of the smaller screen side
const LANTERN_OBJECTS = [      // the objects a lantern can show, picked at page load
  'candle',
  'bulb',
  'pumpkin',
];
// ------------------------------------

let startText;
let wakeLock = null;
let wantAwake = false;
let moveLevel = 0;
let walking = false;
let bumpCount = 0;
let lastBumpTime = null;
let wasAboveLevel = false;
let glowLevel = 1; // 1 = full brightness, GLOW_MIN = almost dark
let glowColor;     // this lantern's colour, chosen once at page load
let lanternObject; // which object this lantern shows, chosen once at page load

function setup() {
  createCanvas(windowWidth, windowHeight);
  glowColor = color(random(LANTERN_COLORS));
  lanternObject = random(LANTERN_OBJECTS);
  lockGestures();

  // On a laptop there is no motion sensor to ask about, so show nothing
  if (!window.isDesktop) {
    startText = createDiv('tap to start');
    startText.id('start');
    startText.style('position', 'fixed');
    startText.style('left', '0');
    startText.style('width', '100%');
    startText.style('text-align', 'center');
    startText.style('top', TAP_TEXT_Y * 100 + '%');
    startText.style('color', 'white');
    startText.style('font-size', TAP_TEXT_SIZE + 'px');

    // The first tap lands on this div, not the canvas, so p5's mouseReleased()
    // never sees it. Ask for the wake lock on the div's own finger-lift: iPhone
    // counts a touch as one gesture when the finger lifts, not when it presses.
    startText.elt.addEventListener('pointerup', () => {
      wantAwake = true;
      requestWakeLock();
    });

    enableGyroOn('#start');
  }

  // The browser drops the lock whenever the page is hidden and it never comes
  // back by itself, so ask again once the page is visible.
  document.addEventListener('visibilitychange', () => {
    if (wantAwake && document.visibilityState === 'visible') {
      requestWakeLock();
    }
  });

  showDesktopQr({ label: 'Scan to open on your phone' });
}

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) {
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    debugWarn('Wake lock refused: ' + err.message);
  }
}

function mouseReleased() {
  // Second path only: if the lock was lost or refused, a later tap on the
  // canvas asks again. This never adds a tap of its own.
  if (wantAwake && (!wakeLock || wakeLock.released)) {
    requestWakeLock();
  }
  return false;
}

// One bump: the smoothed movement rose past STEP_LEVEL. Bumps too close
// together are shaking; bumps too far apart are a new walk starting.
function registerBump(now) {
  if (lastBumpTime === null) {
    bumpCount = 1;
    lastBumpTime = now;
    return;
  }
  const gap = now - lastBumpTime;
  if (gap < STEP_GAP_MIN_MS) {
    return;
  }
  if (gap > STEP_GAP_MAX_MS) {
    bumpCount = 1;
  } else {
    bumpCount++;
  }
  lastBumpTime = now;
}

// The glow level moves at a steady speed over real seconds, using deltaTime,
// so the fade takes the same time at any frame rate.
// Lit and still whenever walking cannot be known: laptop, not started yet,
// or motion permission denied.
function updateGlowLevel() {
  if (!window.sensorsEnabled) {
    glowLevel = 1;
    return;
  }
  const range = 1 - GLOW_MIN;
  const perMs = range / ((walking ? FADE_IN_S : FADE_OUT_S) * 1000);
  const target = walking ? 1 : GLOW_MIN;
  const direction = Math.sign(target - glowLevel);
  glowLevel = constrain(glowLevel + direction * perMs * deltaTime, GLOW_MIN, 1);
}

// The lantern: stacked circles from the biggest and faintest to the smallest
// and brightest. Sizing from min(width, height) keeps it inside the screen
// when the phone is turned sideways. glowLevel drives both brightness and size.
function drawGlow() {
  const base = min(width, height);
  const grow = map(glowLevel, GLOW_MIN, 1, 1, BIG_SCALE);
  const outer = base * GLOW_SIZE * grow;
  const core = base * CORE_SIZE * grow;
  const layerAlpha = GLOW_LAYER_ALPHA * glowLevel;

  noStroke();
  for (let i = 0; i < GLOW_LAYERS; i++) {
    const t = GLOW_LAYERS === 1 ? 1 : i / (GLOW_LAYERS - 1); // 0 = outermost, 1 = innermost
    fill(red(glowColor), green(glowColor), blue(glowColor), layerAlpha);
    circle(width / 2, height * GLOW_Y, lerp(outer, core, t));
  }
}

// The object's main colour: the lantern's own colour whitened toward white,
// so it glows brighter than the glow around it.
function objectFill(whiten, alpha) {
  fill(
    lerp(red(glowColor), 255, whiten),
    lerp(green(glowColor), 255, whiten),
    lerp(blue(glowColor), 255, whiten),
    alpha
  );
}

// A darker shade of the lantern's colour, for stems and bases.
function objectDark(alpha) {
  fill(
    lerp(red(glowColor), 0, 0.6),
    lerp(green(glowColor), 0, 0.6),
    lerp(blue(glowColor), 0, 0.6),
    alpha
  );
}

// Candle: a teardrop drawn with splineVertex (p5.js 2's curve vertex;
// curveVertex no longer exists).
function drawCandle(k) {
  objectFill(0.5, 255 * glowLevel);
  beginShape();
  splineVertex(0, -k);              // tip
  splineVertex(0.45 * k, -0.2 * k); // right shoulder
  splineVertex(0.55 * k, 0.45 * k); // right side
  splineVertex(0, 0.9 * k);         // rounded bottom
  splineVertex(-0.55 * k, 0.45 * k); // left side
  splineVertex(-0.45 * k, -0.2 * k); // left shoulder
  splineVertex(0, -k);              // tip again, so the outline closes smoothly
  endShape();
}

// Light bulb: round glass on top, small screw base below.
function drawBulb(k) {
  objectFill(0.6, 255 * glowLevel);
  ellipse(0, -0.35 * k, 1.5 * k, 1.5 * k);

  objectDark(255 * glowLevel);
  rectMode(CENTER);
  rect(0, 0.7 * k, 0.6 * k, 0.55 * k);
}

// Jack-o'-lantern: squat body, stem, and a dark face so it reads as carved.
function drawPumpkin(k) {
  objectDark(255 * glowLevel);
  rectMode(CENTER);
  rect(0, -0.95 * k, 0.22 * k, 0.45 * k); // stem

  objectFill(0.45, 255 * glowLevel);
  ellipse(0, 0.1 * k, 2.1 * k, 1.7 * k); // body, wider than tall

  fill(0, 0, 0, 255 * glowLevel); // carved face
  triangle(-0.65 * k, 0.05 * k, -0.25 * k, 0.05 * k, -0.45 * k, -0.35 * k); // left eye
  triangle(0.25 * k, 0.05 * k, 0.65 * k, 0.05 * k, 0.45 * k, -0.35 * k);    // right eye
  triangle(-0.15 * k, 0.35 * k, 0.15 * k, 0.35 * k, 0, 0.1 * k);            // nose
  beginShape(); // grin
  splineVertex(-0.65 * k, 0.45 * k);
  splineVertex(-0.3 * k, 0.5 * k);
  splineVertex(0, 0.5 * k);
  splineVertex(0.3 * k, 0.5 * k);
  splineVertex(0.65 * k, 0.45 * k);
  splineVertex(0.45 * k, 0.75 * k);
  splineVertex(0, 0.85 * k);
  splineVertex(-0.45 * k, 0.75 * k);
  splineVertex(-0.65 * k, 0.45 * k); // start point again, so it closes smoothly
  endShape();
}

// The object inside the core, chosen at page load. It sits at the glow's
// centre and fades with the glow.
function drawObject() {
  const k = (OBJECT_SIZE * min(width, height)) / 2;

  push();
  translate(width / 2, height * GLOW_Y);
  noStroke();
  if (lanternObject === 'bulb') {
    drawBulb(k);
  } else if (lanternObject === 'pumpkin') {
    drawPumpkin(k);
  } else {
    drawCandle(k);
  }
  pop();
}

function draw() {
  background(0);
  updateGlowLevel();
  drawGlow();
  drawObject();

  // The debug console appears once, when the start tap has been accepted
  if (startText && window.sensorsEnabled) {
    startText.hide();
    startText = null;
    showDebug();
  }

  // Read the motion only while the sensors are on
  if (window.sensorsEnabled) {
    const raw = mag(
      accelerationX - pAccelerationX,
      accelerationY - pAccelerationY,
      accelerationZ - pAccelerationZ
    );
    moveLevel = lerp(moveLevel, raw, MOVE_SMOOTHING);

    // Rising past STEP_LEVEL counts one step-like bump
    const above = moveLevel > STEP_LEVEL;
    if (above && !wasAboveLevel) {
      registerBump(millis());
    }
    wasAboveLevel = above;

    if (bumpCount >= STEPS_NEEDED) {
      walking = true;
    }
    if (walking && lastBumpTime !== null && millis() - lastBumpTime > WALK_TIMEOUT_MS) {
      walking = false;
      bumpCount = 0;
    }

    debug('move ' + moveLevel.toFixed(2) + ' | ' + (walking ? 'WALKING' : 'still') + ' | bumps ' + bumpCount);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
