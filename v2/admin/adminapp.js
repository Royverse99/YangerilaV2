/* admin/adminapp.js — ADMIN-ONLY (login has its own app.js) */

/* Firebase CDN (same version as login) */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ===== Firebase config (keep exactly as your working setup) ===== */
const firebaseConfig = {
  apiKey: "AIzaSyDHDjHrnQ2IwwetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio",
  storageBucket: "yangerila-studio.firebasestorage.app",
  messagingSenderId: "585529190595",
  appId: "1:585529190595:web:7555d8334949c3b30f9a76",
  measurementId: "G-39S037X9BB"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ===== Apps Script endpoint (confirmed) ===== */
const API_URL   = 'https://script.google.com/macros/s/AKfycbxlVwjnyNFfKJXOG3lJeYbF5_7ZVa6srhvByly6I3I8lyTW-PvHThosGTryRQOsqJMxTg/exec';
const API_TOKEN = 'yngrla_6f3c1f9b4e2a47b2b1c9d0f8d7a6c5e4';

/* ===== Tab names (must match Google sub-sheets) ===== */
const TABS = {
  COUPON:  'Coupon Forms Data',
  ADM_DEMO:'Admission & Demo Form Data',
  CONTACT:'Contact Us Form Data',
  YCS:     'YCS Admissions'
};

/* ===== UI-only column hides for Web CRM tables ===== */
const HIDE = {
  [TABS.COUPON]:  new Set(['Name', 'Email', 'Phone', 'Message']),
  [TABS.ADM_DEMO]: new Set(['Email', 'Message']),
  [TABS.CONTACT]: new Set(['Email'])
  // YCS uses an explicit whitelist below
};

/* ===== YCS visible fields (exact order/labels you provided) ===== */
const YCS_FIELDS = [
  'Timestamp (IST)',
  'Full Name',
  'Phone',
  'Age',
  'City',
  'Email',
  'Have you learned guitar before?',
  'Do you have a guitar?',
  'Preferred Class Mode',
  'How did you hear about us?',
  'Course Selected',
  'Course Fee (at time of form)',
  'Terms Accepted',
  'Additional Notes',
  'Payment Ref / Filename',
  'Payment Screenshot URL'
];

/* ===== Elements ===== */
const emailEl = document.getElementById('user-email');
document.getElementById('signout')?.addEventListener('click', async () => {
  await signOut(auth);
  location.replace('/login/');
});

/* ===== Auth gate ===== */
let booted = false;
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById('loading')?.remove();
    location.replace('/login/');
    return;
  }
  emailEl.textContent = user.email || '';

  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (!adminSnap.exists()) {
      await signOut(auth);
      alert('Access denied: this account is not an admin.');
      location.replace('/login/');
      return;
    }
  } catch (e) {
    failUI('Admin check failed: ' + (e?.message || e));
    return;
  }

  if (booted) return;
  booted = true;
  document.getElementById('loading')?.remove();

  await fetchAndRenderAll();
  hookRefreshers();
  await loadBlogs();
});

/* ===== Refresh buttons ===== */
function hookRefreshers(){
  document.getElementById('refresh-coupon')?.addEventListener('click', fetchAndRenderAll);
  document.getElementById('refresh-admDemo')?.addEventListener('click', fetchAndRenderAll);
  document.getElementById('refresh-contact')?.addEventListener('click', fetchAndRenderAll);
  document.getElementById('refresh-ycs')?.addEventListener('click', fetchAndRenderAll);
}

/* ===== Helper: header-based YCS detection (if Source is missing/different) ===== */
function isLikelyYcsRow(row) {
  const keys = new Set(Object.keys(row).map(k => k.toLowerCase().trim()));
  let hits = 0;
  for (const label of YCS_FIELDS) {
    if (keys.has(label.toLowerCase().trim())) hits++;
  }
  // threshold: at least 6 matching YCS columns → treat as YCS
  return hits >= 6;
}

