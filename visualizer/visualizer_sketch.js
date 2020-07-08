let vid; //video object
let vid_loaded = false;

let f_id = 'as-Alarm'; //feature id

let features = [];
let feature_color = [];
feature_n = 1;

let instructions; //html text instrucitons

let feat_sel1; //selector for feature
let feat_sel2; //selector for feature
let feat_sel3; //selector for feature

let button_play;
let button_load;
//let f_tab; //table of feature values
let canvas2; //graphics renderer for coarse graph, background
let canvas3; //graphics renderer for labels, overlay, foreground

//dimensions
let column1_w = 640;
let canvas_w = 900;
let canvas_h = 600;
let vid_w = 640;
let vid_h = 360;
let slider_h = 75;

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
let duration_s = 1513; //stimulus duration in seconds - updated in setup()
let time = 0; //movie time
let time_m; //time ms for printing time
let time_s; //time s for printing time

// list all of the csv files... do this with the api? node.js? a file with all of the names? 
let feat_names = ['as-Alarm',
'as-Animal',
'as-Domestic animals pets',
'as-Engine',
'as-Explosion',
'as-Fire',
'as-Glass',
'as-Hands',
'as-Heart sounds heartbeat',
'as-Liquid',
'as-Livestock farm animals working animals',
'as-Mechanisms',
'as-Music',
'as-Musical instrument',
'as-Noise',
'as-Silence',
'as-Thunderstorm',
'as-Tools',
'as-Vehicle',
'as-Water',
'as-Whistling',
'as-Wild animals',
'as-Wind',
'as-Wood'];

function preload() {
  //my table is comma separated value "csv"
  //and has a header specifying the columns labels
  //f_tab = loadTable('assets/'+f_id+'.csv', 'csv');
  //vid = createVideo(['./assets/stimuli_Merlin.mp4']);
  // OR
  // load from openneuro - but breaks slider??
  //vid = createVideo(['https://openneuro.org/crn/datasets/ds001110/snapshots/00003/files/stimuli:Merlin.mp4']);
  //vid = createVideo(['https://openneuro.org/crn/datasets/ds001110/snapshots/00002/files/stimuli:Sherlock.m4v']);
  //test video
  //vid = createVideo(['http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']);  
}

function setup() {

  createCanvas(canvas_w, canvas_h); // create main canvas
  canvas2 = createGraphics(canvas_w, canvas_h); //create renderer for coarse graph, background
  canvas3 = createGraphics(canvas_w, canvas_h); //create renderer for labels, overlay, foreground
  canvas3.clear();

  
  // video load button
  button_load = createFileInput(handleVideo);
  button_load.position(canvas_w, 0);
  // video play button
  button_play = createButton('play');
  button_play.position(canvas_w,130);
  button_play.mousePressed(toggleVid); // attach button listener
  
  instructions = createP('First, load a local video stimulus file. Next, play and select features you would like to view from the pull-down list. Navigate by clicking within the "Coarse Timeline" on the left');
  instructions.position(canvas_w, 12);
  
  // sel1 = new FeatureSelector(f_id1);

  sel = createSelect();
  sel.position(canvas_w, 110);
  for (let i = 0; i < feat_names.length; i++) {
    sel.option(feat_names[i]);
  }
  sel.selected(f_id);
  sel.changed(featSelect);

  // Set Up feature(s)
  features[feature_n-1] = new Feature(f_id, feature_n);
  //feat1 = new Feature(f_id1); //load music feature by default
  features[feature_n-1].loadFeatTable()

  //draw column1/2 line to background renderer
  drawColumnLines();
  drawPanelLabels();
  drawAxisX();
//  feat1.loadFeatInfo();
  //setup feature plot based on min,max
//  feat1.drawFeatureDetailed();
//  feat1.drawMetaData();

}
function draw() {
  background(0);
  if (completion == 1) {
    toggleVid();
  }
  if (vid_loaded) {
    image(canvas2,0,0); // display renderer object with static graph
    completion = vid.time() / vid.duration();
    noStroke();
    fill(255,0,0); // slider bar
    rect(completion*column1_w, vid_h, 1, slider_h); 
    image(vid,0,0,vid_w, vid_h); //display video
    for (let i = 0; i < feature_n; i++) {
      features[i].drawFeatureSliding();
      features[i].drawInstantaneous();  
    }
    drawCurrentTime();
    image(canvas3,0,0); //display overlay canvas
  }
}

function featSelect() {
  print(sel.value());
  f_id = sel.value();
  // canvas3.clear();
  // canvas2.clear();
  // background(200);
  // canvas3.text('f_id = ' + f_id + '!', 100, 100);
  // feat1 = new Feature(f_id); //load music feature by default
  // feat1.loadFeatTable()

  feature_n = feature_n + 1;
  features[feature_n-1] = new Feature(f_id, feature_n);
  //feat1 = new Feature(f_id1); //load music feature by default
  features[feature_n-1].loadFeatTable()
}

