let vid; //video object
let vid_loaded = false;

let f_id = 'dummy'; // start on a dummy feature for now...

let features = [];
let feature_color = [];
feature_n = 1;

let instructions; //html text instrucitons

let button_play;
let button_load;
let button_mute;

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

//let feat_val_new = 1; //value to set to a feature in edit mode;

//time info
let playing = false;
let editing = false
let muted = false;
let completion = 0;
let duration_s = 1513; //stimulus duration in seconds - updated in setup()
let time = 0; //movie time
let time_m; //time ms for printing time
let time_s; //time s for printing time

// list all of the csv files... do this with the api? node.js? a file with all of the names? 
let feat_names = ['id_1_mqc',
'id_2_mqc',
'id_3_mqc',
'id_4_mqc',
'id_5_mqc',
'id_6_mqc',
'id_7_mqc',
'id_8_mqc',
'id_9_mqc',
'id_10_mqc',
'id_11_mqc',
'id_12_mqc',
'id_13_mqc',
'id_14_mqc',
'id_15_mqc',
'id_16_mqc',
'id_17_mqc',
'id_18_mqc',
'id_19_mqc',
'id_20_mqc',
'as-Alarm',
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
'as-Wood',
'face_id_1',
'face_id_2',
'face_id_3',
'face_id_4',
'face_id_5',
'face_id_6',
'face_id_7',
'face_id_8',
'face_id_9',
'face_id_10',
'face_id_11',
'face_id_12',
'face_id_13',
'face_id_14',
'face_id_15',
'face_id_16',
'face_id_17',
'face_id_18',
'face_id_19',
'face_id_20',
'face_detectionConfidence',
'face',
'any_faces',
'speech',
'speaker_id_gaius',
'speaker_id_gregory',
'speaker_id_guinevere',
'speaker_id_helen',
'speaker_id_helen_mary',
'speaker_id_kilgharrah',
'speaker_id_knight',
'speaker_id_mary',
'speaker_id_merlin',
'speaker_id_morgana',
'speaker_id_morris',
'speaker_id_uther',
'speaker_id_arthur',
'face_id_qc_arthur',
'face_id_qc_gregory',
'face_id_qc_guinevere',
'face_id_qc_helen',
'face_id_qc_mary',
'face_id_qc_merlin',
'face_id_qc_morgana',
'face_id_qc_uther',
'face_id_qc_arthur',
'logical_and_all',
'logical_and_merlin_test'];

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

  button = createButton('normal speed');
  button.position(canvas_w, 150);
  button.mousePressed(normal_speed);

  button = createButton('2x speed');
  button.position(canvas_w, 170);
  button.mousePressed(twice_speed);

  button = createButton('half speed');
  button.position(canvas_w, 190);
  button.mousePressed(half_speed);

  button_mute = createButton('mute');
  button_mute.position(canvas_w,210);
  button_mute.mousePressed(mute_sound); // attach button listener

  instructions = createP('First, load a local video stimulus file. Next, play and select features you would like to view from the pull-down list. Navigate by clicking within the timelines on the left');
  instructions.position(canvas_w, 12);
  
  keycommands = createP('spacebar=play/pause; 1,2,3=change speed; m=mute; e=toggle editing; arrow keys=skip +/- 10s');
  keycommands.position(canvas_w, 250);

  button_edit = createButton('Editing: OFF');
  button_edit.position(canvas_w,290);
  button_edit.mousePressed(toggleEdit); // attach button listener

  edit_instructions = createP('When edit mode is ON, click within the fine timeline to set points to 1. Hold down "Shift" to set the points to 0.');
  edit_instructions.position(canvas_w, 340);

  input_export_name = createInput('edited_feature.csv');
  input_export_name.position(canvas_w, 390);

  button_export_feature = createButton('export current feature');
  button_export_feature.position(input_export_name.x + input_export_name.width, 390);
  button_export_feature.mousePressed(exportFeature);

  sel = createSelect();
  sel.position(canvas_w, 110);
  for (let i = 0; i < feat_names.length; i++) {
    sel.option(feat_names[i]);
  }
  sel.selected(f_id);
  sel.changed(featSelect);

  // Set Up feature(s)
  features[feature_n-1] = new Feature(f_id, feature_n);
  features[feature_n-1].loadFeatTable()

  //draw column1/2 line to background renderer
  drawColumnLines();
  drawPanelLabels();
  drawAxisX();

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
    fill(0,100,100); // slider bar
    rect(completion*column1_w, vid_h, 1, slider_h); 
    image(vid,0,0,vid_w, vid_h); //display video
    for (let i = 0; i < feature_n; i++) {
      features[i].drawFeatureSliding();
      features[i].drawInstantaneous();  
    }
    drawCurrentTime();
    drawGraphicOverlay();
    image(canvas3,0,0); //display overlay canvas
  }
  // edit mode stuff - break into fn?
  if (mouseIsPressed && editing && mouseX < vid_w && mouseY > vid_h+slider_h && mouseY < vid_h+slider_h+120) { //if EDITING mode is on and mouse is held down within the fine timeline
    let click_time = vid.time()+map((mouseX/column1_w),0,1,-5,5); //get time point to edit from mouse location
    if (!keyIsDown(16)) { // if SHIFT is held down, set value to 0, otherwise 1
      features[feature_n-1].editValue(click_time/duration_s, 1);// given time point and value to set
    }
    else if (keyIsDown(16)) {
      features[feature_n-1].editValue(click_time/duration_s, 0);// given time point and value to set
    }
  }
}