/* ===== Fetch all sheets & render ===== */
async function fetchAndRenderAll(){
  resetTable('table-coupon');
  resetTable('table-admDemo');
  resetTable('table-contact');
  resetTable('table-ycs');

  try{
    const url = `${API_URL}?token=${encodeURIComponent(API_TOKEN)}&limit=0`;
    const r = await fetch(url, { headers: { 'Accept':'application/json' } });
    const text = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0,200)}`);

    let data = JSON.parse(text);
    if (data.error) throw new Error(`API error: ${data.error}`);

    let rows = Array.isArray(data.leads) ? data.leads : [];

    // Convert Drive file links to direct view links (ignore host-relative paths)
    rows.forEach(o => {
      Object.keys(o).forEach(k => {
        const v = String(o[k] ?? '').trim();
        if (looksLikeImageUrl(v)) o[k] = normalizeDriveUrl(v);
      });
    });

    // Keep any row that isn't entirely empty
    rows = rows.filter(r => !isRowTotallyEmpty(r));

    // Group by Source (case-insensitive) with tolerant YCS detection
    const groupExact = (name) => rows.filter(x => (x.Source||'').toString().trim().toLowerCase() === name.toLowerCase());
    const coupon  = groupExact(TABS.COUPON);
    const admDemo = groupExact(TABS.ADM_DEMO);
    const contact = groupExact(TABS.CONTACT);

    const ycs = rows.filter(x => {
      const s = (x.Source || '').toString().trim().toLowerCase();
      if (s.includes('ycs admissions')) return true;
      return isLikelyYcsRow(x);
    });

    // Diagnostics
    console.log('[SOURCES]', histogramBySource(rows));
    console.log('[GROUPS]', { coupon: coupon.length, admDemo: admDemo.length, contact: contact.length, ycs: ycs.length });
    if (ycs.length) console.log('[YCS HEADERS]', Object.keys(ycs[0]));

    // WEB CRM tables → columns from first row minus hides
    renderTableSimple(coupon,  'table-coupon',  columnsMinus(coupon,  HIDE[TABS.COUPON]));
    renderTableSimple(admDemo, 'table-admDemo', columnsMinus(admDemo, HIDE[TABS.ADM_DEMO]));
    renderTableSimple(contact, 'table-contact', columnsMinus(contact, HIDE[TABS.CONTACT]));

    // YCS Admissions → render only your fields, in your order
    renderTableYCS(ycs, 'table-ycs');

    wireThumbnails();
    wireCopyButtons();
  }catch(err){
    console.error('[Sheets] fetch failed:', err);
    const msg = err?.message || String(err);
    setError('table-coupon',  msg);
    setError('table-admDemo', msg);
    setError('table-contact', msg);
    setError('table-ycs',     msg);
  }
}

/* ===== Deterministic columns ===== */
function columnsMinus(rows, hideSet){
  if (!rows || !rows.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.filter(k => k !== 'Source' && !(hideSet?.has(k)));
}

/* ===== YCS Admissions renderer (shows ONLY your fields, exact order) ===== */
function renderTableYCS(rows, tableId){
  const thead = document.querySelector(`#${tableId} thead`);
  const tbody = document.querySelector(`#${tableId} tbody`);

  if(!rows || !rows.length){
    thead.innerHTML = '';
    tbody.innerHTML = `<tr><td class="muted center">No rows</td></tr>`;
    return;
  }

  const first = rows[0];
  const actualKeys = Object.keys(first);

  const norm = s => String(s||'').toLowerCase().replace(/[\s_():\-]+/g,'').trim();
  const byNorm = new Map(actualKeys.map(k => [norm(k), k]));

  // Map each desired label → actual key (exact label match; minimal aliasing via normalization)
  const resolved = YCS_FIELDS.map(label => {
    const hit = byNorm.get(norm(label));
    return hit ? { label, key: hit } : { label, key: null }; // keep blank cell if missing
  });

  thead.innerHTML = `<tr>${resolved.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr>`;
  tbody.innerHTML = rows.map(r => {
    return `<tr>${
      resolved.map(c => {
        if (!c.key) return `<td class="tight"></td>`;
        return ycsCellHtml(c.key, r[c.key]);
      }).join('')
    }</tr>`;
  }).join('');
}

