# Plan: Night Walk

<!-- Everything above Steps is yours. Write it yourself, in your own words.
     The agent writes the Steps. You cut them down before anything is built. -->

## Project
The phone is a lantern for people walking together in the dark. It glows while you walk and fades when you stop.

## The question
I want to test the bounds of creating an immersive experience physically with technology, as I'm pretty inspired by mixing physical components with games or technology, as I feel like that can make things even more immersive, which is the main component I'm trying to have for this project. And I want the users to have those emotions of happy, excited, scared, confused, nervous, and overall immersed and engaged. And that's really what would make me feel like I succeeded.

I think the lantern can cause fear or confusion when it's dim because there will be less light, and darkness overall does have the concept that brings those emotions. I think relief, excited, or happiness can be found with the lantern tracking or shedding light upon a clue or emitting light overall.

## The experience
I felt like it was something the person was holding out in front of them as they walked. And when it fades, people can also see it fade who are surrounding them or in their vicinity.

Everyone has a sort of lantern of their own. I'm thinking of this more in the terms of a sort of video game or physical game with multiple people. Multiple people traverse through a road or path and come across different obstacles, like jump scares, or maybe collect clues and view them once their phone light is shed upon the clue.

I imagine this whole thing to be mostly physical with the technological component of the phone, but the clue to be something physical that they find, such as a piece of paper or an object of some sort, and when the person does find it, I assume they will keep it on their person or try to analyze it to figure out how it connects to the kind of game they are playing. And I am thinking in the end there will be something collective involving the clues.

Maybe part of the challenge for the game could be that when they are still and maybe reaching out to a clue, they need to do it in some way where they track it in their mind as before they go still and reach out for it. Or if they stop to examine the clue, then maybe another person by them walks around them to help emit light, or maybe they themselves walk a little bit. Though I don't know if this really is the best idea.

## Input, transformation, output, fallback
- The input is walking with the phone held out in front of each person where only walking counts.
- The transformation is the moving where it is bright until it fades to almost dark, in 5 seconds you move again, light back in about 1 second.
- The output is the lanterns are different colors, to add a bit more uniqueness overall. For the encasing, I could have it more metaphorical by the sketch depicting their chosen or randomly selected object.
- The fallback is relying upon the physical aspect of things or use phone lights.

## Limits
- The lack of link between physical aspects and technological

## How I will check it
- On my laptop there will be a qr code for users to begin
- On my phone I would test it by walking with it held out in front of me, seeing how the glow is effected as I stop and start walking. The light's dim should feel scary or confusing, and brightness should feel like relief.

## Steps
<!-- Written by the agent. Each step small enough to check on your phone. -->

### Notes for the agent (read first)
- Build with p5.js 2 and p5-phone 1.15.3, the version `index.html` loads. Follow the p5js-2x and p5-phone skills. No `preload()`. Use `mousePressed` / `mouseReleased`, not `touchStarted`, and `return false` from them so p5-phone keeps managing the touch. Read motion from p5's own `accelerationX/Y/Z` and `pAccelerationX/Y/Z`.
- Do not use `rotationRateAlpha/Beta/Gamma`. The p5js-2x skill lists them, but the p5-phone skill says p5.js has no such globals and reading them throws an error every frame. Follow p5-phone.
- For the drawn objects: p5.js 2 renamed the curves. `curveVertex` is now `splineVertex` and `curve()` is now `spline()`. Never call `curveVertex`.
- Change only `sketch.js`. Assume `index.html` already loads p5 2.x, p5-phone and the viewport tag. If it does not, stop and tell me instead of editing it.
- Build one step, then stop and wait for me to check it on my phone.
- Put every tuning number in one labelled block at the top of `sketch.js`, in capitals, with a short comment saying what it does. Starting values below are guesses for me to tune.

### Step 1: Dark full-screen canvas
- **Build:** A full-screen black canvas that resizes with the window, with no visible edges. Lock the phone's gestures. On a laptop only, show a QR code so I can open the page on my phone.
- **Use:** `createCanvas(windowWidth, windowHeight)`, `resizeCanvas()` in `windowResized()`, `background(0)`, `lockGestures()`, `showDesktopQr({ label: 'Scan to open on your phone' })` (it does nothing on phones).
- **Laptop:** A black window with a QR code in a corner.
- **Phone:** Completely black, no borders. Pulling down does not refresh the page, and pinching does not zoom.
- **New numbers:** none.

