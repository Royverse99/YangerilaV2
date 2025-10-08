// Firebase Admin Login
// --- Replace with your own Firebase project config ---
const firebaseConfig = {
  apiKey: "AIzaSyDHDjHrnQ2IwwetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio",
  storageBucket: "yangerila-studio.firebasestorage.app",
  messagingSenderId: "585529190595",
  appId: "1:585529190595:web:7555d8334949c3b30f9a76",
  measurementId: "G-39S037X9BB"
};


import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence,
  signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ---------- Init ----------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.querySelector('#login-form');
const emailEl = document.querySelector('#email');
const passEl = document.querySelector('#password');
const rememberEl = document.querySelector('#remember');
const errorEl = document.querySelector('#error');
const forgotBtn = document.querySelector('#forgot');
const resetTpl = document.querySelector('#reset-template');

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.visibility = 'visible';
  errorEl.focus?.();
}

// Redirect if already signed in & admin
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (snap.exists()) {
      window.location.assign('/admin/'); // change if needed
    }
  } catch (e) {
    console.error(e);
  }
});

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
  btn.disabled = true;

  try {
    await setPersistence(auth, rememberEl.checked ? browserLocalPersistence : browserSessionPersistence);
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // Check admin list in Firestore
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (!adminDoc.exists()) {
      throw new Error('not-authorised'); // custom flag we’ll map below
    }

    window.location.assign('/admin/');
  } catch (err) {
    console.error('[Login error]', err);
    showError(normaliseError(err));
  } finally {
    btn.disabled = false;
  }
});

// Forgot password flow
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

function normaliseError(err) {
  const code = (err && err.code) || '';
  const msg = (err && err.message) || '';

  // Wrong email or password (new unified error)
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
      msg.style.color = 'var(--lime)';
      msg.textContent = 'If an account exists for this email, a reset link has been sent.';
    } catch (err) {
      msg.style.color = 'var(--error)';
      msg.textContent = normaliseError(err);
    }
  });
  cancel.addEventListener('click', () => box.remove());
});

function normaliseError(err){
  const code = err?.code || '';
  if (code.includes('invalid-email')) return 'Please enter a valid email address.';
  if (code.includes('user-not-found') || code.includes('wrong-password')) return 'Incorrect email or password.';
  if (err?.message?.includes('not authorised')) return 'This account is not authorised for admin access.';
  return 'Sorry, could not sign you in. Please try again.';
}
