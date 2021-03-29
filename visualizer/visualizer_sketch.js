let vid = null; //video object
let vid_loaded = false;

let loading = false;
let loading_text;

let feat_selected = false;

let f_id; // start on a dummy feature for now...
let f_folder = './assets/'

let features = [];
let feature_color = [];
let feature_n = 0;
let current_feature = 0; // feature to edit

let instructions; //html text instrucitons

let delete_buttons = [];
let button_play;
let button_load;
let button_mute;

let button_load_feature;
let button_load_feature_instructions;

let canvas2; //graphics renderer for coarse graph, background
let canvas3; //graphics renderer for labels
let canvas4; // highest level overlay

//dimensions
let column1_w = 640;
let canvas_w = 900;
let canvas_h = 600-6;
let vid_w = 640;
let vid_h = 360;
let slider_h = 75;
let fine_h = vid_h+95

//plotting info
let coarseness = 50; //rename window?
let coarse_ymax = 0.1;
let coarse_ymin = 0;

//feature info
let min_feat;
let max_feat;
let new_feature = 1; //now unused

//time info
let vid_speed = 1;
let playing = false;
let editing = false
let muted = false;
let completion = 0;
let duration_s = 60; //stimulus duration in seconds - updated in setup()
let vid_duration_s; //loaded video duration in seconds
let time = 0; //movie time
let time_m; //time ms for printing time
let time_s; //time s for printing time
let feature_sr = 10; // sampling rate of feature, default to 10hz
let offset = 0;  //25.5; // merlin movie started at 25.5 seconds..
let duration_ratio;

let neuroscout_up;
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
let run_selected;
let neuroscout_down_text;
let datasets_url = 'https://neuroscout.org/api/datasets?active_only=true'

function preload() {
}

function setup() { //initial splash screen setup
  cnv = createCanvas(canvas_w, canvas_h); // create main canvas
  cnv.position(52,53);
  canvas2 = createGraphics(canvas_w, canvas_h); //create renderer for coarse graph, background
  canvas3 = createGraphics(canvas_w, canvas_h); //create renderer for labels
  canvas4 = createGraphics(canvas_w, canvas_h); //create renderer for overlay, foreground
  canvas3.clear();
  neuroscout_down_text = createP('<b style="color:rgb(100%,0%,0%);">1) Neuroscout is down, no access to API.</b>');
  neuroscout_down_text.position(150, 50);
  if (neuroscout_up) {
  	neuroscout_down_text.hide()
  }
  offset_set_instructions = createP('- Optional: enter offset time (s) -->');// e.g. how long after the scan started did the movie start.
  offset_set_instructions.position(167, 100);
  offset_set_instructions2 = createP('<i>(e.g. how long after scan start did the movie start)</i>');// 
  offset_set_instructions2.position(165, 120);
  offset_input = createInput('');
  offset_input.position(395, 115);
  offset_input.size(25)
  button_offset = createButton('set');
  button_offset.position(offset_input.x + offset_input.width, 115);
  button_offset.mousePressed(offset_set);

  // video load button
  button_load_instructions = createP('<b>2) Select a locally saved video file of the stimulus. --></b>');
  button_load_instructions.position(150, 200);
  button_load = createFileInput(handleVideo);
  button_load.position(550, 215);

  button_dummy_instructions = createP('OR: Use the Feature Explorer without video.');
  button_dummy_instructions.position(167, 225);
  button_dummy = createButton('No Video');
  button_dummy.position(550, 240);
  button_dummy.mousePressed(handleDummy); // attach button listener
  checkStatus();
}

