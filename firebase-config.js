// ═══════════════════════════════════════════════════════════
// Firebase Config — ChatLocal
// ════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyB4tvvFWKOUg-qfnF6i6VmrrC4eSeW5KCA",
  authDomain: "chat-605ad.firebaseapp.com",
  projectId: "chat-605ad",
  storageBucket: "chat-605ad.firebasestorage.app",
  messagingSenderId: "991493993064",
  appId: "1:991493993064:web:3a42005a53e5a7475f01dd",
  measurementId: "G-ZSC5E1QRYT"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const provider = new firebase.auth.GoogleAuthProvider();

// Firestore settings
db.settings({ ignoreUndefinedProperties: true });
