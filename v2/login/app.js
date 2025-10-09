// Firebase CDN imports (v10.12.2)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence,
  signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// 1) >>> PASTE THE EXACT SAME WORKING CONFIG HERE <<< (same as admin)
 const firebaseConfig = {
    apiKey: "AIzaSyDHDjHrnQ2IwwetQoV6cWAGnkMzANerVDE",
    authDomain: "yangerila-studio.firebaseapp.com",
    projectId: "yangerila-studio",
    storageBucket: "yangerila-studio.firebasestorage.app",
    messagingSenderId: "585529190595",
    appId: "1:585529190595:web:7555d8334949c3b30f9a76",
    measurementId: "G-39S037X9BB"
  };


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Already signed-in? → check admin and redirect
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const snap = await getDoc(doc(db, 'admins', user.uid));
  if (snap.exists()) window.location.replace('/admin/');
  else { await signOut(auth); alert('This account is not authorised for admin access.'); }
});

// Handle login
const form       = document.querySelector('#login-form');
const emailEl    = document.querySelector('#email');
const passEl     = document.querySelector('#password');
const rememberEl = document.querySelector('#remember');
const errorEl    = document.querySelector('#error');
const loginBtn   = document.querySelector('#login-btn');

function showError(msg){ if(!errorEl){alert(msg);return;} errorEl.textContent=msg; errorEl.style.visibility='visible'; }
function clearError(){ if(!errorEl) return; errorEl.textContent=''; errorEl.style.visibility='hidden'; }

form?.addEventListener('submit', async (e) => {
  e.preventDefault(); clearError();
  const email = (emailEl?.value || '').trim();
  const password = passEl?.value || '';
  if (!email || !password) return showError('Please enter your email and password.');

  try {
    loginBtn && (loginBtn.disabled = true);
    await setPersistence(auth, rememberEl?.checked ? browserLocalPersistence : browserSessionPersistence);
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const ok = (await getDoc(doc(db, 'admins', user.uid))).exists();
    if (!ok) { await signOut(auth); return showError('This account is not authorised for admin access.'); }
    window.location.replace('/admin/');
  } catch (err) {
    console.error('[Login error]', err);
    showError((err && (err.message || err.code)) || 'Login failed.');
  } finally {
    loginBtn && (loginBtn.disabled = false);
  }
});
