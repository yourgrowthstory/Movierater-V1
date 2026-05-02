// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAi2aYaHU3fZ2ro3r09Ofy3tdISC8w1kYs",
  authDomain: "movierater-74eab.firebaseapp.com",
  projectId: "movierater-74eab",
  storageBucket: "movierater-74eab.firebasestorage.app",
  messagingSenderId: "598158804567",
  appId: "1:598158804567:web:00675f7b6abc78eb33c512"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