### Step 2: Tap to start and motion permission
- **Build:** A small "tap to start" near the bottom, centred, shown only before start. Tapping it asks for motion permission. Once permission is given, the text disappears for good and the screen stays black. Never ask for permission without a tap. On a laptop, do not show the text.
- **Use:** `createDiv('tap to start')` with an id, positioned and styled small; `enableGyroOn('#start')` (the p5-phone skill says to write `enableGyro*`, not its `enableSensor*` alias); hide the element with `select('#start').hide()` once `window.sensorsEnabled` is true; `window.isDesktop` to skip it on laptops.
- **Laptop:** Same as Step 1, with no "tap to start".
- **Phone:** The small text sits near the bottom. Tapping it brings up the motion permission prompt on iPhone (Android just starts). After I allow it, the text is gone. If I deny it, the screen stays black and nothing breaks.
- **New numbers:** `TAP_TEXT_Y = 0.94` (how far down the screen, as a fraction of its height), `TAP_TEXT_SIZE = 16` (pixels).

### Step 3: Keep the screen on
- **Build:** When I tap to start, ask the browser to keep the screen on. Ask again whenever the page comes back into view. If the browser refuses, log a warning and carry on.
- **Use:** `navigator.wakeLock.request('screen')` inside `try`/`catch`. The first tap lands on the `#start` div from Step 2, not on the canvas, so p5's `mouseReleased()` never sees it: bind the request to that element's own finger-lift with `select('#start').elt.addEventListener('pointerup', …)`, which counts as a finished gesture on iPhone. Ask on finger-lift, not on press, and never from `userSetupComplete()`. Keep p5's `mouseReleased()` as a second path that re-requests if the lock is missing. Check `'wakeLock' in navigator` first. Add a `visibilitychange` listener that asks again when the page is visible. Log problems with `debugWarn()`.
- **Laptop:** Nothing visible.
- **Phone:** After the start tap, leave the phone untouched for a full minute. The screen stays on and does not dim or lock. Switch to another app and back, and it stays on again. This only works on a page served over HTTPS, and it fails in the p5 web editor preview.
- **New numbers:** none.
- **If it fails:** If the first tap on iPhone does not get the lock (the permission prompt can use up the tap), stop and tell me. Do not add a second tap on your own.

### Step 4: Read the movement and show it
- **Build:** After start, each frame work out how much the phone's acceleration changed since the last frame, smooth it, and show the number in the on-screen debug console.
- **Use:** Gate on `window.sensorsEnabled`. Take the size of the change in `accelerationX/Y/Z` against `pAccelerationX/Y/Z`. Smooth with `lerp()`. `showDebug()` and `debug()` for the readout.
- **Laptop:** No number, and nothing breaks.
- **Phone:** The number stays small when I stand still, and rises and falls in a steady rhythm when I walk with the phone held out in front. Write down roughly what it reads standing, walking, and waving the phone in place. I use these to set the numbers in Step 5.
- **New numbers:** `MOVE_SMOOTHING = 0.2`.

### Step 5: Decide "walking"
- **Build:** A true/false walking value. Each time the smoothed movement rises past a level, count one step-like bump. Walking becomes true after a few bumps at a walking pace, and false again when no bump has come for a while. Show the walking value in the debug console.
- **Use:** `millis()` for timing, the smoothed movement from Step 4, `debug()`.
- **Laptop:** Nothing to see.
- **Phone:** Walking turns true within about 2 seconds of starting to walk, and false about a second after I stop. Waving or shaking the phone in place should not turn it true. If it does, tell me, and I will adjust the numbers.
- **New numbers (guesses):** `STEP_LEVEL = 1.0` (how big a bump must be; set it from what I wrote down in Step 4), `STEP_GAP_MIN_MS = 250` and `STEP_GAP_MAX_MS = 900` (how far apart bumps can be and still count as a walking pace), `STEPS_NEEDED = 3` (bumps needed to start walking), `WALK_TIMEOUT_MS = 1200` (time with no bump before walking turns false).

### Step 6: Draw the glow, standing still
- **Build:** Draw the glow as in the layout: centred across the screen, sitting low, below the middle, with a bright core and a warm, soft edge that fades out. Nothing else on screen. No movement yet.
- **Use:** Layered circles with `noStroke()`, from the biggest and faintest to the smallest and brightest, using `color()` with alpha. Size everything from `min(width, height)`, not `width`, so turning the phone sideways never makes the glow bigger than the screen. Step 11 checks this.
- **Laptop and phone:** Black, with one warm amber glow low on the screen. The edge is soft, not a hard disk. After the start tap, nothing else is visible.
- **New numbers:** `GLOW_Y = 0.65` (centre, as a fraction of screen height), `GLOW_SIZE = 0.75` (outer edge) and `CORE_SIZE = 0.48` (bright core), both as fractions of the smaller screen side, `GLOW_LAYERS = 30` (more is smoother), `GLOW_COLOR` (warm amber).

