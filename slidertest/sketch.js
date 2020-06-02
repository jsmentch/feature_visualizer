var vid;
var playing = false;
var completion = 0;
let button;
let f_tab;

let canvas_w = 320;
let canvas_h = 300;
vid_w = 320;
vid_h = 180;


let coarseness = 50; //rename window?
let coarse_ymax = 0.1;
let coarse_ymin = 0;

let new_feature = 1;

let randomY = [];
let numPts = 25;

function preload() {
  //my table is comma separated value "csv"
  //and has a header specifying the columns labels
  f_tab = loadTable('assets/as-Alarm.csv', 'csv');
}

function setup() {
  createCanvas(canvas_w, canvas_h);
  vid = createVideo(['./assets/stimuli_Merlin.mp4']);
  vid.size(vid_w, vid_h);
  vid.position(0,0);
  button = createButton('play');
  button.mousePressed(toggleVid); // attach button listener
  // for(let i =0; i< numPts; i++){
  //  randomY.push(random(200,300)); 
  // }
}
function draw() {
  background(0);
  //if (new_feature == 1) {
  drawFeatureCoarse();
  //drawFeatureDetailed();
  //stroke(110);
  completion = vid.time() / vid.duration();
  noStroke();
  fill(0,200,0);
  rect(completion*width, 180, 1, 50); 
  //print(completion);
  drawInstantaneous();  
  drawFeatureSliding();
  //  new_feature = 0;
  //}
}
function mousePressed() {
  if (mouseX < 320){
    if (!playing) {
      //vid.play();
      vid.time((mouseX/width) * vid.duration());
      //playing = true;
    }
    else {
      //vid.pause();
      vid.time((mouseX/width) * vid.duration());
      //playing = false;
    }
  }
}
function toggleVid() {
  if (playing) {
    vid.pause();
    button.html('play');
  } else {
    vid.loop();
    button.html('pause');
  }
  playing = !playing;
}

function getCoarseVals(r){
  //for (let r = 0; r < f_tab.getRowCount()+coarseness; r=r+coarseness) {
  let sum = 0;
  for (let i=0; i < coarseness; i++) {
    sum = sum + float(f_tab.getString(r+i, 1));
  }
  let px_avg = sum/(coarseness);
  //console.log(px_avg);
  return px_avg;
  //}
}

function drawFeatureCoarse(){
  stroke(150);
  // fill(255);
  for (let r = 1; r < f_tab.getRowCount()-coarseness-coarseness; r=r+coarseness) {
    let px = map(f_tab.getString(r-1, 0), 0, 1539, 0, 320)
    let py = 230 - map(getCoarseVals(r-1), coarse_ymin, coarse_ymax, 0, 50)
    let x = map(f_tab.getString(r+coarseness, 0), 0, 1539, 0, 320)
    let y = 230 - map(getCoarseVals(r+coarseness), coarse_ymin, coarse_ymax, 0, 50)
    // console.log(getCoarseVals(r-1))
    // console.log(getCoarseVals(r));
    line(px, py, x, y);
  }
}

function drawInstantaneous(){
  // stroke(128);
  rect(width/2, 230, 1, 70)
  if (isNaN(completion)) {
    completion = 0;
  }
  current_rowindex = round(map(completion, 0, 1, 0, float(f_tab.getRowCount())));
  current_val = f_tab.getString(current_rowindex, 1);
  current_val = map(current_val,0,1,0,100)
  stroke(255,0,0);
  fill(255,0,0)
  rect(width/2, 300, 1, -current_val);
}

function drawFeatureSliding(){
  stroke(100);
  if (isNaN(completion)) {
    completion = 0;
  }
  current_rowindex = round(map(completion, 0, 1, 0, float(f_tab.getRowCount()))) - 50;
  if (current_rowindex > 50 && current_rowindex +50 < f_tab.getRowCount()) {
    for (let i = 0; i < 100; i++) {
      let px = map(completion+i, 0, 100, 0, 320)
      let py = 300 - map(f_tab.getString(current_rowindex+i, 1), 0, 1, 0, 100)
      let x = map(completion+i+1, 0, 100, 0, 320)
      let y = 300 - map(f_tab.getString(current_rowindex+i+1, 1), 0, 1, 0, 100)
      line(px, py, x, y);
    }
  }
}
function drawFeatureDetailed(){
  stroke(100);
  for (let r = 1; r < f_tab.getRowCount(); r++) {
    let px = map(f_tab.getString(r-1, 0), 0, 1539, 0, 320)
    let py = 280 - map(f_tab.getString(r-1, 1), 0, 1, 0, 100)
    let x = map(f_tab.getString(r, 0), 0, 1539, 0, 320)
    let y = 280 - map(f_tab.getString(r, 1), 0, 1, 0, 100)
    line(px, py, x, y);
  }
}
function drawFakeFeature(){
  stroke(100);
 // draw lines
  let px = 0;
  let py = randomY[0];
  for(let i =0; i < randomY.length; i++){
    let x = i * (width / (numPts-1));
    let y = randomY[i];
    line(px, py, x, y);
    
    //store the last position
    px = x;
    py = y;
  } 
}