/* ===== Cell renderers ===== */
function ycsCellHtml(key, val){
  const v = String(val ?? '').trim();
  if (!v) return `<td class="tight"></td>`;

  // Google Drive file link → image; folder link → folder chip
  if (looksLikeImageUrl(v)) {
    if (/drive\.google\.com\/drive\/folders\//i.test(v)){
      return `<td class="tight"><a class="chip" href="${esc(v)}" target="_blank" rel="noopener">📁 Open folder</a></td>`;
    }
    const src = normalizeDriveUrl(v);
    return `<td class="tight"><img class="thumbnail" src="${esc(src)}" alt="${esc(key)}" data-full="${esc(src)}"></td>`;
  }

  if (/^https?:\/\//i.test(v)) {
    return `<td class="tight"><a class="link" href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a></td>`;
  }

  // Phone helpers
  if (['phone','mobile','contact','contact number','phone number'].includes(key.toLowerCase())) {
    const tel = sanitizePhone(v);
    return `<td class="tight">
      <span class="phone-bundle">
        <a class="icon-btn" href="tel:${esc(tel)}" title="Call">${svgPhone()}</a>
        <button class="icon-btn copy-btn" data-copy="${esc(v)}" title="Copy number">${svgCopy()}</button>
        <span class="phone-text">${esc(v)}</span>
      </span>
    </td>`;
  }

  return `<td class="tight">${esc(v)}</td>`;
}

/* ===== Generic table helpers ===== */
function resetTable(id){
  const thead = document.querySelector(`#${id} thead`);
  const tbody = document.querySelector(`#${id} tbody`);
  thead.innerHTML = '';
  tbody.innerHTML = `<tr><td class="muted center">Loading…</td></tr>`;
}
function setError(id, msg){
  const tbody = document.querySelector(`#${id} tbody`);
  tbody.innerHTML = `<tr><td class="center error">Failed to load: ${esc(msg)}</td></tr>`;
}
function renderTableSimple(rows, tableId, cols){
  const thead = document.querySelector(`#${tableId} thead`);
  const tbody = document.querySelector(`#${tableId} tbody`);

  if(!rows || !rows.length){
    thead.innerHTML = '';
    tbody.innerHTML = `<tr><td class="muted center">No rows</td></tr>`;
    return;
  }
  if (!cols || !cols.length) cols = Object.keys(rows[0]).filter(k => k !== 'Source');

  thead.innerHTML = `<tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>`;
  tbody.innerHTML = rows.map(r => `<tr>${cols.map(c => cellHtml(c, r[c])).join('')}</tr>`).join('');
}

function cellHtml(col, val){
  const v = String(val ?? '').trim();
  if(!v) return `<td class="tight"></td>`;

  // Phone helpers
  if (['phone','mobile','contact','contact number','phone number'].includes(col.toLowerCase())) {
    const tel = sanitizePhone(v);
    return `<td class="tight">
      <span class="phone-bundle">
        <a class="icon-btn" href="tel:${esc(tel)}" title="Call">${svgPhone()}</a>
        <button class="icon-btn copy-btn" data-copy="${esc(v)}" title="Copy number">${svgCopy()}</button>
        <span class="phone-text">${esc(v)}</span>
      </span>
    </td>`;
  }

  // Images (Google Drive file links → thumbnails; folders → chip)
  if (looksLikeImageUrl(v)) {
    if (/drive\.google\.com\/drive\/folders\//i.test(v)){
      return `<td class="tight"><a class="chip" href="${esc(v)}" target="_blank" rel="noopener">📁 Open folder</a></td>`;
    }
    const src = normalizeDriveUrl(v);
    return `<td class="tight"><img class="thumbnail" src="${esc(src)}" alt="${esc(col)}" data-full="${esc(src)}"></td>`;
  }

  // URLs
  if (/^https?:\/\//i.test(v)) {
    return `<td class="tight"><a class="link" href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a></td>`;
  }

  // Plain text
  return `<td class="tight">${esc(v)}</td>`;
}

