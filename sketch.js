// ---- Tuning numbers (tune here) ----
const TAP_TEXT_Y = 0.94;   // how far down the screen the text sits, as a fraction of its height
const TAP_TEXT_SIZE = 16;  // "tap to start" text size in pixels
// ------------------------------------

let startText;

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
    enableGyroOn('#start');
  }

  showDesktopQr({ label: 'Scan to open on your phone' });
}

function draw() {
  background(0);

  // Once motion permission is granted, the text goes for good
  if (startText && window.sensorsEnabled) {
    startText.hide();
    startText = null;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