function neuroscout_up_setup(){
    neuroscout_down_text.hide()
    let dataset_count = Object.keys(datasets).length;
    sel_ds_instructions = createP('<b>1) Select a dataset, task, and run from Neuroscout. --></b>');
    sel_ds_instructions.position(150, 50);
    sel_ds = createSelect();
    sel_ds.position(550, 65);
    sel_ds.option('Select a Dataset');
    sel_ds.selected('Select a Dataset');
    ds_dict = new p5.TypedDict();

    for (let ds_n = 0; ds_n < dataset_count; ds_n++) {
      sel_ds.option(datasets[ds_n].name);
      ds_dict.create(datasets[ds_n].name, ds_n);
    }
    sel_ds.changed(dsSelect);

    sel_task = createSelect();
    sel_task.position(550, 90);
    sel_task.option('Select a task');
    sel_task.selected('Select a task');

    sel_run = createSelect();
    sel_run.position(550,115);
    sel_run.option('Select a run');
    sel_run.selected('Select a run');

    sel_task.hide();
    sel_run.hide();

    sel_predictor = createSelect();
    sel_predictor.position(canvas_w+57, 175);
    sel_predictor.option('Select a predictor from Neuroscout');
    sel_predictor.selected('Select a predictor from Neuroscout');
    sel_predictor.hide();
}


function offset_set() {
  offset = offset_input.value();
}

function setup2() { //after splash screen setup
  neuroscout_down_text.hide();
  if(neuroscout_up===true){
    sel_ds.hide();
    sel_ds_instructions.hide();
    sel_task.hide();
    sel_predictor.hide();
    sel_run.hide();
  }
  if (run_selected === true){
    predictorlistLoad();
  }
  addButtons();
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
      for (let i = features.length-1; i >= 0 ; i--) {
        features[i].drawFeatureSliding();
        features[i].drawInstantaneous();  
      }
    }
    drawCurrentTime();
    drawGraphicOverlay();
    image(canvas3,0,0); //display overlay canvas
    image(canvas4,0,0); //display grid
    checkMouseIsPressed();
  }
}

function highlightFeature() {
  //drawMetaData() {
  let meta_h = 25+ 57 *(current_feature);
  canvas3.stroke(255,255);
  canvas3.fill(0,0,255,20)
  canvas3.rect(vid_w+5,meta_h,252,54,3);
}

function mousePressed() {
  setCurrentFeature();
}

function setCurrentFeature() {
  if (mouseX > vid_w && mouseX < canvas_w && mouseY <canvas_h){
    for (let i = features.length-1; i >= 0 ; i--) {
      let meta_h = 25+ 57 *i;
      let meta_h2 = 25 + 57 *(i+1);
      if (mouseY > meta_h && mouseY < meta_h2){
        current_feature = i;
        redrawFeaturePanel();
      }
    }
  }
}

function checkMouseIsPressed() {
  if (mouseIsPressed) {
    monitorEdits();
    scrub();
  }
}

function monitorEdits() {
  if (editing && mouseX < vid_w && mouseY > vid_h+slider_h && mouseY < vid_h+slider_h+120) { //if EDITING mode is on and mouse is held down within the fine timeline
    let click_time = vid.time()+map((mouseX/column1_w),0,1,-5*duration_ratio,5*duration_ratio); //get time point to edit from mouse location
    if (click_time >= 0 && click_time < vid_duration_s) {
      if (!keyIsDown(16)) { // if SHIFT is held down, set value to 0, otherwise 1
        features[current_feature].editValue(click_time/vid_duration_s, 1);// given time point and value to set
      }
      else if (keyIsDown(16)) {
        features[current_feature].editValue(click_time/vid_duration_s, 0);// given time point and value to set
      }
    }
  }
}

function scrub() {
  //navigation in coarse window
  if (!editing) { // if edit mode is off, do allow skipping
    if (mouseX < vid_w && mouseY > vid_h && mouseY < vid_h+slider_h){
      vid.time((mouseX/column1_w) * vid.duration());
    }
    //navigation in fine window
    else if (mouseX < vid_w && mouseY > vid_h+slider_h && mouseY < vid_h+slider_h+120){
      let cur_t = vid.time();
      vid.time(cur_t+map((mouseX/column1_w),0,1,-1,1));
    }
  }
}

