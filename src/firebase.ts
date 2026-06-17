import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDV9q2602a83dS1brqPZzj3w9Bqv6L9ubQ",
  authDomain: "raav-store.firebaseapp.com",
  projectId: "raav-store",
  storageBucket: "raav-store.firebasestorage.app",
  messagingSenderId: "976738648508",
  appId: "1:976738648508:web:2d2006cb6b914f1aa82bb9"
};

const app = initializeApp(firebaseConfig);

// Initialize with the custom Firestore database ID provided in the config
export const db = initializeFirestore(app, {}, "ai-studio-8e352a06-450a-4975-8d99-f54f0a5f58aa");

export const auth = getAuth(app);
