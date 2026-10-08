// STEP 2: MOBILENET CLASSIFICATION
// Pipeline so far: webcam -> MobileNet -> label + confidence

let video;
let classifier; // the ml5.js MobileNet classifier
let currentLabel = "Waiting for classification..."; // latest label
let currentConfidence = 0; // latest confidence, 0 to 1

function setup() {
  createCanvas(960, 720);
  video = createCapture(VIDEO, { flipped: true }); // flipped: behaves like a mirror
  video.size(width, height);
  video.hide();

  classifier = ml5.imageClassifier("MobileNet", { flipped: true });
  classifier.classifyStart(video, gotResults); // keep sending webcam frames to MobileNet
}

function gotResults(results) {
  // MobileNet calls this every time it finishes a classification.
  // results[0] is the highest-confidence prediction.
  if (!results || results.length === 0) return;
  currentLabel = results[0].label;
  currentConfidence = results[0].confidence;
}

function draw() {
  image(video, 0, 0, width, height);

  fill(0, 190);
  noStroke();
  rect(20, 20, 780, 160, 12);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  text("MobileNet label:", 40, 42);
  textSize(28);
  text(currentLabel, 40, 72, 740, 45);
  textSize(18);
  text("Confidence: " + nf(currentConfidence * 100, 2, 1) + "%", 40, 130);
}
