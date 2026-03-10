import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJH-7j_HiHMzB_aSk5HVcuZa9Yq0hc51k",
  authDomain: "tushkuna-841ee.firebaseapp.com",
  projectId: "tushkuna-841ee",
  storageBucket: "tushkuna-841ee.firebasestorage.app",
  messagingSenderId: "164559813830",
  appId: "1:164559813830:web:a16455ae66112b02faabc7",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
