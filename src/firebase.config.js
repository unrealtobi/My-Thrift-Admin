// src/firebase.config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
// ← NEW:
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyC7pOCYSGpYMUDiRxRN4nV4UUfd2tdx1Jg",
  authDomain: "ecommerce-ba520.firebaseapp.com",
  projectId: "ecommerce-ba520",
  storageBucket: "ecommerce-ba520.appspot.com",
  messagingSenderId: "620187458799",
  appId: "1:620187458799:web:c4deef3184a5145256cf1a",
};

const app = initializeApp(firebaseConfig);

// existing exports
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// new export for calling your HTTPS‐callable functions
export const functions = getFunctions(app);

// default export if you need the raw app
export default app;