/* ===== Filters & utils ===== */
function isRowTotallyEmpty(r){
  const isBlank = v => v == null || String(v).trim() === '';
  return Object.values(r).every(isBlank);
}
function sanitizePhone(raw){ const s=String(raw).trim(); const plus=s.startsWith('+'); const digits=s.replace(/[^\d]/g,''); return plus?('+'+digits):digits; }
function looksLikeImageUrl(s){
  if (!s) return false;
  if (!/^https?:\/\//i.test(s)) return false; // ignore site-hosted paths
  const u = s.toLowerCase();
  return u.includes('drive.google.com') || /\.(jpg|jpeg|png|gif|webp)(\?|$)/.test(u);
}
function normalizeDriveUrl(url){
  if (!/drive\.google\.com/i.test(url)) return url;
  if (/drive\.google\.com\/drive\/folders\//i.test(url)) return url; // folder → shown as chip
  let id = '';
  const m1 = url.match(/\/file\/d\/([^/]+)/);
  const m2 = url.match(/[?&]id=([^&]+)/);
  if (m1 && m1[1]) id = m1[1];
  if (!id && m2 && m2[1]) id = m2[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
}
function esc(s=''){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function histogramBySource(rows){
  const map = new Map();
  rows.forEach(r => {
    const s = (r.Source || '(none)').toString();
    map.set(s, (map.get(s) || 0) + 1);
  });
  return Object.fromEntries(map.entries());
}

/* ===== UI chrome ===== */
function wireThumbnails(){
  const modal = document.getElementById('imgModal');
  const img = modal.querySelector('img');
  modal.addEventListener('click', (e) => { if (e.target.classList.contains('close') || e.target === modal) modal.classList.remove('open'); });
  document.querySelectorAll('.thumbnail').forEach(t => {
    t.addEventListener('click', () => { img.src = t.getAttribute('data-full') || t.src; modal.classList.add('open'); });
  });
}
function wireCopyButtons(){
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      try{ await navigator.clipboard.writeText(text); showToast('Number copied'); }
      catch{ showToast('Copy failed'); }
    });
  });
}
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1200);
}
function failUI(msg){
  console.error('[ADMIN]', msg);
  document.getElementById('loading')?.remove();
  const host = document.querySelector('main') || document.body;
  const div = document.createElement('div');
  div.className = 'error-banner';
  div.textContent = msg;
  host.prepend(div);
}
function svgPhone(){ return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 5c0-1.1.9-2 2-2h2a1 1 0 0 1 1 .82l.5 3a1 1 0 0 1-.28.9l-1.2 1.2a15 15 0 0 0 6.36 6.36l1.2-1.2a1 1 0 0 1 .9-.28l3 .5a1 1 0 0 1 .82 1v2a2 2 0 0 1-2 2h-1C9.61 20 4 14.39 4 7V6a2 2 0 0 1 2-2H5c-1.1 0-2 .9-2 2z" stroke="currentColor" stroke-width="1.4"/></svg>`; }
function svgCopy(){ return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.4" opacity=".7"/></svg>`; }

/* ===== Blogs preview (unchanged) ===== */
async function loadBlogs() {
  const listEl = document.querySelector('#blog-list');
  if (!listEl) return;
  try {
    const snap = await getDocs(collection(db, 'blogs'));
    const items = []; snap.forEach(d => items.push({ id:d.id, ...d.data() }));
    if (!items.length) { await seedBlogs(); return loadBlogs(); }
    listEl.innerHTML = items.map(post => blogCard(post)).join('');
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `<div class="error">Failed to load blogs</div>`;
  }
}
function blogCard(p) {
  const img = p.imageUrl || 'https://images.unsplash.com/photo-1511376777868-611b54f68947?auto=format&fit=crop&w=800&q=80';
  const tags = (p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  return `<article class="blog-card">
    <img src="${esc(img)}" alt="${esc(p.title || 'Blog image')}" class="blog-img">
    <h3>${esc(p.title || 'Untitled')}</h3>
    <p class="muted">${esc(p.shortText || '')}</p>
    <div class="tags">${tags}</div>
  </article>`;
}
async function seedBlogs() {
  const items = [
    { title:'How to Choose Your First Electric Guitar', shortText:'Match your style, body size, and tone goals to the right model.', fullText:'...', imageUrl:'https://images.unsplash.com/photo-1511376777868-611b54f68947?auto=format&fit=crop&w=800&q=80', tags:['Guitar','Beginners','Tips'], publishedAt: serverTimestamp() },
    { title:'5 Daily Exercises to Improve Finger Strength', shortText:'Simple drills to build independence and control.', fullText:'...', imageUrl:'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=800&q=80', tags:['Practice','Technique'], publishedAt: serverTimestamp() },
    { title:'Recording Your First Guitar Track at Home', shortText:'Basics of recording, mic placement, and tone on a budget.', fullText:'...', imageUrl:'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', tags:['Recording','Home Studio'], publishedAt: serverTimestamp() }
  ];
  for (const post of items) await addDoc(collection(db, 'blogs'), post);
}
