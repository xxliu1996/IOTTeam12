/**
 * @license
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as posenet_module from '@tensorflow-models/posenet';
import * as facemesh_module from '@tensorflow-models/facemesh';
import * as tf from '@tensorflow/tfjs';
import * as paper from 'paper';
import dat from 'dat.gui';
import Stats from 'stats.js';
import "babel-polyfill";

import {drawKeypoints, drawPoint, drawSkeleton, isMobile, toggleLoadingUI, setStatusText} from './utils/demoUtils';
import {SVGUtils} from './utils/svgUtils'
import {PoseIllustration} from './illustrationGen/illustration';
import {Skeleton, facePartName2Index} from './illustrationGen/skeleton';
import {FileUtils} from './utils/fileUtils';
import {squatLeftCounter, squatRightCounter} from './utils/squat_counterUtils';
import {benchPressLeftCounter, benchPressRightCounter} from './utils/bench_press_counterUtils';

import * as girlSVG from './resources/illustration/girl.svg';
import * as boySVG from './resources/illustration/boy.svg';
import * as abstractSVG from './resources/illustration/abstract.svg';
import * as blathersSVG from './resources/illustration/blathers.svg';
import * as tomNookSVG from './resources/illustration/tom-nook.svg';

// Camera stream video element
let video;
let videoWidth = 300;
let videoHeight = 300;

// Canvas
let faceDetection = null;
let illustration = null;
let canvasScope;
let canvasWidth = 800;
let canvasHeight = 800;

// ML models
let facemesh;
let posenet;
let minPoseConfidence = 0.15;
let minPartConfidence = 0.1;
let nmsRadius = 30.0;

// Misc
let mobile = false;
const stats = new Stats();
const avatarSvgs = {
  'girl': girlSVG.default,
  'boy': boySVG.default,
  'abstract': abstractSVG.default,
  'blathers': blathersSVG.default,
  'tom-nook': tomNookSVG.default,
};

/*
// Set up firebase connection
// Firebase App (the core Firebase SDK) is always required and must be listed first
var firebase = require('firebase/app');
require('firebase/database');
var firebaseConfig = {
  apiKey: "AIzaSyAJYdL2lck3THKrhyILJIeSo_q52P579qA",
  authDomain: "iot-project-pose-counter-t12.firebaseapp.com",
  projectId: "iot-project-pose-counter-t12",
  storageBucket: "iot-project-pose-counter-t12.appspot.com",
  messagingSenderId: "630039970059",
  appId: "1:630039970059:web:a11302aed1bd93269aa20e"
};
// Initialize Firebase
firebase.default.initializeApp(firebaseConfig);

// Function to upload the exercise data to the database.
function updateDatabase(usrID, usrEmail, poseName, poseCounts, exerciseTime) {
  var database = firebase.database();
  var userIDRef = database.ref('user_info/user_id');
  var userEmailRef = database.ref('user_info/user_email');
  var userIDValue = "None";
  var userEmailValue = "None";

  userIDRef.on('value', (snapshot) => {
    userIDValue = snapshot.val();
    userEmailRef.on('value', (snapshot) => {
      userEmailValue = snapshot.val();
    });
    if (userIDValue == usrID && userEmailValue == usrEmail) {
      var database_ref = firebase.database().ref();
      database_ref.update({'exercise_data/pose_name':poseName});
      database_ref.update({'exercise_data/pose_counter':poseCounts});
      database_ref.update({'exercise_data/time':exerciseTime});
    }
  });

}
*/

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: videoWidth,
      height: videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

const defaultPoseNetArchitecture = 'MobileNetV1';
const defaultQuantBytes = 2;
const defaultMultiplier = 1.0;
const defaultStride = 16;
const defaultInputResolution = 200;

const guiState = {
  avatarSVG: Object.keys(avatarSvgs)[0],
  debug: {
    showDetectionDebug: true,
    showIllustrationDebug: false,
  },
};

/**
 * Sets up dat.gui controller on the top-right of the window
 */
function setupGui(cameras) {

  if (cameras.length > 0) {
    guiState.camera = cameras[0].deviceId;
  }

  const gui = new dat.GUI({width: 300});

  let multi = gui.addFolder('Image');
  gui.add(guiState, 'avatarSVG', Object.keys(avatarSvgs)).onChange(() => parseSVG(avatarSvgs[guiState.avatarSVG]));
  multi.open();

  let output = gui.addFolder('Debug control');
  output.add(guiState.debug, 'showDetectionDebug');
  output.add(guiState.debug, 'showIllustrationDebug');
  output.open();
}

