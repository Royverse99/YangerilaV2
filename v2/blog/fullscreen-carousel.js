// /blog/fullscreen-carousel.js
// Fullscreen carousel with: no bottom scrollbar, auto-rotate, click-to-focus (engaged mode)
// Shows "View blog" below the focused card; click anywhere outside to collapse.

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ---- Firebase (init) ---- */
const firebaseConfig = {
  apiKey: "AIzaSyDHDjHrnQ2IwvetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ---- DOM ---- */
const root   = document.getElementById('yc-fs-carousel');
const trackWrap = document.createElement('div');
trackWrap.className = 'yc-track-wrap';
const track  = document.getElementById('ycTrack');
track.parentNode.replaceChild(trackWrap, track);
trackWrap.appendChild(track);

const dotsEl = document.getElementById('ycDots');
const prev   = root.querySelector('.yc-prev');
const next   = root.querySelector('.yc-next');

/* Below-card read button bar */
const readBar = document.createElement('div');
readBar.className = 'yc-readbar';
readBar.innerHTML = `
  <a class="yc-read" href="/blog/" target="_self" aria-label="Open blog index">
    View blog
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
      <path stroke-width="2" d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  </a>
`;
root.insertBefore(readBar, dotsEl); // ensure bar is above dots, below track

/* ---- State ---- */
let posts = [];
let active = 0;
let timer  = 0;
let engaged = false;          // when true: button shown, autoplay paused
const interval = 6000;        // ms between slides (0 disables)
const LIMIT    = 10;

/* ---- Helpers ---- */
const esc = s => String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ts  = t => (t?.seconds ? t.seconds * 1000 : 0);
const fmt = t => t?.seconds ? new Date(t.seconds*1000).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '';

function centerActive(smooth=true){
  const card = track.children[active];
  if(!card) return;
  const left = card.offsetLeft + (card.clientWidth/2);
  const target = Math.max(0, left - (track.clientWidth/2));
  track.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
}

/* ---- Data ---- */
async function fetchLatest(limit=LIMIT){
  try{
    const qRef = query(collection(db,'blogs'), where('published','==',true));
    const snap = await getDocs(qRef);
    const arr = []; snap.forEach(d => arr.push({ id:d.id, ...d.data() }));
    arr.sort((a,b)=> ts(b.publishedAt||b.updatedAt) - ts(a.publishedAt||a.updatedAt));
    return arr.slice(0, limit);
  }catch(e){
    console.error('Failed to load blogs:', e);
    return [];
  }
}

/* ---- Render ---- */
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
  // attach click → engage
  Array.from(track.children).forEach((el,i)=> el.addEventListener('click', (e)=> {
    e.stopPropagation();        // don't bubble to outside click
    engage(i);
  }));
}

function renderDots(n){
  dotsEl.innerHTML = Array.from({length:n}, (_,i)=>`<button class="yc-dot" data-i="${i}" aria-label="Go to slide ${i+1}"></button>`).join('');
  dotsEl.querySelectorAll('.yc-dot').forEach(d => d.addEventListener('click', e => {
    e.stopPropagation();
    engage(+e.currentTarget.dataset.i);
  }));
}

/* ---- Behavior ---- */
function setActive(i, smooth=true){
  if(!posts.length) return;
  active = (i + posts.length) % posts.length;
  Array.from(track.children).forEach((el,j)=> el.classList.toggle('active', j===active));
  dotsEl.querySelectorAll('.yc-dot').forEach((d,j)=> d.classList.toggle('active', j===active));
  centerActive(smooth);
}

function auto(){ if(interval>0 && !engaged){ stop(); timer = setInterval(()=> setActive(active+1), interval); } }
function stop(){ if(timer){ clearInterval(timer); timer=0; } }

function engage(i){
  setActive(i);
  engaged = true;
  stop();
  readBar.style.display = 'grid';
}

function disengage(){
  engaged = false;
  readBar.style.display = 'none';
  auto();
}

/* Prev/Next */
prev.addEventListener('click', (e)=>{ e.stopPropagation(); engaged ? engage(active-1) : setActive(active-1); });
next.addEventListener('click', (e)=>{ e.stopPropagation(); engaged ? engage(active+1) : setActive(active+1); });

/* Outside click collapses */
document.addEventListener('click', (e)=>{
  const inside = root.contains(e.target);
  const inTrack = track.contains(e.target);
  if(inside && !inTrack && engaged){
    disengage();
  }
});

/* Keyboard + swipe */
function onKey(e){
  if(e.key === 'Escape' && engaged) return disengage();
  if(e.key === 'ArrowLeft')  engaged ? engage(active-1) : setActive(active-1);
  if(e.key === 'ArrowRight') engaged ? engage(active+1) : setActive(active+1);
}
window.addEventListener('keydown', onKey);

let touchX=0;
track.addEventListener('touchstart', e => touchX = e.touches[0].clientX, {passive:true});
track.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if(Math.abs(dx) > 40) (engaged ? engage : setActive)(active + (dx < 0 ? 1 : -1));
}, {passive:true});

/* Hover pause on desktop */
root.addEventListener('mouseenter', ()=> !engaged && stop());
root.addEventListener('mouseleave', ()=> !engaged && auto());

/* ---- init ---- */
(async function init(){
  posts = await fetchLatest(LIMIT);
  renderSlides(posts);
  renderDots(posts.length);
  setActive(0, false);
  auto();
})();


/* ----- keep things centered on resize / rotate ----- */
let resizeTimer = 0;
function reCenterSoon(){
  if(resizeTimer) cancelAnimationFrame(resizeTimer);
  resizeTimer = requestAnimationFrame(()=> {
    // Recenter without animation to avoid seasick effect during resize
    const smooth = false;
    // If you're in engaged mode, keep that feel; else just center
    (engaged ? engage : setActive)(active, smooth);
  });
}

window.addEventListener('resize', reCenterSoon);
window.addEventListener('orientationchange', reCenterSoon);
