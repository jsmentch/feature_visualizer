let offset = 0 //25.5; // merlin movie started at 25.5 seconds..

let vid = null; //video object
let vid_loaded = false;

let feat_selected = false;

let f_id = 'dummy'; // start on a dummy feature for now...
let f_folder = './assets/'

let features = [];
let feature_color = [];
let feature_n = 0;

let instructions; //html text instrucitons

let button_play;
let button_load;
let button_mute;

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
let vid_speed =1;
let playing = false;
let editing = false
let muted = false;
let completion = 0;
let duration_s = 1538; //stimulus duration in seconds - updated in setup()
let time = 0; //movie time
let time_m; //time ms for printing time
let time_s; //time s for printing time
let feature_sr = 10; // srampling rate of feature, default to 10hz

let stimuli_name = '';

// list all of the csv files... do this with the api? node.js? a file with all of the names? 
let feat_names = ['',
'new_feature',
'a_sub-19_task-MerlinMovie_events',
'a_sub-22_task-MerlinMovie_events']

let datasets;
let ds_ind;
let sel_ds;
let sel_task;
let ds_dict;
let task_id;
let sel_predictor;
let predictor_dict;
let predictor_id;
let runs;
let run_id;
let predictor_events;

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
  let datasets_url = 'https://neuroscout.org/api/datasets?active_only=true'
  datasets = loadJSON(datasets_url)
}
function setup() { //initial splash screen setup
  //console.log(datasets);
  let dataset_count = Object.keys(datasets).length;
  sel_ds_instructions = createP('FIRST: Select a neuroscout dataset.');
  sel_ds_instructions.position(canvas_w, 50);
  sel_ds = createSelect();
  sel_ds.position(canvas_w, 100);
  sel_ds.option('Select a Dataset');
  sel_ds.selected('Select a Dataset');
  ds_dict = new p5.TypedDict();

  for (let ds_n = 0; ds_n < dataset_count; ds_n++) {
    sel_ds.option(datasets[ds_n].name);
    ds_dict.create(datasets[ds_n].name, ds_n);
  }
  sel_ds.changed(dsSelect);

  sel_task = createSelect();
  sel_task.position(canvas_w, 125);
  sel_task.option('Select a task');
  sel_task.selected('Select a task');
  sel_predictor = createSelect();
  sel_predictor.position(canvas_w, 110);
  sel_predictor.option('Select a predictor from Neuroscout');
  sel_predictor.selected('Select a predictor from Neuroscout');
  sel_run = createSelect();
  sel_run.position(canvas_w, 175);
  sel_run.option('Select a run');
  sel_run.selected('Select a run');
  sel_task.hide();
  sel_predictor.hide();
  sel_run.hide();

  createCanvas(canvas_w, canvas_h); // create main canvas
  canvas2 = createGraphics(canvas_w, canvas_h); //create renderer for coarse graph, background
  canvas3 = createGraphics(canvas_w, canvas_h); //create renderer for labels, overlay, foreground
  canvas3.clear();
  // video load button
  button_load_instructions = createP('NEXT: Select a local video file of the stimulus');
  button_load_instructions.position(canvas_w, 350);
  button_load = createFileInput(handleVideo);
  button_load.position(canvas_w, 400);

  button_dummy_instructions = createP('OR: use a blank placeholder');
  button_dummy_instructions.position(canvas_w, 450);
  button_dummy = createButton('handleDummy');
  button_dummy.position(canvas_w, 500);
  button_dummy.mousePressed(handleDummy); // attach button listener

  offset_set_instructions = createP('enter an offset time (s) e.g. how long after the scan started did the movie start. this is bugged');
  offset_set_instructions.position(canvas_w, 550);
  offset_set = createInput('');
  offset_set.position(canvas_w, 600);
}

