// STEP 1: WEBCAM INPUT
// Goal: show live webcam pixels on the p5.js canvas. No model yet.

let video; // stores the webcam video

function setup() {
  createCanvas(960, 720);
  video = createCapture(VIDEO); // request the webcam
  video.size(width, height);
  video.hide(); // hide the extra HTML video element; draw() shows it on the canvas
}

function draw() {
  image(video, 0, 0, width, height); // copy the current frame to the canvas
}
