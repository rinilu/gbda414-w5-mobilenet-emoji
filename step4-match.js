// STEP 4: MATCH THE MOBILENET LABEL TO A JSON RECORD
// webcam -> MobileNet label -> JSON record -> workshop category -> emoji

let video;
let classifier;
let mappings = [];
let currentLabel = "Waiting for classification...";
let currentConfidence = 0;
let currentRecord = null; // the matching JSON record, or null if none found
let jsonLoaded = false;
let jsonError = false;

function preload() {
  mappings = loadJSON("finalImageNetLabelsAndEmojis.json", jsonLoadedSuccessfully, jsonFailedToLoad);
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
}

// Lowercase and trim so comparisons ignore formatting differences
function normalizeLabel(labelText) {
  return String(labelText).toLowerCase().trim();
}

// Labels look like "tench, Tinca tinca". Keep only the first term.
function firstTerm(labelText) {
  return normalizeLabel(labelText).split(",")[0].trim();
}

// Search the JSON records for the MobileNet label
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
  return null; // fallback: nothing matched
}

function gotResults(results) {
  if (!results || results.length === 0) return;
  currentLabel = results[0].label;
  currentConfidence = results[0].confidence;
  currentRecord = findMapping(currentLabel); // look up the translation
}

function draw() {
  image(video, 0, 0, width, height);

  fill(0, 190);
  noStroke();
  rect(20, 20, 820, 300, 12);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  text("Model label: " + currentLabel, 40, 42);
  text("Confidence: " + nf(currentConfidence * 100, 2, 1) + "%", 40, 75);

  if (jsonError) {
    fill(255, 100, 100);
    text("JSON: could not be loaded.", 40, 115);
  } else if (!jsonLoaded) {
    fill(255, 220, 120);
    text("JSON: still loading...", 40, 115);
  } else {
    fill(180, 255, 180);
    text("JSON records loaded: " + mappings.length, 40, 115);
    fill(255);

    if (currentRecord) {
      text("WordNet parent: " + currentRecord.wordnetParent, 40, 160);
      text("Workshop category: " + currentRecord.workshopCategory, 40, 195);
      text("Emoji: " + currentRecord.emoji, 40, 230);
      text("Match source: " + currentRecord.label, 40, 265);
    } else {
      fill(255, 150, 150);
      text("Unknown: no matching JSON record found.", 40, 160);
      text("Emoji: ❓", 40, 195);
    }
  }
}