### Step 7: Walking drives the glow
- **Build:** One glow level from 0 to 1. Walking pulls it up to 1 in about 1 second. Not walking pulls it down toward almost dark in about 5 seconds. At 1 the glow is bright and a little bigger. At the bottom it is almost dark, but never fully black. Make the fade work the same at any frame rate. Two cases keep the glow lit at full level with no fading, like the laptop: the page has not been started yet, or motion permission was denied or unavailable. Otherwise the lit glow from the layout would dim to black under the "tap to start" text, and a denial would leave the screen dead with no feedback.
- **Use:** `deltaTime`, `lerp()`, `map()`, `constrain()`.
- **Laptop:** The glow just stays lit at full level, with no walking.
- **Phone:** This is the main check. Before I tap start, the glow is already lit and stays lit. If I deny permission, it stays lit and nothing breaks. Walk: the glow is bright and a little bigger. Stop: it fades over about 5 seconds to almost dark, and is still faintly there. Walk again: it is back in about 1 second. Does dim feel nervous, and does bright feel like relief?
- **New numbers:** `FADE_IN_S = 1`, `FADE_OUT_S = 5`, `GLOW_MIN = 0.06` (how dark "almost dark" is), `BIG_SCALE = 1.15` (how much bigger it gets).

### Step 8: Each lantern its own colour
- **Build:** When the page loads, pick one colour at random from a short list and keep it until the page reloads. The glow and its brighter core use that colour.
- **Use:** `random()` and `color()`.
- **Laptop and phone:** Reload several times and the colour changes. It stays the same during one walk.
- **New numbers:** `LANTERN_COLORS`, a list that starts with amber (the warm one in the layout) and three more colours that show clearly on a dark screen.

### Step 9: An object inside the glow (candle)
- **Build:** Draw a simple object inside the bright core, in the same place and at the same size the core sits in the layout. Start with a candle flame only, drawn with p5 shapes. It dims and brightens with the glow.
- **Use:** `beginShape()` / `endShape()` with `splineVertex()` for any curved outline (never `curveVertex`), `ellipse()`, `lerp()`.
- **Laptop and phone:** A small flame sits in the core. When the glow fades, the flame fades with it.
- **New numbers:** `OBJECT_SIZE = 0.25` (fraction of the smaller screen side, so the object stays inside the core when the phone is sideways).

### Step 10: More objects
- **Build:** Add a light bulb and a jack-o'-lantern, one at a time, each drawn with p5 shapes. At page load, pick one of the objects at random.
- **Use:** The same drawing tools as Step 9.
- **Laptop and phone:** Reload several times and I see different objects. Each one fades with the glow.
- **New numbers:** `LANTERN_OBJECTS`, a list of the objects.

### Step 11: Clean up and a real test
- **Build:** Remove the debug console and the walking readout. Keep the QR code on laptops. Make sure turning the phone sideways does not break the layout. Check that every tuning number is in the block at the top.
- **Laptop:** A black window with a QR code and the glow lit.
- **Phone:** Walk in the dark with a friend, each holding your own phone out in front. Stop and watch the other person's glow fade. Hold a printed piece of paper in front of the glow and see whether you can read it.
- **New numbers:** none.

## Assumptions the agent had to make
- `index.html` already loads p5 2.x, p5-phone and the viewport tag, because you said only `sketch.js` changes.
- The page is served over HTTPS on your phone. Sensors and keeping the screen on both need it, and neither works in the p5 web editor preview.
- You had not chosen what the laptop should do, so I assumed: a black screen with a QR code, the glow lit and still, no "tap to start", and no stand-in for walking. The Fallback line above is still in brackets for you to fill in.
- "Fades to almost dark (5 s)" is read as the fade taking 5 seconds once you stop. It could also mean 5 seconds of stillness before the fade starts.
- The size and position of the glow (about 65% down the screen, outer edge about three quarters of the width, core just under half the width) are measured from your layout sketch. The short lines around the circle in the layout are read as light radiating, not as separate shapes, so they are not built.
- "A little bigger", "almost dark", and every walking-detection number are guesses for you to tune on your phone.
- Colour is picked at random at page load, and so is the object. Choosing your own is not built.
- Colours and objects are in this prototype because you said the lanterns would be different colours and show a chosen or random object. I put the objects last because they were the least settled. Cut Steps 9 and 10 if it is too much.
- The first tap on an iPhone does two things: the motion permission and the screen-on request. The browser may refuse the second one. The agent is told to stop and tell you, not to add a second tap.
- The sketch cannot change the phone's brightness. How far the glow can be seen depends on how bright you set the screen.
- Not built, because you described them as physical: obstacles, jump scares, finding clues, and anything that links one phone to another. The torch, vibration, camera, GPS and sound are not used.
- "Not now" in Limits is left for you to fill in.

## Changes
<!-- Yours. One line each time you change this plan, and why. -->
