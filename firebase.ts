// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRFSk8hV_mnTXd0aPgoyRhB290thsdBtQ",
  authDomain: "bcr-reaction.firebaseapp.com",
  projectId: "bcr-reaction",
  storageBucket: "bcr-reaction.appspot.com",
  messagingSenderId: "157924467368",
  appId: "1:157924467368:web:e99e904a4471d1df7a989d",
  measurementId: "G-7RDY6B0TDM",
  databaseURL: "https://bcr-reaction-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);