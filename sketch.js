function setup() {
  createCanvas(windowWidth, windowHeight);
  lockGestures();
  showDesktopQr({ label: 'Scan to open on your phone' });
}

function draw() {
  background(0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