/**
 * Sets up a frames per second panel on the top-left of the window
 */
function setupFPS() {
  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  document.getElementById('main').appendChild(stats.dom);
}

/**
 * Update the counter panel.
 */
function updateCounter(currentPose, poseSelected) {
  let pose_position = ['No', 'Yes'];
  if (poseSelected == "squat-left") {
    let poseAnalysisResults = squatLeftCounter(currentPose);
    let movements_counter_doc = document.getElementById('movements-counter').contentWindow;
    movements_counter_doc.document.getElementById('num_pose').innerHTML = 'Number of squats: ' + poseAnalysisResults[2];
    movements_counter_doc.document.getElementById('angle_pose').innerHTML = 'Angle of knee joint: ' + poseAnalysisResults[0].toFixed(2);
    movements_counter_doc.document.getElementById('position_pose').innerHTML = 'Squat position: ' + pose_position[poseAnalysisResults[1]];
    movements_counter_doc.document.getElementById('tracking_leg').innerHTML = 'Tracking leg: Left';
    // updateDatabase("iot-team12", "iot-team12@gmail.com", "squat", poseAnalysisResults[2], 10);
  } else if (poseSelected == "squat-right") {
    let poseAnalysisResults = squatRightCounter(currentPose);
    let movements_counter_doc = document.getElementById('movements-counter').contentWindow;
    movements_counter_doc.document.getElementById('num_pose').innerHTML = 'Number of squats: ' + poseAnalysisResults[2];
    movements_counter_doc.document.getElementById('angle_pose').innerHTML = 'Angle of knee joint: ' + poseAnalysisResults[0].toFixed(2);
    movements_counter_doc.document.getElementById('position_pose').innerHTML = 'Squat position: ' + pose_position[poseAnalysisResults[1]];
    movements_counter_doc.document.getElementById('tracking_leg').innerHTML = 'Tracking leg: Right';
  } else if (poseSelected == "benchpress-left") {
    let poseAnalysisResults = benchPressLeftCounter(currentPose);
    let movements_counter_doc = document.getElementById('movements-counter').contentWindow;
    movements_counter_doc.document.getElementById('num_pose').innerHTML = 'Number of presses: ' + poseAnalysisResults[2];
    movements_counter_doc.document.getElementById('angle_pose').innerHTML = 'Angle of elbow joint: ' + poseAnalysisResults[0].toFixed(2);
    movements_counter_doc.document.getElementById('position_pose').innerHTML = 'Press position: ' + pose_position[poseAnalysisResults[1]];
    movements_counter_doc.document.getElementById('tracking_leg').innerHTML = 'Tracking arm: Left';
  } else if (poseSelected == "benchpress-right") {
    let poseAnalysisResults = benchPressLeftCounter(currentPose);
    let movements_counter_doc = document.getElementById('movements-counter').contentWindow;
    movements_counter_doc.document.getElementById('num_pose').innerHTML = 'Number of presses: ' + poseAnalysisResults[2];
    movements_counter_doc.document.getElementById('angle_pose').innerHTML = 'Angle of elbow joint: ' + poseAnalysisResults[0].toFixed(2);
    movements_counter_doc.document.getElementById('position_pose').innerHTML = 'Press position: ' + pose_position[poseAnalysisResults[1]];
    movements_counter_doc.document.getElementById('tracking_leg').innerHTML = 'Tracking arm: Right';
  }

}
/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
function detectPoseInRealTime(video) {
  const canvas = document.getElementById('output');
  const keypointCanvas = document.getElementById('keypoints');
  const videoCtx = canvas.getContext('2d');
  const keypointCtx = keypointCanvas.getContext('2d');

  canvas.width = videoWidth;
  canvas.height = videoHeight;
  keypointCanvas.width = videoWidth;
  keypointCanvas.height = videoHeight;

  async function poseDetectionFrame() {
    // Begin monitoring code for frames per second
    stats.begin();

    let poses = [];

    videoCtx.clearRect(0, 0, videoWidth, videoHeight);
    // Draw video
    videoCtx.save();
    videoCtx.scale(-1, 1);
    videoCtx.translate(-videoWidth, 0);
    videoCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
    videoCtx.restore();

    // Creates a tensor from an image
    const input = tf.browser.fromPixels(canvas);
    faceDetection = await facemesh.estimateFaces(input, false, false);
    let all_poses = await posenet.estimatePoses(video, {
      flipHorizontal: true,
      decodingMethod: 'multi-person',
      maxDetections: 1,
      scoreThreshold: minPartConfidence,
      nmsRadius: nmsRadius
    });

    poses = poses.concat(all_poses);
    // console.log(all_poses[0]['keypoints']);
    // console.log(squatLeftCounter(all_poses[0]['keypoints']));
    let movements_counter_doc = document.getElementById('movements-counter').contentWindow;
    let pose_selected = movements_counter_doc.document.getElementById('pose_selector').value;
    updateCounter(all_poses[0]['keypoints'], pose_selected);
    input.dispose();

    keypointCtx.clearRect(0, 0, videoWidth, videoHeight);
    if (guiState.debug.showDetectionDebug) {
      poses.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence) {
          drawKeypoints(keypoints, minPartConfidence, keypointCtx);
          drawSkeleton(keypoints, minPartConfidence, keypointCtx);
        }
      });
      faceDetection.forEach(face => {
        Object.values(facePartName2Index).forEach(index => {
            let p = face.scaledMesh[index];
            drawPoint(keypointCtx, p[1], p[0], 2, 'red');
        });
      });
    }

    canvasScope.project.clear();

    if (poses.length >= 1 && illustration) {
      Skeleton.flipPose(poses[0]);

      if (faceDetection && faceDetection.length > 0) {
        let face = Skeleton.toFaceFrame(faceDetection[0]);
        illustration.updateSkeleton(poses[0], face);
      } else {
        illustration.updateSkeleton(poses[0], null);
      }
      illustration.draw(canvasScope, videoWidth, videoHeight);

      if (guiState.debug.showIllustrationDebug) {
        illustration.debugDraw(canvasScope);
      }
    }

    canvasScope.project.activeLayer.scale(
      canvasWidth / videoWidth,
      canvasHeight / videoHeight,
      new canvasScope.Point(0, 0));

    // End monitoring code for frames per second
    stats.end();

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

