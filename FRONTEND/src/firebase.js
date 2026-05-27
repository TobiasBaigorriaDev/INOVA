import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA4PSYNjusMQSqK4uJ5yYOdzSIcM-uOZ_I",
  authDomain: "inova-32787.firebaseapp.com",
  projectId: "inova-32787",
  storageBucket: "inova-32787.firebasestorage.app",
  messagingSenderId: "646528545360",
  appId: "1:646528545360:web:63f48bf6d5e91c66865755",
  measurementId: "G-N7FGW9J21X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();

export default app;