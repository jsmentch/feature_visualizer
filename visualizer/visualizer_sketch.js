let vid; //video object
let button_play;
let button_load;
let f_tab; //table of feature values
let canvas2; //graphics renderer for coarse graph, background
let canvas3; //graphics renderer for labels, overlay, foreground

//dimensions
let column1_w = 320;
let canvas_h = 300;
let canvas_w = 450;
let vid_w = 320;
let vid_h = 180;
let slider_h = 50;

//plotting info
let coarseness = 50; //rename window?
let coarse_ymax = 0.1;
let coarse_ymin = 0;

//feature info
let min_feat;
let max_feat;
let new_feature = 1; //now unused

//time info
let playing = false;
let completion = 0;
let duration_s = 1560; //stimulus duration in seconds - updated in setup()
let time_m; //time ms
let time_s; //time s


let vid_loaded = false;


function preload() {
  //my table is comma separated value "csv"
  //and has a header specifying the columns labels
  f_tab = loadTable('assets/as-Alarm.csv', 'csv');
  //vid = createVideo(['./assets/stimuli_Merlin.mp4']);
  // OR
  // load from openneuro - but breaks slider??
  //vid = createVideo(['https://openneuro.org/crn/datasets/ds001110/snapshots/00003/files/stimuli:Merlin.mp4']);
  //vid = createVideo(['https://openneuro.org/crn/datasets/ds001110/snapshots/00002/files/stimuli:Sherlock.m4v']);
  //test video
  //vid = createVideo(['http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']);
}

function setup() {
  // //print(vid.duration());
  // let duration_s = vid.duration();
  createCanvas(canvas_w, canvas_h); // create main canvas
  canvas2 = createGraphics(canvas_w, canvas_h); //create renderer for coarse graph, background
  canvas3 = createGraphics(canvas_w, canvas_h); //create renderer for labels, overlay, foreground
  canvas3.clear();

  //setup feature plot based on min,max
  getFeatureMinMax();

  //draw column1/2 line to background renderer
  canvas2.stroke(75);
  canvas2.strokeWeight(3);
  canvas2.line(column1_w+3,0,column1_w+1,canvas_h);
  canvas2.stroke(100);
  canvas2.strokeWeight(1);
  canvas2.line(column1_w+3,0,column1_w+1,canvas_h);
  drawPanelLabels();
  drawMetaData();

  drawFeatureDetailed();//
  drawAxisX();

  button_load = createFileInput(handleVideo);
  button_load.position(canvas_w, 0);

  button_play = createButton('play');
  button_play.mousePressed(toggleVid); // attach button listener
  

}
function draw() {
  background(0);
  image(canvas2,0,0); // display renderer object with static graph
  if (vid_loaded) {
    completion = vid.time() / vid.duration();
    noStroke();
    fill(0,200,0);
    rect(completion*column1_w, 180, 1, slider_h); 
    drawFeatureSliding();
    drawInstantaneous();  
    drawCurrentTime();
    image(canvas3,0,0);
    image(vid,0,0,vid_w, vid_h);
  }
}

function getFeatureMinMax() {
  feature_vals = f_tab.getColumn(1);
  min_feat = min(feature_vals);
  max_feat = max(feature_vals);
}

function drawPanelLabels() {
  canvas3.fill(200);
  canvas3.textSize(10);
  canvas3.text("Coarse Timeline",2,188);
  canvas3.text("Fine Timeline",2,298);
  canvas3.stroke(0);
  canvas3.strokeWeight(1)
  canvas3.fill(255)
  canvas3.text("stimulus: Merlin_Movie",3,12);
}

function drawMetaData() {
  canvas3.fill(200);
  canvas3.textSize(10);
  canvas3.text("feature min: "+String(nf(min_feat,1,2)),326,8);
  canvas3.text("feature max: "+String(nf(max_feat,1,2)),326,18);
  canvas3.text("stim duration (s): "+String(duration_s),326,28);
}

function drawCurrentTime() {
//Add Current Time
  stroke(0);
  strokeWeight(2);
  fill(255);
  textSize(20);
  let time = duration_s*completion;
  let time_m = ~~(time / 60);
  let time_s = (time % 60);
  text(String(nf(time_m, 2,0)) + ':' + String(nf(time_s, 2,2))  , 3, 30); 
}

function mousePressed() {
  if (mouseX < 320 && mouseY > 180 && mouseY < 230){
    if (!playing) {
      //vid.play();
      vid.time((mouseX/column1_w) * vid.duration());
      //playing = true;
    }
    else {
      //vid.pause();
      vid.time((mouseX/column1_w) * vid.duration());
      //playing = false;
    }
  }
}