function addButtons() {
  //Instructions
  instructions = createP('- Select predictors from Neuroscout or upload your own local .tsv files.');
  instructions.position(55, canvas_h+50);
  instructions2 = createP('- Navigate by clicking within the "coarse" and "fine" timelines below the video.');
  instructions2.position(55, canvas_h+75);
  instructions3 = createP("- With edit mode ON, select a loaded feature (right panel) to edit its values.");
  instructions3.position(55, canvas_h+100);
  edit_instructions = createP('- Click within the fine timeline to set points to 1. Shift-click to set points to 0.');
  edit_instructions.position(55, canvas_h+125);
  hotkeys = createP('<i>Hotkeys: spacebar=play/pause; 1,2,3=change speed; m=mute; e=toggle editing; R/L arrow keys=skip +/- 5s; U/D Arrow = volume</i>');
  hotkeys.position(55, canvas_h+150);
  // load feature tsv + instructions
  button_load_feature_instructions1 = createP('<b>Feature Selection:</b>');
  button_load_feature_instructions1.position(canvas_w+57, 42);
  button_load_feature_instructions = createP('Or upload your own .tsv file.');
  button_load_feature_instructions.position(canvas_w+57, 95);
  button_load_feature = createFileInput(handleFeature);
  button_load_feature.position(canvas_w+57, 133);
  // video play
  button_play = createButton('Play');
  button_play.style('background-color', color(47, 222, 79));
  button_play.position(60,canvas_h+24);
  button_play.mousePressed(toggleVid); // attach button listener
  //edit mode
  button_edit = createButton('Editing: OFF');
  button_edit.position(118,canvas_h+24);
  button_edit.mousePressed(toggleEdit); // attach button listener
  button_edit.style('background-color', color(176, 30, 30))
  //sound
  button_volup = createButton('Vol+');
  button_volup.style('background-color', color(0))
  button_volup.style("color", color(255));

  button_volup.position(vid_w-95,canvas_h+24);
  button_volup.mousePressed(volUp); // attach button listener
  button_voldn = createButton('Vol-');
  button_voldn.style('background-color', color(0))
  button_voldn.style("color", color(255));
  button_voldn.position(vid_w-55,canvas_h+24);
  button_voldn.mousePressed(volDown); // attach button listener
  button_mute = createButton('Mute');
  button_mute.style('background-color', color(0))
  button_mute.style("color", color(255));
  button_mute.position(vid_w-18,canvas_h+24);
  button_mute.mousePressed(mute_sound); // attach button listener
  //speed
  button = createButton('.5x');
  button.position(vid_w-200,canvas_h+24);
  button.mousePressed(half_speed);
  button.style('background-color', color(0))
  button.style("color", color(255));
  button = createButton('1x');
  button.position(vid_w-170,canvas_h+24);
  button.mousePressed(normal_speed);
  button.style('background-color', color(0))
  button.style("color", color(255));
  button = createButton('2x');
  button.position(vid_w-140,canvas_h+24);
  button.mousePressed(twice_speed);
  button.style('background-color', color(0))
  button.style("color", color(255));
  //Feature Export
  button_load_feature_instructions1 = createP('<b>Feature Export:</b>');
  button_load_feature_instructions1.position(canvas_w+57, 210);

  input_export_name = createInput('edited_feature.tsv');
  input_export_name.position(canvas_w+57, 250);

  button_export_feature = createButton('Export Feature');
  button_export_feature.position(input_export_name.x + input_export_name.width, 250);
  button_export_feature.mousePressed(exportFeature);
}
//Keyboard Hotkeys
function keyPressed() {
  if (vid_loaded && loading==false) {
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
      volUp()
    }
    if (keyCode === 40) { //down arrow vol down
      volDown()
    }
  }
}

function volUp() {
  if (vid.volume()<0.91) {
        vid.volume(vid.volume()+0.1);
  }
}

function volDown() {
  if (vid.volume()>0.1) {
        vid.volume(vid.volume()-0.1);
  }
}

