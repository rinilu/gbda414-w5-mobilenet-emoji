// STEP 3: LOAD THE JSON TRANSLATION DATA
// webcam -> MobileNet -> label        (running)
// JSON file -> translation records    (loaded, but not connected yet)

let video;
let classifier;
let mappings = []; // records loaded from the JSON file
let currentLabel = "Waiting for classification...";
let currentConfidence = 0;
let jsonLoaded = false; // did the JSON load successfully?
let jsonError = false; // did the JSON fail to load?

function preload() {
  // p5 waits for loadJSON() to finish before running setup()
  mappings = loadJSON("finalImageNetLabelsAndEmojis.json", jsonLoadedSuccessfully, jsonFailedToLoad);
}

function jsonLoadedSuccessfully(data) {
  console.log("JSON loaded successfully.");
  console.log("Number of records:", data.length);
  mappings = data;
  jsonLoaded = true;
}

function jsonFailedToLoad(error) {
  // usually means a wrong filename/path or invalid JSON
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

function gotResults(results) {
  if (!results || results.length === 0) return;
  currentLabel = results[0].label;
  currentConfidence = results[0].confidence;
}

function draw() {
  image(video, 0, 0, width, height);

  fill(0, 190);
  noStroke();
  rect(20, 20, 780, 200, 12);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  text("Model label: " + currentLabel, 40, 42);
  text("Confidence: " + nf(currentConfidence * 100, 2, 1) + "%", 40, 78);

  if (jsonError) {
    fill(255, 100, 100);
    text("JSON: could not be loaded.", 40, 118);
  } else if (!jsonLoaded) {
    fill(255, 220, 120);
    text("JSON: still loading...", 40, 118);
  } else {
    fill(180, 255, 180);
    text("JSON records loaded: " + mappings.length, 40, 118);
  }
}