function toggleVid() {
  if (playing) {
    vid.pause();
    button_play.html('play');
    //ellipse(10,10,10,10);  //add a pause sign when paused
  } else {
    vid.loop();
    button_play.html('pause');
  }
  playing = !playing;
}

function getCoarseVals(r){
  let sum = 0;
  for (let i=0; i < coarseness; i++) {
    sum = sum + float(f_tab.getString(r+i, 1));
  }
  let px_avg = sum/(coarseness);
  return px_avg;
}

function drawInstantaneous(){
  noStroke();
  fill(0,200,0);
  strokeWeight(1);
  rect(column1_w/2, 230, 1, 70)
  if (isNaN(completion)) {
    completion = 0;
  }
  current_rowindex = round(map(completion, 0, 1, 0, float(f_tab.getRowCount())));
  current_val = f_tab.getString(current_rowindex, 1);
  current_val = map(current_val,0,1,0,100)
  stroke(255,0,0);
  fill(255,0,0)
  rect(column1_w/2, 300, 1, -current_val);
}

function drawFeatureSliding(){
  stroke(100);
  if (isNaN(completion)) {
    completion = 0;
  }
  current_rowindex = round(map(completion, 0, 1, 0, float(f_tab.getRowCount()))) - 50;
  //Add Current Time
  stroke(50);
  strokeWeight(2);
  fill(75);
  textSize(25);
  let time = duration_s*completion;
  let time_m = ~~(time / 60);
  let time_s = (time % 60);
  text(String(nf(time_m, 2,0)) + ':' + String(nf(time_s, 2,2))  , 110, 270); 
  if (current_rowindex > 50 && current_rowindex +50 < f_tab.getRowCount()) {
    for (let i = 0; i < 100; i++) {
      let px = map(completion+i, 0, 100, 0, column1_w)
      let py = 300 - map(f_tab.getString(current_rowindex+i, 1), 0, 1, 0, 100)
      let x = map(completion+i+1, 0, 100, 0, column1_w)
      let y = 300 - map(f_tab.getString(current_rowindex+i+1, 1), 0, 1, 0, 100)
      line(px, py, x, y);
    }
  } 
}

function drawFeatureDetailed(){
  canvas2.stroke(0,0,255);
  for (let r = 1; r < f_tab.getRowCount(); r++) {
    let px = map(f_tab.getString(r-1, 0), 0, 1539, 0, column1_w)
    let py = 225 - map(f_tab.getString(r-1, 1), min_feat, max_feat, 0, 45)
    let x = map(f_tab.getString(r, 0), 0, 1539, 0, column1_w)
    let y = 225 - map(f_tab.getString(r, 1), min_feat, max_feat, 0, 45)
    canvas2.line(px, py, x, y);
  }
}

//draw axis labels to canvas2
function drawAxisX(){
  canvas2.stroke(250);
  canvas2.strokeWeight(0.7);
  canvas2.line(0, 225, column1_w, 225); //x bar
  for (let i=0; i < 21; i++) { 
    let xPos = (0 + (i*column1_w/20));
//x ticks    
    canvas2.stroke(250);
    canvas2.strokeWeight(0.7);
    canvas2.line(xPos, 225, xPos, 230);
//x tick labels
    canvas2.textSize(6);
    canvas2.stroke(250);
    canvas2.strokeWeight(0);
    canvas2.fill(255);
    canvas2.textAlign(CENTER, CENTER);

    canvas2.translate(xPos,235)
    canvas2.rotate(PI/6);
    canvas2.text(String(nf(i,2,0))+':'+String(nf(i,2,0)),2,0);
    canvas2.rotate(-PI/6);
    canvas2.translate(-xPos,-235)
  }
}

function handleVideo(file) {
  vid_loaded = true;
  print(file);
  vid = createVideo(file.data);
  let duration_s = vid.duration();
  
  vid.position(0,0);
  vid.hide();
 
// if (file.type === 'image') {
  //   img = createImg(file.data, '');
  //   img.hide();
  // } else {
  //   img = null;
  // }
}

//draw feature - coarse averaged - not using anymore for now
// function drawFeatureCoarse(){
//   canvas2.stroke(0,0,255);
//   for (let r = 1; r < f_tab.getRowCount()-coarseness-coarseness; r=r+coarseness) {
//     let px = map(f_tab.getString(r-1, 0), 0, 1539, 0, column1_w)
//     let py = 225 - map(getCoarseVals(r-1), min_feat, max_feat, 0, 45)
//     let x = map(f_tab.getString(r+coarseness, 0), 0, 1539, 0, column1_w)
//     let y = 225 - map(getCoarseVals(r+coarseness), min_feat, max_feat, 0, 45)
//     canvas2.line(px, py, x, y);
//   }
// }