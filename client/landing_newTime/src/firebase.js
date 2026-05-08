import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "1:1068773085021:web:62b4c9bbf5d31e7043a2b4",        
  authDomain: "checkbid-47303.firebaseapp.com",
  projectId: "checkbid-47303",
  storageBucket: "checkbid-47303.appspot.com",
  messagingSenderId: "G-VCHVTC4XVT",
  appId: "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);