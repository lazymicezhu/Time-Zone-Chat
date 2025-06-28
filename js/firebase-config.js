// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwa7egKXbAtDmiiYvAISSw9-JTaU51I7Y",
    authDomain: "time-zone-chat.firebaseapp.com",
    projectId: "time-zone-chat",
    storageBucket: "time-zone-chat.firebasestorage.app",
    messagingSenderId: "853558115420",
    appId: "1:853558115420:web:956c2d4f9dc87786d6ba99",
    measurementId: "G-4JX94MLY1V",
    databaseURL: "https://time-zone-chat-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// References to Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Export Firebase services for use in other files
window.auth = auth;
window.database = database;
window.storage = storage; 