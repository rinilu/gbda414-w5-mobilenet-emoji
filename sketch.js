let video;
let classifier;
let mappings = [];
let currentLabel = "Waiting for classification...";
let currentConfidence = 0;
let currentRecord = null;
let jsonLoaded = false;
let jsonError = false;

// ---- Memory (bonus) ----
let history = []; // every remembered interpretation is stored here
let lastKey = ""; // the last thing we remembered, to avoid duplicates
let lastTime = 0; // when we last saved a memory (ms)
const COOLDOWN = 1200; // minimum ms between two memories
const LIFETIME = 25000; // ms until a memory fully fades away
const MAX_MEMORIES = 80; // cap so the screen doesn't overflow
let clearButton;

function preload() {
  mappings = loadJSON(
    "finalImageNetLabelsAndEmojis.json",
    jsonLoadedSuccessfully,
    jsonFailedToLoad,
  );
}

function jsonLoadedSuccessfully(data) {
  mappings = data;
  jsonLoaded = true;
}

function jsonFailedToLoad(error) {
  console.error("Could not load JSON dataset:", error);
  jsonError = true;
  mappings = [];
}

function setup() {
  createCanvas(960, 720);
  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  classifier = ml5.imageClassifier("MobileNet", { flipped: true });
  classifier.classifyStart(video, gotResults);

  clearButton = createButton("Clear memory (C)");
  clearButton.mousePressed(clearMemory);
}

// ---------- Matching ----------

function normalizeLabel(labelText) {
  return String(labelText).toLowerCase().trim();
}

function firstTerm(labelText) {
  return normalizeLabel(labelText).split(",")[0].trim();
}

function findMapping(modelLabel) {
  if (!jsonLoaded || !Array.isArray(mappings)) return null;
  let modelFull = normalizeLabel(modelLabel);
  let modelFirst = firstTerm(modelLabel);

  // Pass 1: exact full-label match
  for (let item of mappings) {
    if (!item || !item.label) continue;
    if (modelFull === normalizeLabel(item.label)) return item;
  }
  // Pass 2: first-term match
  for (let item of mappings) {
    if (!item || !item.label) continue;
    if (modelFirst === firstTerm(item.label)) return item;
  }
  console.log("No mapping found for:", modelLabel);
  return null;
}

// ---------- Classification callback ----------

function gotResults(results) {
  if (!results || results.length === 0) return;
  currentLabel = results[0].label;
  currentConfidence = results[0].confidence;
  currentRecord = findMapping(currentLabel);
  maybeRemember();
}

// ---------- Memory ----------

function currentEmoji() {
  return currentRecord ? currentRecord.emoji : "❓";
}

function maybeRemember() {
  // Rule: only save when the interpretation CHANGED and enough time passed.
  let key = currentEmoji() + "|" + normalizeLabel(currentLabel);
  let now = millis();
  if (key === lastKey) return;
  if (now - lastTime < COOLDOWN) return;
  if (currentConfidence < 0.05) return;

  // Each memory gets a position, age, confidence, and movement.
  let angle = random(TWO_PI);
  let speed = random(0.3, 1.2);
  history.push({
    emoji: currentEmoji(),
    confidence: currentConfidence,
    x: width * 0.72 + random(-40, 40),
    y: height * 0.5 + random(-40, 40),
    vx: cos(angle) * speed,
    vy: sin(angle) * speed,
    born: now,
    seed: random(1000),
  });
  if (history.length > MAX_MEMORIES) history.shift(); // drop the oldest
  lastKey = key;
  lastTime = now;
}

function clearMemory() {
  history = [];
  lastKey = "";
}

function keyPressed() {
  if (key === "c" || key === "C") clearMemory();
}

function drawMemories() {
  let now = millis();
  textAlign(CENTER, CENTER);
  noStroke();

  // loop backwards so we can safely remove old memories
  for (let i = history.length - 1; i >= 0; i--) {
    let m = history[i];
    let age = now - m.born;

    if (age > LIFETIME) {
      history.splice(i, 1);
      continue;
    }
    let life = 1 - age / LIFETIME; // 1 = new, 0 = gone

    // drift + gentle wobble, bounce off the edges
    m.x += m.vx + sin(now * 0.001 + m.seed) * 0.3;
    m.y += m.vy + cos(now * 0.0013 + m.seed) * 0.3;
    if (m.x < 30 || m.x > width - 30) m.vx *= -1;
    if (m.y < 30 || m.y > height - 30) m.vy *= -1;
    m.x = constrain(m.x, 20, width - 20);
    m.y = constrain(m.y, 20, height - 20);

    // size from confidence when remembered, opacity from remaining life
    textSize(map(m.confidence, 0, 1, 26, 90) * (0.6 + 0.4 * life));
    fill(255, 230 * life);
    text(m.emoji, m.x, m.y);
  }
}

// ---------- Drawing ----------

function draw() {
  image(video, 0, 0, width, height);

  // dim the camera so the emoji layer is easier to see
  fill(0, 90);
  noStroke();
  rect(0, 0, width, height);

  drawMemories();

  // --- Main emoji: size and opacity follow confidence ---
  let emojiSize = map(currentConfidence, 0, 1, 60, 400);
  let emojiAlpha = map(currentConfidence, 0, 1, 80, 255);
  textAlign(CENTER, CENTER);
  textSize(emojiSize);
  fill(255, emojiAlpha);
  text(currentEmoji(), width * 0.72, height * 0.5);

  // --- Information panel ---
  fill(0, 190);
  noStroke();
  rect(20, 20, 520, 320, 12);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  text("Model label: " + currentLabel, 40, 42, 480, 50);
  text("Confidence: " + nf(currentConfidence * 100, 2, 1) + "%", 40, 100);

  if (jsonError) {
    fill(255, 100, 100);
    text("JSON: could not be loaded.", 40, 140);
  } else if (!jsonLoaded) {
    fill(255, 220, 120);
    text("JSON: still loading...", 40, 140);
  } else if (currentRecord) {
    fill(255);
    text("WordNet parent: " + currentRecord.wordnetParent, 40, 140, 480, 50);
    text("Workshop category: " + currentRecord.workshopCategory, 40, 195);
    text("Emoji: " + currentRecord.emoji, 40, 235);
    text("Match source: " + currentRecord.label, 40, 275, 480, 40);
  } else {
    fill(255, 150, 150);
    text("Unknown: no matching JSON record found.", 40, 140);
    text("Emoji: ❓", 40, 195);
  }

  fill(170);
  textSize(14);
  text("Memories: " + history.length + "   |   press C to clear", 40, 312);
}