function exportFeature() { // export the current edited feature as a csv
  features[current_feature].exportFeatureTable(input_export_name.value());
}

function handleFeature(file) { //called when you select a feature to visualize
  f_id = file.name.split('.').slice(0, -1).join('.');
  let file_table = textToTable(file.data,f_id);
  feature_n = features.length;
  features.push(new Feature(f_id, feature_n,1,file_table));

}
function textToTable(text,name) {
  // convert tab seperated text to a table because can't load a .tsv file as a table
  // text = text data
  // name = string for third column, it is the feature name
  let file_array = text.split('\n');
  let table = new p5.Table();
  table.addColumn("onset");
  table.addColumn("duration");
  table.addColumn(name);
  for (var i=1; i<file_array.length-1; i++) {
    y = file_array[i].split('\t');
    let newRow = table.addRow(); 
    newRow.setString("onset",y[0]);
    newRow.setString("duration",y[1]);
    newRow.setString(name,y[2]);
  }
  return table;
}

function loadFileTable(file_table) {
  //console.log(file_table);
}

function featSelect() { //called when you select a feature to visualize
  if (sel.value() !== ''){
    f_id = sel.value();
    feature_n = features.length;
    features.push(new Feature(f_id, feature_n));
    features[feature_n-1].loadFeatTable();
  }
}

function checkStatus(){
  // Check Server/Website Is Online Or Offline Via Pure JavaScript
  // Shared On www.exeideas.com
  url = 'https://neuroscout.org/static/Neuroscout_Simple_Wide.svg';
  img = new Image();
  img.src = url;
  img.onload = function(){
    neuroscout_up = true;
    console.log('neuroscout is up');
    //neuroscout_up_setup();
    load_datasets();
  }
  img.onerror = function(){
    neuroscout_up = false;
    console.log('neuroscout is down');
  }
}

function load_datasets(){
	datasets = loadJSON(datasets_url,datasets_loaded);
}

function datasets_loaded(){
	neuroscout_up_setup();
}

//API STUFF
function dsSelect() { //called when you select a neuroscout dataset
  ds_ind = ds_dict.get(sel_ds.value()); //ds index
  let task_count = datasets[ds_ind].tasks.length; // # of tasks in the dataset
  sel_task.remove(); //destroy old task select object, make a new one
  sel_task = createSelect();
  sel_task.position(550, 90);
  sel_task.option('Select a task');
  sel_task.selected('Select a task');
  task_dict = new p5.TypedDict();
  for (let task_n = 0; task_n < task_count; task_n++) { //loop through tasks, add select options
    sel_task.option(datasets[ds_ind].tasks[task_n].name);
    task_dict.create(datasets[ds_ind].tasks[task_n].name, datasets[ds_ind].tasks[task_n].id); // add task name, id to dict
  }
  sel_task.changed(taskSelect);
  sel_predictor.hide(); //if changing dataset, hide predictor and run selectors
  sel_run.hide();
}
function taskSelect() { //called when you select a neuroscout task
  startLoading();
  task_id = task_dict.get(sel_task.value());
  let run_url = 'https://neuroscout.org/api/runs?task_id='+task_id+'&dataset_id='+datasets[ds_ind].id;
  runs = loadJSON(run_url, runLoaded);
}

