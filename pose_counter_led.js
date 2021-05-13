var firebase = require('firebase/app');
require('firebase/database');
var util = require('util');
var sense = require('@trbll/sense-hat-led');
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAJYdL2lck3THKrhyILJIeSo_q52P579qA",
    authDomain: "iot-project-pose-counter-t12.firebaseapp.com",
    databaseURL: "https://iot-project-pose-counter-t12-default-rtdb.firebaseio.com/",
    projectId: "iot-project-pose-counter-t12",
    storageBucket: "iot-project-pose-counter-t12.appspot.com",
    messagingSenderId: "630039970059",
    appId: "1:630039970059:web:a11302aed1bd93269aa20e"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var database = firebase.database();

var poseCounterRef = firebase.database().ref('exercise_data/pose_counter');

poseCounterRef.on('value', (snapshot) => {
    var poseCounts = snapshot.val();
    console.log("current pose counts: " + poseCounts);
    var red = [255, 255, 255];
    var off = [0, 0, 0]
    sense.showLetter(poseCounts.toString(), red, off);
  });