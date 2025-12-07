import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyA1Nzzwm4l1MtINDUM8yBuiKzKSv0CY37A",
    authDomain: "mentorism-a1d5d.firebaseapp.com",
    databaseURL: "https://mentorism-a1d5d.firebaseio.com",
    projectId: "mentorism-a1d5d",
    storageBucket: "mentorism-a1d5d.firebasestorage.app",
    messagingSenderId: "142025945428",
    appId: "1:142025945428:web:95cc2d9a8e2443a93798c1",
    measurementId: "G-ZQKGKL670J"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);
const database = getDatabase(app);

export { app, auth, storage, database };