function runLoaded() { //after selecting a task, runs are loaded
  sel_run.remove();
  let run_count = Object.keys(runs).length; 
  run_array = []
  for (let r_n = 0; r_n < run_count; r_n++) {
    run_array.push(runs[r_n]);
  }
  runs_u = unique(run_array,'number');
  sel_run = createSelect();
  sel_run.position(550,115);
  sel_run.option('Select a run');
  sel_run.selected('Select a run');
  run_dict = new p5.TypedDict(); //run_name -> run id
  dur_dict = new p5.TypedDict(); //run_name -> run duration
  for (let r_u = 0; r_u < runs_u.length; r_u++){
    if ( str(runs_u[r_u].number) === 'null' ) {
      run_name = runs_u[r_u].task_name;
    } else {
      run_name = runs_u[r_u].task_name+str(runs_u[r_u].number);
    }
    sel_run.option(str(run_name));
    run_dict.create(run_name, runs_u[r_u].id);
    dur_dict.create(run_name, runs_u[r_u].duration);
  }
  doneLoading();
  sel_run.changed(runSelect);
}
function runSelect(){ //called when a run is selected
  run_id = run_dict.get(sel_run.value());
  duration_s = dur_dict.get(sel_run.value());
  run_selected = true
}
function predictorlistLoad(){
  startLoading();

  run_id = run_dict.get(sel_run.value());
  let onset_url = 'https://neuroscout.org/api/runs/'+run_id+'/timing'
  onset_object = loadJSON(onset_url, onsetLoaded)

  let predictors_url = 'https://neuroscout.org/api/predictors?run_id='+run_id+'&active_only=true&newest=true'
  predictors = loadJSON(predictors_url, predictorlistLoaded)
  sel_run.hide();
}

function onsetLoaded(){
  offset = onset_object[0].onset
}

function predictorlistLoaded(){ //called when you load predictors for a selected task
  sel_predictor.remove();
  sel_predictor = createSelect();
  sel_predictor.position(canvas_w+57, 80);
  sel_predictor.option('Select a predictor from Neuroscout');
  sel_predictor.selected('Select a predictor from Neuroscout');
  let predictor_count = Object.keys(predictors).length;
  predictor_dict = new p5.TypedDict();
  for (let p_n = 0; p_n < predictor_count; p_n++) {
    sel_predictor.option(predictors[p_n].name);
    predictor_dict.create(predictors[p_n].name, predictors[p_n].id);
  }
  sel_predictor.changed(predictorSelect);
  doneLoading();
}
function predictorSelect(){ //called when a predictor is selected
  predictor_id = predictor_dict.get(sel_predictor.value());
  startLoading();
  let predictors_url = 'https://neuroscout.org/api/predictor-events?run_id='+run_id+'&predictor_id='+predictor_id+'&stimulus_timing=true'
  predictor_events = loadJSON(predictors_url, eventsLoaded)
  sel_run.hide();
}
function eventsLoaded(){ //called when predictor events are loaded
  let events_count = Object.keys(predictor_events).length;
  predictor_table = new p5.Table();
  predictor_table.addColumn("onset");
  predictor_table.addColumn("duration");
  predictor_table.addColumn("value");
  for (let e = 0; e < events_count; e++) {
    let newRow = predictor_table.addRow(); // Create new row object 
    newRow.setString("onset",predictor_events[e].onset);
    newRow.setString("duration",predictor_events[e].duration);
    newRow.setString("value",predictor_events[e].value);
  }
  f_id = sel_predictor.value();
  feature_n = features.length;
  features.push(new Feature(f_id, feature_n, 2));
  delete_buttons.push(new DeleteButton(feature_n));
  doneLoading();
}

function drawColumnLines() {
  columnLine(column1_w+1,0,column1_w+1,canvas_h) //vertical line between vid and features
  columnLine(0,1,canvas_w,1) //horizontal line at top of canvas
  columnLine(0,canvas_h-1,canvas_w,canvas_h-1) //horizontal line at very bottom of canvas
  columnLine(1,0,1,canvas_h) //vertical line at left of canvas
  columnLine(canvas_w-1,0,canvas_w-1,canvas_h) //vertical line at right of canvas
  columnLine(0,vid_h,vid_w,vid_h) //horizontal line below video canvas
  columnLine(0, vid_h+slider_h, column1_w, vid_h+slider_h) //horizontal line below coarse timeline
  columnLine(0,fine_h+102,vid_w,fine_h+102) //horizontal line below fine timeline
  columnLine(column1_w/2, fine_h+100, column1_w/2, fine_h+100+8); //tick mark for fine timeline current time
}