function setup2() { //after splash screen setup
  sel_ds.hide();
  sel_ds_instructions.hide();
  sel_task.hide();
  sel_predictor.hide();
  sel_run.hide();

  predictorlistLoad();
  addButtons()
	
  //old method of loading feature from folder - don't delete yet
  // sel = createSelect();
  // sel.position(canvas_w, );
  // for (let i = 0; i < feat_names.length; i++) {
  //   sel.option(feat_names[i]);
  // }
  // sel.selected(f_id);
  // sel.changed(featSelect);

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
    rect(completion*column1_w, vid_h, 3, slider_h); 
    image(vid,0,0,vid_w, vid_h); //display video
    if (feat_selected) {
      for (let i = 0; i < feature_n; i++) {
        features[i].drawFeatureSliding();
        features[i].drawInstantaneous();  
      }
    }
    drawCurrentTime();
    drawGraphicOverlay();
    image(canvas3,0,0); //display overlay canvas
  }
  // edit mode stuff - break into fn?
  scrub();
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

function addButtons() {
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
  
  keycommands = createP('spacebar=play/pause; 1,2,3=change speed; m=mute; e=toggle editing; R/L arrow keys=skip +/- 10s; U/D Arrow = volume');
  keycommands.position(canvas_w, 250);

  button_edit = createButton('Editing: OFF');
  button_edit.position(canvas_w,290);
  button_edit.mousePressed(toggleEdit); // attach button listener

  edit_instructions = createP('When edit mode is ON, click within the fine timeline to set points to 1. Hold down "Shift" to set the points to 0.');
  edit_instructions.position(canvas_w, 340);

  input_export_name = createInput('edited_feature.tsv');
  input_export_name.position(canvas_w, 390);

  button_export_feature = createButton('export current feature');
  button_export_feature.position(input_export_name.x + input_export_name.width, 390);
  button_export_feature.mousePressed(exportFeature);
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
    }  
  }
  if (keyCode === 38) { //up arrow vol up
    if (vid.volume()<0.91) {
      vid.volume(vid.volume()+0.1);
    }
  }
  if (keyCode === 40) { //down arrow vol down
    if (vid.volume()>0.1) {
      vid.volume(vid.volume()-0.1);
    }
  }
}

function exportFeature() { // export the current edited feature as a csv
  features[feature_n-1].exportFeatureTable(input_export_name.value());
}

function featSelect() { //called when you select a feature to visualize
  if (sel.value() !== ''){
    f_id = sel.value();
    feature_n = feature_n + 1; //total number of features
    features[feature_n-1] = new Feature(f_id, feature_n); //instantiate new feature
    features[feature_n-1].loadFeatTable();
  }
}



//API STUFF



function dsSelect() { //called when you select a neuroscout dataset
  ds_ind = ds_dict.get(sel_ds.value()); //ds index
  let task_count = datasets[ds_ind].tasks.length; // # of tasks in the dataset
  sel_task.remove(); //destroy old task select object, make a new one
  sel_task = createSelect();
  sel_task.position(canvas_w, 125);
  sel_task.option('Select a task');
  sel_task.selected('Select a task');
  task_dict = new p5.TypedDict();
  for (let task_n = 0; task_n < task_count; task_n++) { //loop through tasks, add select options
    sel_task.option(datasets[ds_ind].tasks[task_n].name);
    task_dict.create(datasets[ds_ind].tasks[task_n].name, datasets[ds_ind].tasks[task_n].id); // add task name, id to dict
  }
  sel_task.changed(taskSelect);
  sel_predictor.hide();
  sel_run.hide();
}

function taskSelect() { //called when you select a neuroscout task
  task_id = task_dict.get(sel_task.value());
  loading_text = createP('LOADING');
  loading_text.position(canvas_w-100, 50);
  let run_url = 'https://neuroscout.org/api/runs?task_id='+task_id+'&dataset_id='+datasets[ds_ind].id;
  runs = loadJSON(run_url, runLoaded);
  // let predictors_url = 'https://neuroscout.org/api/tasks/'+task_id+'/predictors?active_only=true&newest=true'
  // predictors = loadJSON(predictors_url, predictorsLoaded)
  // sel_run.hide();
}