// class FeatureSelector {
//   constructor(f_id1) {
//     this.f_id = f_id1;
//     this.sel = createSelect();
//     this.sel.position(canvas_w, 50);
//     for (let i = 0; i < feat_names.length; i++) {
//       this.sel.option(feat_names[i]);
//     }
//     this.sel.selected('as-Music');
//     this.sel.changed(this.featSelect);

//   }

//   featSelect() {
//     print(this.sel.value());
//     f_id1 = this.sel.value();
//     canvas3.clear();
//     canvas2.clear();
//     // background(200);
//     canvas3.text('f_id = ' + f_id1 + '!', 100, 100);
//     // feat1 = new Feature(f_id); //load music feature by default
//     // feat1.loadFeatTable()
//   }
// }

function drawColumnLines() {
  canvas2.stroke(75);
  canvas2.strokeWeight(3);
  canvas2.line(column1_w+3,0,column1_w+1,canvas_h);
  canvas2.stroke(100);
  canvas2.strokeWeight(1);
  canvas2.line(column1_w+3,0,column1_w+1,canvas_h);
}

function drawPanelLabels() {
  canvas3.fill(200);
  canvas3.textSize(15);
  canvas3.text("Coarse Timeline",2,vid_h-2);
  canvas3.text("Fine Timeline",2,vid_h+slider_h+135);
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
  textSize(30);
  let time = duration_s*completion;
  let time_m = ~~(time / 60);
  let time_s = (time % 60);
  text(String(nf(time_m, 2,0)) + ':' + String(nf(time_s, 2,2))  , 3, 40); 
}

