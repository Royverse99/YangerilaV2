// --- Firebase CDN imports ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// --- Minimal config (double-check every value) ---
const firebaseConfig = {
  apiKey: "AIzaSyDHDJHrnQ2IwvetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio",
  storageBucket: "yangerila-studio.appspot.com",
  messagingSenderId: "585529190595",
  appId: "1:585529190595:web:755d5834949c3b30f9a76",
  measurementId: "G-39S837X9BB"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- DOM elements ---
const form = document.querySelector('#login-form');
const emailEl = document.querySelector('#email');
const passEl = document.querySelector('#password');
const errorEl = document.querySelector('#error');

// --- Show error helper ---
function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.visibility = 'visible';
}

// --- Handle submit ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.style.visibility = 'hidden';

  try {
    const email = emailEl.value.trim();
    const password = passEl.value;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Logged in as:', userCredential.user.email);
    alert('Login success!');
  } catch (err) {
    console.error('[Login error]', err);
    showError(err.message);
  }
});