function runLoaded() { //after selecting a task, runs are loaded
  sel_run.remove();
  sel_run = createSelect();
  sel_run.position(canvas_w, 150);
  sel_run.option('Select a run');
  sel_run.selected('Select a run');
  //console.log(runs);
  let run_count = Object.keys(runs).length; 
  run_dict = new p5.TypedDict();
  loading_text.remove();
  for (let r_n = 0; r_n < run_count; r_n++) {
    sel_run.option(runs[r_n].id);
    run_dict.create(runs[r_n].id, runs[r_n].duration);
  }
  sel_run.changed(runSelect);
  //console.log(runs);
}

function runSelect(){ //called when a run is selected
  run_id = sel_run.value();
  duration_s = run_dict.get(sel_run.value());
}

function predictorlistLoad(){
  console.log(run_id);
  let predictors_url = 'https://neuroscout.org/api/predictors?run_id='+run_id+'&active_only=true&newest=true'
  predictors = loadJSON(predictors_url, predictorlistLoaded)
  sel_run.hide();
}

function predictorlistLoaded(){ //called when you load predictors for a selected task
  sel_predictor.remove();
  sel_predictor = createSelect();
  sel_predictor.position(canvas_w, 110);
  sel_predictor.option('Select a predictor from Neuroscout');
  sel_predictor.selected('Select a predictor from Neuroscout');
  let predictor_count = Object.keys(predictors).length;
  predictor_dict = new p5.TypedDict();
  for (let p_n = 0; p_n < predictor_count; p_n++) {
    sel_predictor.option(predictors[p_n].name);
    predictor_dict.create(predictors[p_n].name, predictors[p_n].id);
  }
  sel_predictor.changed(predictorSelect);
}

function predictorSelect(){ //called when a predictor is selected
  predictor_id = predictor_dict.get(sel_predictor.value());
  loading_text = createP('LOADING');
  loading_text.position(canvas_w-100, 50);
  // let run_url = 'https://neuroscout.org/api/runs?task_id='+task_id+'&dataset_id='+datasets[ds_ind].id;
  // runs = loadJSON(run_url, runLoaded);
  let predictors_url = 'https://neuroscout.org/api/predictor-events?run_id='+run_id+'&predictor_id='+predictor_id+'&stimulus_timing=true'
  predictor_events = loadJSON(predictors_url, eventsLoaded)
  sel_run.hide();
}


