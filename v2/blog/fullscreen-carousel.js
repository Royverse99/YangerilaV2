// /blog/fullscreen-carousel.js
// Fullscreen carousel that fetches latest published posts and rotates through them.
// Clicking a slide focuses it; floating "View blog" button opens /blog/ (or a custom URL).

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ---- Firebase (init once) ----
const firebaseConfig = {
  apiKey: "AIzaSyDHDjHrnQ2IwvetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ---- DOM refs ----
const root   = document.getElementById('yc-fs-carousel');
const track  = document.getElementById('ycTrack');
const dotsEl = document.getElementById('ycDots');
const prev   = root.querySelector('.yc-prev');
const next   = root.querySelector('.yc-next');
const fab    = document.getElementById('ycFab');
const blogURL = '/blog/';     // change to full domain if you want

// ---- state ----
let posts = [];
let active = 0;
let timer  = 0;
const interval = 6000;        // ms between slides (0 disables autoplay)
const LIMIT    = 10;          // max posts to pull

// ---- helpers ----
const esc = s => String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ts  = t => (t?.seconds ? t.seconds * 1000 : 0);
const fmt = t => t?.seconds ? new Date(t.seconds*1000).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '';

// ---- fetch ----
async function fetchLatest(limit=LIMIT){
  try{
    const qRef = query(collection(db,'blogs'), where('published','==',true));
    const snap = await getDocs(qRef);
    const arr = [];
    snap.forEach(d => arr.push({ id:d.id, ...d.data() }));
    arr.sort((a,b)=> ts(b.publishedAt||b.updatedAt) - ts(a.publishedAt||a.updatedAt));
    return arr.slice(0, limit);
  }catch(e){
    console.error('Failed to load blogs:', e);
    return [];
  }
}

// ---- render ----
function renderSlides(list){
  if(!list.length){
    track.innerHTML = `<li class="yc-status">No posts found. Publish a post in the editor.</li>`;
    return;
  }
  track.innerHTML = list.map(p => `
    <li class="yc-card" data-id="${p.id}">
      ${p.imageUrl ? `<img class="yc-cover" src="${esc(p.imageUrl)}" alt="${esc(p.title||'')}" loading="lazy">` : `<div class="yc-cover"></div>`}
      <div class="yc-body">
        <h2 class="yc-title">${esc(p.title || 'Untitled')}</h2>
        <div class="yc-meta">${fmt(p.publishedAt || p.updatedAt)}</div>
        <p class="yc-excerpt">${esc(p.shortText || '')}</p>
        <div class="yc-tags">${(p.tags||[]).slice(0,5).map(t=>`<span class="yc-tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </li>
  `).join('');
  // card click -> focus
  Array.from(track.children).forEach((el,i)=> el.addEventListener('click', ()=> setActive(i)));
}

function renderDots(n){
  dotsEl.innerHTML = Array.from({length:n}, (_,i)=>`<button class="yc-dot" data-i="${i}" aria-label="Go to slide ${i+1}"></button>`).join('');
  dotsEl.querySelectorAll('.yc-dot').forEach(d => d.addEventListener('click', e => setActive(+e.currentTarget.dataset.i)));
}

// ---- behavior ----
function centerActive(smooth=true){
  const card = track.children[active];
  if(!card) return;
  const offset = card.offsetLeft - (track.clientWidth - card.clientWidth)/2;
  track.scrollTo({ left: Math.max(0, offset), behavior: smooth ? 'smooth' : 'auto' });
}

function setActive(i, smooth=true){
  if(!posts.length) return;
  active = (i + posts.length) % posts.length;
  Array.from(track.children).forEach((el,j)=> el.classList.toggle('active', j===active));
  dotsEl.querySelectorAll('.yc-dot').forEach((d,j)=> d.classList.toggle('active', j===active));
  centerActive(smooth);
  restart();
  // keep the “View blog” button visible
  fab.style.opacity = 1;
  fab.querySelector('.yc-read').setAttribute('href', blogURL);
}

function auto(){ if(interval>0){ stop(); timer = setInterval(()=> setActive(active+1), interval); } }
function stop(){ if(timer){ clearInterval(timer); timer=0; } }
function restart(){ stop(); auto(); }

// Keyboard + swipe
function onKey(e){
  if(e.key === 'ArrowLeft')  setActive(active-1);
  if(e.key === 'ArrowRight') setActive(active+1);
}
let touchX=0;
track.addEventListener('touchstart', e => touchX = e.touches[0].clientX, {passive:true});
track.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if(Math.abs(dx) > 40) setActive(active + (dx < 0 ? 1 : -1));
}, {passive:true});

// Prev/Next
prev.addEventListener('click', ()=> setActive(active-1));
next.addEventListener('click', ()=> setActive(active+1));
// Pause on hover (desktop)
root.addEventListener('mouseenter', stop);
root.addEventListener('mouseleave', auto);
window.addEventListener('keydown', onKey);

// ---- init ----
(async function init(){
  posts = await fetchLatest(LIMIT);
  renderSlides(posts);
  renderDots(posts.length);
  setActive(0, false);
  auto();
})();
