import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBcsX7LY-bIRje_phakKegEizhx-cBMtfY",
  authDomain: "nutrilog-429617.firebaseapp.com",
  projectId: "nutrilog-429617",
  storageBucket: "nutrilog-429617.appspot.com",
  messagingSenderId: "519579342149",
  appId: "1:519579342149:web:263121036ddfeed30c1a2c",
  measurementId: "G-C81F8W7R6W",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