function columnLine(line_x,line_y,line_xx,line_yy) {
  canvas4.stroke(150);
  canvas4.strokeWeight(3);
  canvas4.line(line_x,line_y,line_xx,line_yy);
  canvas4.stroke(255);
  canvas4.strokeWeight(1);
  canvas4.line(line_x,line_y,line_xx,line_yy);
}

function drawPanelLabels() {
  canvas4.textSize(12);
  canvas4.fill(200)
  canvas4.stroke(0);
  canvas4.strokeWeight(1);
  canvas4.fill(255);
  canvas4.text("Coarse Timeline",5,vid_h+13);
  canvas4.text("Fine Timeline",5,fine_h+12);
  canvas4.strokeWeight(2);
  canvas4.textSize(18);
  canvas4.text("Features:",vid_w+7,21);
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
  text(String(nf(time_m, 2,0)) + ':' + String(nf(time_s, 2,2))  , 8, 29); 
  // add seconds elapsed
  textSize(10);
  text('Seconds Elapsed' + ': ' + String(nf(time, 4,2))  , 9, 42);
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
    strokeWeight(2);
    fill(color('hsba(0, 100%, 100%, 0.5)'));
    ellipse(vid_w-50,vid_h-50,50,50);  //add a recording sign when editing
  }
}

function startLoading() {
  loading = true;
  textSize(100);
  //loading_text = text('Loading...', 250, 250);
  loading_text = createP('Loading...');
  loading_text.position(vid_w+100, 0);
}

function doneLoading() {
  loading = false;
  loading_text.remove();
  //loading_text = text('', 250, 250);
}

class DeleteButton {
  constructor(f_n) {
    this.f_n = f_n;
    this.button = createButton('x')
    this.delete_w_l = vid_w+280;//canvas_w;
    this.delete_h_t = 25+14+57*(this.f_n+1);
    this.button.position(this.delete_w_l,this.delete_h_t);
    this.button.mousePressed(this.clicked);
  }
  clicked = () => {
    deleteFeature(this.f_n);
  }
}

function deleteFeature(feature2delete){
  if (feature2delete <= current_feature){
    current_feature--;
  }
  features.splice(feature2delete,1);
  for (let i = delete_buttons.length-1; i >= 0 ; i--) {
    delete_buttons[i].button.remove();
  }
  redrawFeaturePanel();
}

function redrawFeaturePanel(){
  canvas3.clear()
  canvas2.clear()
  for (let i = features.length-1; i >= 0 ; i--) {
    features[i].setFeature_n(i);
    features[i].setupAfterTable();
    delete_buttons.push(new DeleteButton(i));
  }
  highlightFeature();
}

