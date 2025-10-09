// =========================
//  Yangerila Admin Login
//  /login/app.js  (ES module)
// =========================

// --- Correct Firebase CDN imports for browser usage (no bundler) ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence,
  signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';

// --- One true Firebase config (same in /admin/index.html) ---
const firebaseConfig = {
  apiKey: "AIzaSyDHDJHrnQ2IwvetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio",
  storageBucket: "yangerila-studio.appspot.com",
  messagingSenderId: "585529190595",
  appId: "1:585529190595:web:755d5834949c3b30f9a76",
  measurementId: "G-39S837X9BB"
};

// --- Initialize BEFORE any references to `app` ---
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// (Optional) debug: confirm you’re on the right project & key
console.log('[FB] projectId:', app.options.projectId);
console.log('[FB] appId:', app.options.appId);
console.log('[FB] apiKey:', app.options.apiKey);

// ---------- DOM Elements ----------
const form       = document.querySelector('#login-form');
const emailEl    = document.querySelector('#email');
const passEl     = document.querySelector('#password');
const rememberEl = document.querySelector('#remember');
const errorEl    = document.querySelector('#error');
const loginBtn   = document.querySelector('#login-btn');
const forgotBtn  = document.querySelector('#forgot');
const resetTpl   = document.querySelector('#reset-template');

// ---------- Helpers ----------
function showError(msg) {
  if (!errorEl) { alert(msg); return; }
  errorEl.textContent = msg;
  errorEl.style.visibility = 'visible';
  errorEl.setAttribute('role', 'alert');
}

function clearError() {
  if (!errorEl) return;
  errorEl.textContent = '';
  errorEl.style.visibility = 'hidden';
  errorEl.removeAttribute('role');
}

function normaliseError(err) {
  const code = (err && err.code) || '';
  const msg  = (err && err.message) || '';

  const map = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found for this email.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled for this project.',
    'auth/unauthorized-domain': 'This domain is not allowed. Add it in Firebase Auth → Settings → Authorized domains.',
    'auth/domain-not-allowed': 'This domain is not allowed. Add it in Firebase Auth → Settings → Authorized domains.',
    'auth/invalid-api-key': 'Project configuration is invalid. Check your Firebase apiKey.',
    'auth/configuration-not-found': 'Project configuration not found. Verify your Firebase config.'
  };

  return map[code] || `Sign-in error: ${code || msg || 'Unknown error'}`;
}

// UID-based admin check: admins/{uid} must exist
async function isAdminByUID(uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists();
}

// ---------- Already signed-in? Route appropriately ----------
onAuthStateChanged(auth, async (user) => {
  // If not signed in, stay on login page
  if (!user) return;

  try {
    const ok = await isAdminByUID(user.uid);
    if (ok) {
      console.log('✅ Admin detected on login page; redirecting to /admin/');
      window.location.replace('/admin/'); // replace() avoids back/forward loop
    } else {
      console.warn('Signed in but not in admins; signing out.');
      await signOut(auth);
      showError('This account is not authorised for admin access.');
    }
  } catch (e) {
    console.error('Admin check failed on login page:', e);
    showError('Could not verify access. Please try again.');
  }
});

// ---------- Handle sign-in submit ----------
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const email = (emailEl?.value || '').trim();
  const password = passEl?.value || '';

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  try {
    if (loginBtn) loginBtn.disabled = true;

    // Remember me → local; otherwise session
    await setPersistence(auth, rememberEl?.checked ? browserLocalPersistence : browserSessionPersistence);

    // Sign in via email+password
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // ✅ UID-based admin check
    const ok = await isAdminByUID(user.uid);
    if (!ok) {
      await signOut(auth); // prevent a stuck signed-in non-admin session
      showError('This account is not authorised for admin access.');
      return;
    }

    // Success → go to admin
    window.location.replace('/admin/');
  } catch (err) {
    console.error('[Login error]', err);
    showError(normaliseError(err));
  } finally {
    if (loginBtn) loginBtn.disabled = false;
  }
});

// ---------- Forgot password flow ----------
forgotBtn?.addEventListener('click', (e) => {
  e.preventDefault();

  // If a <template id="reset-template"> exists in your HTML, use it
  if (resetTpl?.content) {
    const node = resetTpl.content.cloneNode(true);
    document.body.appendChild(node);

    const box   = document.querySelector('.reset-box');
    const email = document.querySelector('#reset-email');
    const msg   = document.querySelector('#reset-msg');
    const send  = document.querySelector('#reset-send');
    const cancel= document.querySelector('#reset-cancel');

    if (emailEl?.value) email.value = emailEl.value;

    send.addEventListener('click', async () => {
      msg.textContent = '';
      try {
        await sendPasswordResetEmail(auth, (email.value || '').trim());
        msg.style.color = 'var(--accent)';
        msg.textContent = 'If an account exists for this email, a reset link has been sent.';
      } catch (err) {
        msg.style.color = 'var(--error)';
        msg.textContent = normaliseError(err);
      }
    });

    cancel.addEventListener('click', () => box.remove());
    return;
  }

  // Fallback: simple prompt-based reset if no template exists
  const addr = window.prompt('Enter your email for password reset:', emailEl?.value || '');
  if (!addr) return;
  sendPasswordResetEmail(auth, addr.trim())
    .then(() => alert('If an account exists for this email, a reset link has been sent.'))
    .catch((err) => alert(normaliseError(err)));
});

// ---------- End of file ----------
