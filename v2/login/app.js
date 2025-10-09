// --- Import Firebase SDKs (v10.12.2 stable CDN) ---
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Correct Firebase configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDHDJHrnQ2IwvetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio",
  storageBucket: "yangerila-studio.appspot.com",
  messagingSenderId: "585529190595",
  appId: "1:585529190595:web:755d5834949c3b30f9a76",
  measurementId: "G-39S837X9BB"
};

// --- Initialize Firebase (prevent double init) ---
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- DOM elements ---
const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const errorBox = document.getElementById("error");

// --- Helper: show errors ---
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.visibility = "visible";
}

// --- Handle login form ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.style.visibility = "hidden";

  const email = emailInput.value.trim();
  const password = passInput.value;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Logged in as:", userCred.user.email);
    alert("Login successful!");
  } catch (err) {
    console.error("[Login error]", err);
    showError(err.message);
  }
});
