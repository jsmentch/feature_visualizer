var vid;
var playing = false;
var completion = 0;
let button_play;
let button_load;
let f_tab;

let canvas2;
let canvas3;

let column1_w = 320;
let canvas_h = 300;
let canvas_w = 400;

vid_w = 320;
vid_h = 180;

let slider_h = 50;

let coarseness = 50; //rename window?
let coarse_ymax = 0.1;
let coarse_ymin = 0;

let new_feature = 1;

let duration_s = 1560;
let time_m;
let time_s;

function preload() {
  //my table is comma separated value "csv"
  //and has a header specifying the columns labels
  f_tab = loadTable('assets/as-Alarm.csv', 'csv');
  //vid = createVideo(['./assets/stimuli_Merlin.mp4']);
  vid = createVideo(['./assets/stimuli_Merlin.mp4']);
  let duration_s = vid.duration();
}

function setup() {
  createCanvas(canvas_w, canvas_h); //main canvas
  canvas2 = createGraphics(canvas_w, canvas_h); //renderer for coarse graph, background
  canvas3 = createGraphics(canvas_w, canvas_h); //renderer for labels, overlay, foreground
  canvas3.clear();

  //draw column1/2 line
  canvas2.stroke(75);
  canvas2.strokeWeight(3);
  canvas2.line(column1_w+3,0,column1_w+1,canvas_h);
  canvas2.stroke(100);
  canvas2.strokeWeight(1);
  canvas2.line(column1_w+3,0,column1_w+1,canvas_h);
  drawPanelLabels(); // still behind movie - why?

  drawFeatureCoarse();
  drawAxisX();

  button_load = createFileInput(handleFile);
  button_load.position(canvas_w, 0);
  
  // vid.size(vid_w, vid_h);
  vid.position(0,0);
  vid.hide();
  button_play = createButton('play');
  button_play.mousePressed(toggleVid); // attach button listener
  

}
function draw() {
  
  background(0);

  image(canvas2,0,0); // display renderer object with static graph
  completion = vid.time() / vid.duration();
  noStroke();
  fill(0,200,0);
  rect(completion*column1_w, 180, 1, slider_h); 
  
  drawFeatureSliding();

  drawInstantaneous();  
  image(vid,0,0,vid_w, vid_h);
  drawCurrentTime();
  image(canvas3,0,0);
}

function drawPanelLabels(){
  canvas3.fill(200);
  canvas3.textSize(10);
  canvas3.text("Coarse Timeline",2,188);
  canvas3.text("Fine Timeline",2,298);
  canvas3.stroke(0);
  canvas3.strokeWeight(1)
  canvas3.fill(255)
  canvas3.text("stimulus: Merlin_Movie",3,12);

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
//space xTicks duration/20


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
  } else {
    vid.loop();
    button_play.html('pause');
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
  canvas2.stroke(0,0,255);
  // fill(255);
  for (let r = 1; r < f_tab.getRowCount()-coarseness-coarseness; r=r+coarseness) {
    let px = map(f_tab.getString(r-1, 0), 0, 1539, 0, column1_w)
    let py = 225 - map(getCoarseVals(r-1), coarse_ymin, coarse_ymax, 0, 45)
    let x = map(f_tab.getString(r+coarseness, 0), 0, 1539, 0, column1_w)
    let y = 225 - map(getCoarseVals(r+coarseness), coarse_ymin, coarse_ymax, 0, 45)
    // console.log(getCoarseVals(r-1))
    // console.log(getCoarseVals(r));
    canvas2.line(px, py, x, y);
  }
}

function drawInstantaneous(){
  // stroke(128);
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
  stroke(100);
  for (let r = 1; r < f_tab.getRowCount(); r++) {
    let px = map(f_tab.getString(r-1, 0), 0, 1539, 0, column1_w)
    let py = 280 - map(f_tab.getString(r-1, 1), 0, 1, 0, 100)
    let x = map(f_tab.getString(r, 0), 0, 1539, 0, column1_w)
    let y = 280 - map(f_tab.getString(r, 1), 0, 1, 0, 100)
    line(px, py, x, y);
  }
}
//draw axis labels to canvas2
function drawAxisX(){
  canvas2.stroke(250);
  canvas2.strokeWeight(0.7);
  canvas2.line(0, 225, column1_w, 225); //x bar
  for (let i=0; i < 11; i++) { 
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

//for input file local movie
function handleFile(file) {
  print(file);
  if (file.type === 'image') {
    img = createImg(file.data, '');
    img.hide();
  } else {
    img = null;
  }
}