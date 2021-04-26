
var firebase = require('firebase/app');
require('firebase/database');

var firebaseConfig = {
    apiKey: "AIzaSyANnC0LFYWIy80G0iIQhXeyLCEIDawaMdY",
    authDomain: "iot-final-36310.firebaseapp.com",
    databaseURL: "https://iot-final-36310-default-rtdb.firebaseio.com",
    projectId: "iot-final-36310",
    storageBucket: "iot-final-36310.appspot.com",
    messagingSenderId: "27481891880",
    appId: "1:27481891880:web:eff1c05d11ed935ea8011d",
    measurementId: "G-PXWJFZXD00"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  //firebase.analytics();
  var database = firebase.database();


  

 
  
  function endSession(sessionID, name, email, imageUrl) {
  firebase.database().ref('users/' + sessionID).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}

endSession(1,'a','b','c');

