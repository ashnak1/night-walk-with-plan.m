// ---- Tuning numbers (tune here) ----
const TAP_TEXT_Y = 0.94;      // how far down the screen the text sits, as a fraction of its height
const TAP_TEXT_SIZE = 16;     // "tap to start" text size in pixels
const MOVE_SMOOTHING = 0.2;   // how closely the movement number follows each frame's change (0-1)
const STEP_LEVEL = 1.0;       // how big a bump must be to count as a step (set from Step 4 readings)
const STEP_GAP_MIN_MS = 250;  // bumps closer together than this are shaking, not walking
const STEP_GAP_MAX_MS = 900;  // bumps further apart than this break the walking pace
const STEPS_NEEDED = 3;       // bumps at a walking pace needed before walking turns true
const WALK_TIMEOUT_MS = 1200; // time with no bump before walking turns false
// ------------------------------------

let startText;
let wakeLock = null;
let wantAwake = false;
let moveLevel = 0;
let walking = false;
let bumpCount = 0;
let lastBumpTime = null;
let wasAboveLevel = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
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

function draw() {
  background(0);

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