//Keyboard Hotkeys
function keyPressed() {
  if (keyCode === 32) { //space
    toggleVid();
  }
  if (keyCode === 69) { //e
    toggleEdit();
  }
  if (keyCode === 49) { //1
    half_speed();
  }
  if (keyCode === 50) { //2
    normal_speed();
  }
  if (keyCode === 51) { //3
    twice_speed();
  }
  if (keyCode === 77) { //m
    mute_sound();
  }
  if (keyCode === 39) { //right arrow skip forward
    if (vid.time()<duration_s-10) {
      vid.time(vid.time()+10);
    }
  }
  if (keyCode === 37) { //left arrow
    if (vid.time()>10) {
      vid.time(vid.time()-10);
    }  }
}

function exportFeature() { // export the current edited feature as a csv
  features[feature_n-1].exportFeatureTable(input_export_name.value());
}

function featSelect() { //called when you select a feature to visualize
  print(sel.value());
  f_id = sel.value();
  feature_n = feature_n + 1; //total number of features
  features[feature_n-1] = new Feature(f_id, feature_n); //instantiate new feature
  features[feature_n-1].loadFeatTable();
}

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
  canvas3.strokeWeight(1);
  canvas3.fill(255);
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
  // add seconds elapse
  textSize(10);
  text('elapsed time (s)' + ': ' + String(nf(time, 4,2))  , 3, 60); 

}
function drawGraphicOverlay() { // draw pause sign and recording sign overlays
  if (!playing){
    stroke(0);
    fill('hsba(0, 0%, 100%, 0.5)');
    rect(vid_w/2-10,vid_h/2,10,60);  //add a pause sign when paused
    rect(vid_w/2+10,vid_h/2,10,60);  //add a pause sign when paused
  }
  if (editing){
    stroke(0);
    fill(color('hsba(0, 100%, 100%, 0.5)'));
    ellipse(vid_w-50,vid_h-50,50,50);  //add a recording sign when editing
  }
}

function mousePressed() {
  //navigation in coarse window
  if (!editing) { // if edit mode is off, do allow skipping
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
    //navigation in fine window
    else if (mouseX < vid_w && mouseY > vid_h+slider_h && mouseY < vid_h+slider_h+120){
      let cur_t = vid.time();
      vid.time(cur_t+map((mouseX/column1_w),0,1,-5,5));
    }
  }
}

function toggleVid() {
  if (playing) {
    vid.pause();
    button_play.html('play');
  } else {
    vid.play();
    button_play.html('pause');
  }
  playing = !playing;
}

function toggleEdit() {
  if (!editing) {
    button_edit.html('Editing: ON'); //change text of button based on state
  } else {
    button_edit.html('Editing: OFF');
  }
  editing = !editing; // toggle edit mode
}

function mute_sound() {
  if (muted) {
    vid.volume(1);
    button_mute.html('mute');
    //ellipse(10,10,10,10);  //add a pause sign when paused
  } else {
    vid.volume(0);
    button_mute.html('unmute');
  }
  muted = !muted;
}
function normal_speed() {
  vid.speed(1);
}
function twice_speed() {
  vid.speed(2);
}
function half_speed() {
  vid.speed(0.5);
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
    canvas2.translate(xPos,vid_h+slider_h+10);
    canvas2.rotate(PI/6);
    cur_time = i*duration_s/10;
    canvas2.text(secondsToMinSec(cur_time),2,0);
    canvas2.rotate(-PI/6);
    canvas2.translate(-xPos,-vid_h-slider_h-10);
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
  colorMode(HSB, 360, 100, 100, 100);
  this.c = color(((feature_n*105)-105)%360, 100-(20*feature_n/5), 100-(20*feature_n/5), 60);
  print(this.f_id);
  print(this.c);
  }

  loadFeatTable(){
    this.f_tab = loadTable('./assets/' + String(this.f_id) + '.csv', 'csv', this.loadInfoFromTable);
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
    canvas3.rotate(PI/2);
    canvas3.translate(-feature_n*30,-vid_h+30);
  }
  //edit the feature value in the table
  editValue = (new_feat_time,new_feat_val) => {
    let edit_time = round(map(new_feat_time, 0, 1, 0, float(this.f_tab.getRowCount())));
    this.f_tab.set(edit_time,1,new_feat_val);
  } 
  //export edited table to csv
  exportFeatureTable = (input_export_name) => {
    saveTable(this.f_tab, input_export_name)
  }

  drawFeatureSliding = () => {
    stroke(100);
    if (isNaN(completion)) {
      completion = 0;
    }
    let current_rowindex = round(map(completion, 0, 1, 0, float(this.f_tab.getRowCount()))) - 50;
    
  // try to get the feature alignment right based on true movie time +/- offset
    //current_rowindex = time 
//add offset parameter?
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

  //make an overlaid bar of the instantaneous feature level
  drawInstantaneous = () => {
    noStroke();
    fill(0,100,100);
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