function setupCanvas() {
  mobile = isMobile();
  if (mobile) {
    canvasWidth = Math.min(window.innerWidth, window.innerHeight);
    canvasHeight = canvasWidth;
    videoWidth *= 0.7;
    videoHeight *= 0.7;
  }

  canvasScope = paper.default;
  let canvas = document.querySelector('.illustration-canvas');;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvasScope.setup(canvas);
}

/**
 * Kicks off the demo by loading the posenet model, finding and loading
 * available camera devices, and setting off the detectPoseInRealTime function.
 */
export async function bindPage() {
  setupCanvas();

  toggleLoadingUI(true);
  setStatusText('Loading PoseNet model...');
  posenet = await posenet_module.load({
    architecture: defaultPoseNetArchitecture,
    outputStride: defaultStride,
    inputResolution: defaultInputResolution,
    multiplier: defaultMultiplier,
    quantBytes: defaultQuantBytes
  });
  setStatusText('Loading FaceMesh model...');
  facemesh = await facemesh_module.load();

  setStatusText('Loading Avatar file...');
  let t0 = new Date();
  await parseSVG(Object.values(avatarSvgs)[0]);

  setStatusText('Setting up camera...');
  try {
    video = await loadVideo();
  } catch (e) {
    let info = document.getElementById('info');
    info.textContent = 'this device type is not supported yet, ' +
      'or this browser does not support video capture: ' + e.toString();
    info.style.display = 'block';
    throw e;
  }

  setupGui([], posenet);
  setupFPS();

  toggleLoadingUI(false);
  detectPoseInRealTime(video, posenet);
}

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
FileUtils.setDragDropHandler((result) => {parseSVG(result)});

async function parseSVG(target) {
  let svgScope = await SVGUtils.importSVG(target /* SVG string or file path */);
  let skeleton = new Skeleton(svgScope);
  illustration = new PoseIllustration(canvasScope);
  illustration.bindSkeleton(skeleton, svgScope);
}

bindPage()