function mousePressed() {
  if (mouseX < vid_w && mouseY > vid_h && mouseY < vid_h+slider_h){
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
    vid.play();
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



// this freezes things near the end - fix 
// cant get string of undefined




//draw axis labels to canvas2
function drawAxisX(){
  canvas2.stroke(250);
  canvas2.strokeWeight(0.7);
  canvas2.line(0, vid_h+slider_h, column1_w, vid_h+slider_h); //x bar
  for (let i=0; i < 11; i++) { 
    let xPos = (0 + (i*column1_w/10));
//x ticks    
    canvas2.stroke(250);
    canvas2.strokeWeight(0.7);
    canvas2.line(xPos, vid_h+slider_h, xPos, vid_h+slider_h+5);
//x tick labels
    canvas2.textSize(10);
    canvas2.stroke(250);
    canvas2.strokeWeight(0);
    canvas2.fill(255);
    canvas2.textAlign(CENTER, CENTER);

    canvas2.translate(xPos,vid_h+slider_h+10)
    canvas2.rotate(PI/6);

    cur_time = i*duration_s/10

    canvas2.text(secondsToMinSec(cur_time),2,0);
    //canvas2.text(String(nf(i,2,0))+':'+String(nf(i,2,0)),2,0);

    canvas2.rotate(-PI/6);
    canvas2.translate(-xPos,-vid_h-slider_h-10)
  }
}

function handleVideo(file) {
  if (file.type === 'video') {
    vid_loaded = true;
    print(file);
    vid = createVideo(file.data);
    let duration_s = vid.duration();
    
    vid.position(0,0);
    vid.hide();
  }
}


class Feature {
  constructor(f_id,feature_n) {
  this.f_id = f_id;
  this.feature_n = feature_n;
  this.c = color(random(205)+50, random(205)+50, random(205)+50, 150);
  print(this.f_id);
  print(this.c);
  }


  // set c(c) {
  //   this._c = c;
  // }

  // get c(){
  //   return this._c
  // }


  loadFeatTable(){
    this.f_tab = loadTable('./assets/' + String(this.f_id) + '.csv', 'csv', this.loadInfoFromTable);
  }


  testCallback(response){
    // print('loaded?');
    // print(response.getColumn(0));
  } 


  loadInfoFromTable = (loadedtable) => {
    let f_tab = loadedtable;
    print('loaded?');
    //print(loadedtable.getColumn(0));
    //getMinMaxTime
    //this.feature_vals_time = loadedtable.getColumn(0);
    //print(this.feature_vals_time[1]);
    //print(min(loadedtable.getColumn(0)));
    // let min_feat_time = min(loadedtable.getColumn(0));
    // let max_feat_time = max(loadedtable.getColumn(0));
    //print(loadedtable.getColumn(1));
    // getMinMax
    let feature_vals = loadedtable.getColumn(1);
    let min_feat = min(feature_vals);
    let max_feat = max(feature_vals);



    //drawFeatureDetailed(){
    canvas2.fill(this.c);
    canvas2.stroke(this.c);
    canvas2.strokeWeight(1);
    for (let r = 1; r < f_tab.getRowCount(); r++) {
      // print(f_tab.getRowCount());
      //let px = map(f_tab.getString(r-1, 0), 0, 1539, 0, column1_w); //map x time from s to px x
      let px = map(r-1, 0, f_tab.getRowCount(), 0, column1_w); //map x time from s to px x

      let py = vid_h+slider_h - map(f_tab.getString(r-1, 1), min_feat, max_feat, 0, 74); //map y feature val from min max to px y
      //let x = map(f_tab.getString(r, 0), 0, 1539, 0, column1_w);
      let x = map(r, 0, f_tab.getRowCount(), 0, column1_w);
      let y = vid_h+slider_h - map(f_tab.getString(r, 1), min_feat, max_feat, 0, 74);
      canvas2.line(px, py, x, y);
    }
    //}


    //drawMetaData() {
    let meta_h = 12+ 57 *(this.feature_n-1);
    print(this.feature_n);
    print(meta_h);
    canvas3.stroke(this.c);
    canvas3.textSize(15);
    canvas3.fill(this.c);
    canvas3.text("feature: "+String(this.f_id),vid_w+6,meta_h);
    canvas3.textSize(12);
    canvas3.stroke(150);
    canvas3.fill(150);
    canvas3.text("feature min: "+String(nf(min_feat,1,2)),vid_w+6,meta_h+13);
    canvas3.text("feature max: "+String(nf(max_feat,1,2)),vid_w+6,meta_h+26);
    canvas3.text("stim duration (mm:ss): "+secondsToMinSec(duration_s),vid_w+6,meta_h+39);





    canvas3.textSize(10);
    canvas3.stroke(0);
    canvas3.fill(200);
    canvas3.translate(feature_n*30,vid_h-30)
    canvas3.rotate(-PI/2);

    canvas3.text(String(this.f_id),10,12);
    //canvas2.text(String(nf(i,2,0))+':'+String(nf(i,2,0)),2,0);

    canvas3.rotate(PI/2);
    canvas3.translate(-feature_n*30,-vid_h+30)




    //}
  }

  drawFeatureSliding = () => {
    stroke(100);
    if (isNaN(completion)) {
      completion = 0;
    }
    let current_rowindex = round(map(completion, 0, 1, 0, float(this.f_tab.getRowCount()))) - 50;
    
  // try to get the feature alignment right based on true movie time +/- offset
    //current_rowindex = time 

    // var closest = f_tab.getColumn(0).reduce(function(prev, curr) {
    //   return (Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev);
    // });
    // print(closest);

    //Add Current Time
    stroke(50);
    strokeWeight(2);
    fill(75);
    textSize(25);
    let time = duration_s*completion;
    let time_m = ~~(time / 60);
    let time_s = (time % 60);
    text(String(nf(time_m, 2,0)) + ':' + String(nf(time_s, 2,2))  , vid_w/2-49, vid_h+slider_h+150); 
    stroke(this.c);

    
    if (current_rowindex > 50 && current_rowindex + 100 < this.f_tab.getRowCount()) {
      for (let i = 0; i < 100; i++) {
        let px = map(completion+i, 0, 100, 0, column1_w);
        let py = vid_h+slider_h+120 - map(this.f_tab.getString(current_rowindex+i, 1), 0, 1, 0, 100);
        let x = map(completion+i+1, 0, 100, 0, column1_w);
        let y = vid_h+slider_h+120 - map(this.f_tab.getString(current_rowindex+i+1, 1), 0, 1, 0, 100);
        line(px, py, x, y);
      }
    } 
  }

  //make a bar of the instantaneous feature level
  drawInstantaneous = () => {
    noStroke();
    fill(255,0,0);
    strokeWeight(1);
    rect(column1_w/2, vid_h+slider_h+20, 1, 100); //marker for sliding plot current time
    if (isNaN(completion)) {
      completion = 0;
    }
    let current_rowindex = round(map(completion, 0, 1, 0, float(this.f_tab.getRowCount())));
    //turn this into a bar plot of sorts
    if (current_rowindex<this.f_tab.getRowCount()){
      let current_val = this.f_tab.getString(current_rowindex, 1);
      current_val = map(current_val,0,1,0,100)
      stroke(this.c);
      fill(this.c);
      rect(this.feature_n*30, vid_h-30, 20, -current_val);
    }
  }
}

function secondsToMinSec(secondsin) {
  var minutes = Math.floor(secondsin / 60);
  var seconds = ((secondsin % 60)).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}