// =========================
//  Yangerila Admin Login
// =========================

// --- One true Firebase config (same on admin & login) ---
// Correct CDN imports for browser usage (no bundler)
console.log('[FB] projectId:', app.options.projectId);
console.log('[FB] appId:', app.options.appId);
console.log('[FB] apiKey:', app.options.apiKey); // <- see the real key in use

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence,
  signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';

// One true config (exact values matter)
const firebaseConfig = {
  apiKey: "AIzaSyDHDJHrnQ2IwvetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio",
  storageBucket: "yangerila-studio.appspot.com",     // ✅ not firebasestorage.app
  messagingSenderId: "585529190595",
  appId: "1:585529190595:web:755d5834949c3b30f9a76",
  measurementId: "G-39S837X9BB"                     // ✅ not G-39S037X9BB
};

// Initialize once
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// (…rest of your login code stays the same…)


// Debug: verify both pages use the SAME project
console.log('[FB] projectId:', app.options.projectId);
console.log('[FB] appId:', app.options.appId);

// --- Select elements ---
const form = document.querySelector('#login-form');
const emailEl = document.querySelector('#email');
const passEl = document.querySelector('#password');
const rememberEl = document.querySelector('#remember');
const errorEl = document.querySelector('#error');
const forgotBtn = document.querySelector('#forgot');
const resetTpl = document.querySelector('#reset-template');

function showError(msg) {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.style.visibility = 'visible';
  errorEl.focus?.();
}

// --- If already signed in & authorised → send to /admin ---
onAuthStateChanged(auth, async (user) => {
  if (!user) return; // stay on login

  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (snap.exists()) {
      console.log('✅ Admin detected on login page; redirecting to /admin/');
      window.location.replace('/admin/');      // replace() avoids back/forward ping-pong
    } else {
      console.warn('Signed in but not in admins; stay on login.');
      showError('Signed in but not authorised for admin access.');
    }
  } catch (e) {
    console.error('Admin check failed on login page:', e);
    showError('Could not verify access. Please try again.');
  }
});

// --- Handle sign-in form submit ---
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  const btn = document.querySelector('#login-btn');
  if (btn) btn.disabled = true;

  try {
    await setPersistence(auth, rememberEl?.checked ? browserLocalPersistence : browserSessionPersistence);
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // ✅ UID-based admin check (admins/{uid})
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (!adminDoc.exists()) {
      await signOut(auth); // prevent stuck signed-in non-admin state
      showError('This account is not authorised for admin access.');
      return;
    }

    window.location.replace('/admin/');
  } catch (err) {
    console.error('[Login error]', err);
    showError(normaliseError(err));
  } finally {
    if (btn) btn.disabled = false;
  }
});

// --- Forgot password flow ---
forgotBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const node = resetTpl.content.cloneNode(true);
  document.body.appendChild(node);

  const box = document.querySelector('.reset-box');
  const emailInput = document.querySelector('#reset-email');
  const msg = document.querySelector('#reset-msg');
  const send = document.querySelector('#reset-send');
  const cancel = document.querySelector('#reset-cancel');

  emailInput.value = emailEl.value;

  send.addEventListener('click', async () => {
    msg.textContent = '';
    try {
      await sendPasswordResetEmail(auth, emailInput.value.trim());
      msg.style.color = 'var(--accent)';
      msg.textContent = 'If an account exists for this email, a reset link has been sent.';
    } catch (err) {
      msg.style.color = 'var(--error)';
      msg.textContent = normaliseError(err);
    }
  });

  cancel.addEventListener('click', () => box.remove());
});

// --- Error message mapping ---
function normaliseError(err) {
  const code = (err && err.code) || '';
  const msg = (err && err.message) || '';

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password.';
  }
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (msg === 'not-authorised') return 'This account is not authorised for admin access.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
  if (code === 'auth/operation-not-allowed') return 'Email/Password sign-in is not enabled for this project.';
  if (code === 'auth/unauthorized-domain' || code === 'auth/domain-not-allowed') return 'This domain is not allowed. Add your domain in Firebase Authentication settings.';

  return 'Sorry, could not sign you in. Please try again.';
}