function toggleVid() {
  if (playing) {
    vid.pause();
    button_play.html('Play');
  } else {
    vid.play();
    button_play.html('Pause');
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
    button_mute.html('Mute');
    //ellipse(10,10,10,10);  //add a pause sign when paused
  } else {
    vid.volume(0);
    button_mute.html('Unmute');
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

//draw axis labels to canvas4
function drawAxisX(){
  canvas4.stroke(255,0,0);
  canvas4.fill(255,0,0);
  canvas4.rect(column1_w/2, fine_h, 1, 100); //marker for sliding plot current time - aka slider 2
  if (duration_s > 0) {
    canvas4.stroke(255);
    canvas4.strokeWeight(1);
    // canvas4.line(3, vid_h+slider_h, column1_w-1, vid_h+slider_h); //x bar
    for (let i=1; i < 10; i++) { 
      let xPos = (0 + (i*column1_w/10));
  //x ticks    
      canvas4.stroke(255);
      canvas4.strokeWeight(1);
      canvas4.line(xPos+3, vid_h+slider_h, xPos+3, vid_h+slider_h+4);
  //x tick labels
      canvas4.textSize(10);
      canvas4.stroke(250);
      canvas4.strokeWeight(0);
      canvas4.fill(255);
      canvas4.textAlign(CENTER, CENTER);
      canvas4.translate(xPos,vid_h+slider_h+10);
      //canvas4.rotate(PI/6);
      cur_time = i*duration_s/10;
      canvas4.text(secondsToMinSec(cur_time),2,0);
      //canvas4.rotate(-PI/6);
      canvas4.translate(-xPos,-vid_h-slider_h-10);
    }
  }
}

function hideSplash() {
  button_load_instructions.hide();
  button_load.hide();
  button_dummy_instructions.hide();
  button_dummy.hide();
  offset_input.hide();
  button_offset.hide();
  offset_set_instructions.hide();
  offset_set_instructions2.hide();
}

function handleDummy() {
  vid_loaded = true;
  vid = createVideo(['./assets/dummy.mp4'],dummyLoad);
  vid.position(0,0);
  vid.hide();
  canvas4.stroke(0);
  canvas4.strokeWeight(2);
  canvas4.fill(255);
  canvas4.textSize(10);
  canvas4.text("Stimulus Video: Placeholder",9,55);
  hideSplash()
  setup2();
}

function dummyLoad() {
  vid_duration_s = vid.duration();
  duration_ratio = vid_duration_s/duration_s;
  vid_speed = duration_ratio; // if loading dummy vid, set new base video speed
  vid.speed(vid_speed);
  drawAxisX();
}

function handleVideo(file) {
  if (file.type === 'video') {
    vid_loaded = true;
    vid = createVideo(file.data,vidLoad);
    vid.position(0,0);
    vid.hide();
    canvas4.stroke(0);
    canvas4.strokeWeight(2);
    canvas4.fill(255);
    canvas4.textSize(10);
    canvas4.text("Stimulus Video: ".concat(file.name),9,55);
    hideSplash()
    setup2();
  }
}

function vidLoad() {
  vid_duration_s = vid.duration();
  duration_s = vid.duration();
  duration_ratio=1;
  vid_speed = 1;
  drawAxisX();
}

class Feature {
  constructor(f_id,feature_n,type,input) {
    this.input=input;
    this.f_id = f_id;
    this.feature_n = feature_n;
    this.type=type;
    colorMode(HSB, 360, 100, 100, 100);
    this.c = color((((feature_n+1)*105)-105)%360, 100-(20*feature_n/5), 100-(20*feature_n/5), 60);
    if (this.type == 0) {
      this.loadInfoFromTable(this.input);
    }
    else if (this.type == 1) {
      this.loadInfoFromFile(this.input);
    }
    else if (this.type == 2) {
      this.loadInfoFromNS();
    }
  }
  setFeature_n(feature_n_new){
    this.feature_n=feature_n_new;
  }
  loadFeatTable(){
    this.createNewFeature(); //make a new blank table at given sr and duration
    this.load_tab = loadTable(this.f_id, 'tsv', 'header', this.loadInfoFromTable); //load specified feature table
    //this.loadInfoFromTable(this.load_tab);
  }
  createNewFeature() {
    let table = new p5.Table();
    let delete_w_l; 
    let delete_h_t;
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
  loadInfoFromFile(data){
    this.createNewFeature(); //make a new blank table at given sr and duration
    let load_tab = data;
    for (let r = 0; r < load_tab.getRowCount()-1; r++) { //loop through rows of loaded table
      let load_tab_onset = load_tab.get(r,0)-offset;
      let load_tab_duration = load_tab.get(r,1);
      let load_tab_value = load_tab.get(r,2);
      if (isNaN(load_tab_onset) || isNaN(load_tab_duration) || isNaN(load_tab_value)) { 
        continue;
      }
      for (let m = round(load_tab_onset,1); m < round(load_tab_onset,1) + round(load_tab_duration,1) ; m = m + .1) { //set rows within onset, duration of 
        if (m >= 0 && m < duration_s-.2) {
          this.f_tab.setString(round(m*10),2,load_tab_value);
        }
      }
    }
    this.setupAfterTable();
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
        if (m >= 0 && m < duration_s-.2) {
          this.f_tab.setString(round(m*10),2,load_tab_value);
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
      if (isNaN(load_tab_onset) || isNaN(load_tab_duration) || isNaN(load_tab_value)) { 
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
      let px = map(r-1, 0, this.f_tab.getRowCount(), 0, column1_w); //map x time from s to px x
      let py = vid_h+slider_h - map(this.f_tab.getString(r-1, 2), min_feat, max_feat, 0, 74); //map y feature val from min max to px y
      let x = map(r, 0, this.f_tab.getRowCount(), 0, column1_w);
      let y = vid_h+slider_h - map(this.f_tab.getString(r, 2), min_feat, max_feat, 0, 74);
      canvas2.line(px, py, x, y);
    }
    //drawMetaData() {
    let meta_h = 25+ 12+ 57 *(this.feature_n);
    canvas3.strokeWeight(1);
    canvas3.stroke(this.c);
    canvas3.textSize(15);
    canvas3.fill(this.c);
    canvas3.stroke(this.c);
    canvas3.text(String(this.f_id),vid_w+8,meta_h);
    canvas3.textSize(12);
    canvas3.stroke(0);
    canvas3.fill(200);
    canvas3.text("feature min: "+String(nf(min_feat,1,2)),vid_w+8,meta_h+13);
    canvas3.text("feature max: "+String(nf(max_feat,1,2)),vid_w+8,meta_h+26);
    canvas3.text("stim duration (mm:ss): "+secondsToMinSec(duration_s),vid_w+8,meta_h+39);
    //draw feature name on bars bar plots
    canvas3.textSize(10);
    canvas3.stroke(0);
    canvas3.fill(200);
    canvas3.translate((this.feature_n*30),vid_h-30)
    canvas3.rotate(-PI/2);
    canvas3.text(String(this.f_id),-18,12+7);
    canvas3.rotate(PI/2);
    canvas3.translate(-this.feature_n*30,-vid_h+30);
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
    stroke(0);
    strokeWeight(2);
    fill(255);
    // stroke(50);
    // strokeWeight(2);
    // fill(50);
    textSize(25);
    let time = duration_s*completion;
    let time_m = ~~(time / 60);
    let time_s = (time % 60);
    text(String(nf(time_m, 2,0)) + ':' + String(nf(time_s, 2,2))  , vid_w/2-49, fine_h+130); 
    strokeWeight(2);
    stroke(this.c);
    //if (current_rowindex > 50 && current_rowindex + 100 < this.f_tab.getRowCount()) {
      for (let i = 0; i < 100; i++) {
        if (current_rowindex+i < 0 || current_rowindex+i+2 > this.f_tab.getRowCount() ) {
          continue;
        }
        let px = map(i, 0, 100, 0, column1_w);
        let py = fine_h+100 - map(this.f_tab.getString(current_rowindex+i, 2), min_feat, max_feat, 0, 100);
        let x = map(i+1, 0, 100, 0, column1_w);
        let y = fine_h+100 - map(this.f_tab.getString(current_rowindex+i+1, 2), min_feat, max_feat, 0, 100);
        line(px, py, x, y);
      }
    //} 
  }

  drawInstantaneous = () => { //make an overlaid bar of the instantaneous feature level
    let feature_vals = this.f_tab.getColumn(2);
    let min_feat = min(feature_vals);
    let max_feat = max(feature_vals);
    noStroke();
    fill(0,100,100);
    strokeWeight(1);
    // rect(column1_w/2, vid_h+slider_h+20, 1, 100); //marker for sliding plot current time
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
      rect((this.feature_n*30)+7, vid_h-5, 20, -current_val);
    }
  }
}

function secondsToMinSec(secondsin) {
  var minutes = Math.floor(secondsin / 60);
  var seconds = ((secondsin % 60)).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function unique(array, propertyName) {
   return array.filter((e, i) => array.findIndex(a => a[propertyName] === e[propertyName]) === i);
}