function eventsLoaded(){ //called when predictor events are loaded
  //console.log(predictor_events);

  let events_count = Object.keys(predictor_events).length;
  predictor_table = new p5.Table();


  predictor_table.addColumn("onset");
  predictor_table.addColumn("duration");
  predictor_table.addColumn("value");
  for (let e = 0; e < events_count; e++) {
    let newRow = predictor_table.addRow(); // Create new row object 
    // Add data to it using setString() 
    newRow.setString("onset",predictor_events[e].onset);
    newRow.setString("duration",predictor_events[e].duration);
    newRow.setString("value",predictor_events[e].value);
  }
  f_id = sel_predictor.value();
  feature_n = feature_n + 1; //total number of features
  features[feature_n-1] = new Feature(f_id, feature_n); //instantiate new feature
  features[feature_n-1].loadInfoFromNS();
  loading_text.remove();
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
  canvas3.fill(200)
  canvas3.textSize(15);
  canvas3.text("Coarse Timeline",2,vid_h-2);
  canvas3.text("Fine Timeline",2,vid_h+slider_h+135);
  canvas3.stroke(0);
  canvas3.strokeWeight(1);
  canvas3.fill(255);
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
  // add seconds elapsed
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

function scrub() {
  //navigation in coarse window
  if (!editing) { // if edit mode is off, do allow skipping
    if (mouseIsPressed && mouseX < vid_w && mouseY > vid_h && mouseY < vid_h+slider_h){
      vid.time((mouseX/column1_w) * vid.duration());
    }
    //navigation in fine window
    else if (mouseIsPressed && mouseX < vid_w && mouseY > vid_h+slider_h && mouseY < vid_h+slider_h+120){
      let cur_t = vid.time();
      vid.time(cur_t+map((mouseX/column1_w),0,1,-1,1));
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
  vid.speed(vid_speed);
}
function twice_speed() {
  vid.speed(vid_speed*2);
}
function half_speed() {
  vid.speed(vid_speed*0.5);
}

function getCoarseVals(r){
  let sum = 0;
  for (let i=0; i < coarseness; i++) {
    sum = sum + float(f_tab.getString(r+i, 1));
  }
  let px_avg = sum/(coarseness);
  return px_avg;
}

//draw axis labels to canvas2
function drawAxisX(){
  if (duration_s > 0) {
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
}

function hideSplash() {
  button_load_instructions.hide();
  button_load.hide();
  button_dummy_instructions.hide();
  button_dummy.hide();
  offset_set.hide();
  offset_set_instructions.hide();
}

function handleDummy() {
  vid_loaded = true;
  vid = createVideo(['./assets/dummy.mp4'],dummyLoad);
  vid.position(0,0);
  vid.hide();
  canvas3.text("Stimuli: Placeholder",3,12);
  hideSplash()
  setup2();
}

function dummyLoad() {
  dummy_duration_s = vid.duration();
  vid_speed = dummy_duration_s/duration_s; // if loading dummy vid, set new base video speed
  vid.speed(vid_speed);
  drawAxisX();
}

function handleVideo(file) {
  if (file.type === 'video') {
    vid_loaded = true;
    vid = createVideo(file.data,vidLoad);
    vid.position(0,0);
    vid.hide();
    canvas3.text("Stimuli: ".concat(file.name),3,12);
    hideSplash()
    setup2();
  }
}

function vidLoad() {
  duration_s = vid.duration();
  vid_speed = 1;
  drawAxisX();
}

class Feature {
  constructor(f_id,feature_n) {
  this.f_id = f_id;
  this.feature_n = feature_n;
  colorMode(HSB, 360, 100, 100, 100);
  this.c = color(((feature_n*105)-105)%360, 100-(20*feature_n/5), 100-(20*feature_n/5), 60);
  }
  loadFeatTable(){
    this.createNewFeature(); //make a new blank table at given sr and duration
    this.load_tab = loadTable(f_folder + String(this.f_id) + '.tsv', 'tsv', 'header', this.loadInfoFromTable); //load specified feature table
    //this.loadInfoFromTable(this.load_tab);
  }
  createNewFeature() {
    let table = new p5.Table();
    table.addColumn("onset");
    table.addColumn("duration");
    table.addColumn("value");
    for (let r = 1; r < Math.floor(duration_s*feature_sr); r++) {
      // Create new row object 
      let newRow = table.addRow(); 
      // Add data to it using setString() 
      newRow.setString("onset",parseFloat(((r-1)*(1.0/feature_sr)).toFixed(1)));
      newRow.setString("duration",0.1);
      newRow.setString("value",0);
    }
    this.f_tab = table;
  }

  loadInfoFromNS(){
    this.createNewFeature(); //make a new blank table at given sr and duration
    let load_tab = predictor_table;
    for (let r = 0; r < load_tab.getRowCount()-1; r++) { //loop through rows of loaded table
      let load_tab_onset = load_tab.get(r,0)-offset;
      let load_tab_duration = load_tab.get(r,1);
      let load_tab_value = load_tab.get(r,2);
      if (isNaN(load_tab_onset) || isNaN(load_tab_duration) || isNaN(load_tab_value)) { 
        continue;
      }
      for (let m = round(load_tab_onset,1); m < round(load_tab_onset,1) + round(load_tab_duration,1) ; m = m + .1) { //set rows within onset, duration of 
        if (m < duration_s) {
          this.f_tab.setString(round(round(m,1)*10),2,load_tab_value);
        }
      }
    }
    this.setupAfterTable();
  }

  loadInfoFromTable = (loadedtable) => {
    let load_tab = loadedtable;
    for (let r = 0; r < load_tab.getRowCount()-1; r++) { //loop through rows of loaded table
      let load_tab_onset = load_tab.get(r,0)-offset;
      let load_tab_duration = load_tab.get(r,1);
      let load_tab_value = load_tab.get(r,2);
      if (isNaN(load_tab_value) || typeof load_tab_value !== 'number') {
        load_tab_value = 0;
      }
      if (isNaN(load_tab_onset) || isNaN(load_tab_duration) || isNaN(load_tab_value) || typeof load_tab_value !== 'number') { 
        continue;
      }
      for (let m = round(load_tab_onset,1); m < round(load_tab_onset,1) + round(load_tab_duration,1) ; m = m + .1) { //set rows within onset, duration of 
        if (m < duration_s) {
          this.f_tab.setString(round(m*10),2,load_tab_value);
        }
      }
    }
    this.setupAfterTable();
  }
  setupAfterTable = () => {
    let feature_vals = this.f_tab.getColumn(2);
    let min_feat = min(feature_vals);
    let max_feat = max(feature_vals);
    //draw coarse timeline
    canvas2.fill(this.c);
    canvas2.stroke(this.c);
    canvas2.strokeWeight(1);
    for (let r = 1; r < this.f_tab.getRowCount(); r++) {
      // print(f_tab.getRowCount());
      //let px = map(f_tab.getString(r-1, 0), 0, 1539, 0, column1_w); //map x time from s to px x
      let px = map(r-1, 0, this.f_tab.getRowCount(), 0, column1_w); //map x time from s to px x

      let py = vid_h+slider_h - map(this.f_tab.getString(r-1, 2), min_feat, max_feat, 0, 74); //map y feature val from min max to px y
      //let x = map(f_tab.getString(r, 0), 0, 1539, 0, column1_w);
      let x = map(r, 0, this.f_tab.getRowCount(), 0, column1_w);
      let y = vid_h+slider_h - map(this.f_tab.getString(r, 2), min_feat, max_feat, 0, 74);
      canvas2.line(px, py, x, y);
    }
    //drawMetaData() {
    let meta_h = 12+ 57 *(this.feature_n-1);
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
    feat_selected = true; //the feature is selected and loaded, so draw it now
  }
  //edit the feature value in the table
  editValue = (new_feat_time,new_feat_val) => {
    let edit_time = round(map(new_feat_time, 0, 1, 0, float(this.f_tab.getRowCount())));
    this.f_tab.set(edit_time,2,new_feat_val);
  } 
  //export edited table to csv
  exportFeatureTable = (input_export_name) => {
    saveTable(this.f_tab, input_export_name, "tsv")
  }

  drawFeatureSliding = () => {
    let feature_vals = this.f_tab.getColumn(2);
    let min_feat = min(feature_vals);
    let max_feat = max(feature_vals);
    stroke(100);
    if (isNaN(completion)) {
      completion = 0;
    }
    let current_rowindex = round(map(completion, 0, 1, 0, float(this.f_tab.getRowCount()))) - 50;
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
        let py = vid_h+slider_h+120 - map(this.f_tab.getString(current_rowindex+i, 2), min_feat, max_feat, 0, 100);
        let x = map(completion+i+1, 0, 100, 0, column1_w);
        let y = vid_h+slider_h+120 - map(this.f_tab.getString(current_rowindex+i+1, 2), min_feat, max_feat, 0, 100);
        line(px, py, x, y);
      }
    } 
  }

  //make an overlaid bar of the instantaneous feature level
  drawInstantaneous = () => {
    let feature_vals = this.f_tab.getColumn(2);
    let min_feat = min(feature_vals);
    let max_feat = max(feature_vals);
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
      let current_val = this.f_tab.getString(current_rowindex, 2);
      current_val = map(current_val,min_feat,max_feat,0,100)
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