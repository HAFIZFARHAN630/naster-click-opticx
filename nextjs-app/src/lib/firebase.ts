import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCy-F2j1v68MtkHp7JT45OQUlLqgr8P7F8",
  authDomain: "pannel-click-opticx.firebaseapp.com",
  projectId: "pannel-click-opticx",
  storageBucket: "pannel-click-opticx.firebasestorage.app",
  messagingSenderId: "402210414268",
  appId: "1:402210414268:web:4dab8aa43861f883707ab9",
  measurementId: "G-WQSBGV9SN1"
};

const app = initializeApp(firebaseConfig);

let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, analytics };
