// /blog/carousel.js
// Auto-inits any element with class "yc-blog-carousel".
// Options per carousel via data-attributes:
//   data-limit="8"         -> number of posts to fetch
//   data-autoplay="6000"   -> ms between slides (0 disables)
//   data-blog-url="/blog/" -> Read more destination

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase init (safe if app already exists)
const firebaseConfig = {
  apiKey: "AIzaSyDHDjHrnQ2IwvetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

// Helpers
const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));
const qs  = (root, sel) => root.querySelector(sel);
const ts  = t => (t?.seconds ? t.seconds * 1000 : 0);
const fmt = t => (t?.seconds ? new Date(t.seconds*1000).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '');
const esc = (s='') => String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = n => (Number(n||0)>0?Number(n):0);

// Data
async function fetchLatest(limit=8){
  const qRef = query(collection(db,'blogs'), where('published','==',true));
  const snap = await getDocs(qRef);
  const arr = []; snap.forEach(d => arr.push({ id:d.id, ...d.data() }));
  arr.sort((a,b)=> ts(b.publishedAt||b.updatedAt) - ts(a.publishedAt||a.updatedAt));
  return arr.slice(0, limit);
}

// Build one carousel
async function buildCarousel(root){
  const limit    = Number(root.dataset.limit || 8);
  const interval = Math.max(0, Number(root.dataset.autoplay ?? 6000));
  const BLOG_URL = root.dataset.blogUrl || (location.hostname.includes('yangerila.com') ? 'https://www.yangerila.com/blog/' : '/blog/');

  const track   = qs(root,'.yc-track');
  const dotsBox = qs(root,'.yc-dots');
  const prevBtn = qs(root,'.yc-prev');
  const nextBtn = qs(root,'.yc-next');

  let posts = [];
  let active = 0;
  let timer;

  try { posts = await fetchLatest(limit); } catch(e){ console.error('Carousel load error', e); }
  if(!posts.length){ track.innerHTML = '<li style="color:#b7deda;padding:18px">No posts yet.</li>'; return; }

  // Slides
  track.innerHTML = posts.map(p => `
    <li class="yc-card" data-id="${p.id}">
      ${p.imageUrl ? `<img class="yc-cover" src="${esc(p.imageUrl)}" alt="${esc(p.title||'')}" loading="lazy">` : `<div class="yc-cover"></div>`}
      <div class="yc-body">
        <h5 class="yc-title">${esc(p.title||'Untitled')}</h5>
        <div class="yc-meta">
          <span>${fmt(p.publishedAt||p.updatedAt)}</span>${num(p.views)?`<span>${num(p.views)} views</span>`:''}
        </div>
        <p class="yc-excerpt">${esc(p.shortText||'')}</p>
        <div class="yc-tags">${(p.tags||[]).slice(0,4).map(t=>`<span class="yc-tag">${esc(t)}</span>`).join('')}</div>
        <div class="yc-actions">
          <a class="yc-read" href="${BLOG_URL}" target="_blank" rel="noopener">
            Read more
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><path stroke-width="2" d="M5 12h14M13 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </li>
  `).join('');

  // Dots
  dotsBox.innerHTML = posts.map((_,i)=>`<button class="yc-dot" data-i="${i}" aria-label="Go to slide ${i+1}"></button>`).join('');

  // Events
  qsa(track,'.yc-card').forEach((card,i)=>card.addEventListener('click',()=>setActive(i)));
  qsa(dotsBox,'.yc-dot').forEach(dot=>dot.addEventListener('click',e=>setActive(+e.currentTarget.dataset.i)));
  prevBtn.addEventListener('click',()=>setActive(active-1));
  nextBtn.addEventListener('click',()=>setActive(active+1));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', auto);

  function setActive(i, smooth=true){
    active = (i + posts.length) % posts.length;
    qsa(track,'.yc-card').forEach((el,j)=>el.classList.toggle('active', j===active));
    qsa(dotsBox,'.yc-dot').forEach((d,j)=>d.classList.toggle('active', j===active));
    const card = track.children[active];
    const offset = card.offsetLeft - (track.parentElement.clientWidth - card.clientWidth)/2 + 8;
    track.scrollTo({ left: offset, behavior: smooth ? 'smooth' : 'auto' });
    restart();
  }
  function auto(){ if(interval>0){ stop(); timer = setInterval(()=>setActive(active+1), interval); } }
  function stop(){ if(timer) clearInterval(timer); }
  function restart(){ stop(); auto(); }

  setActive(0,false);
  auto();
}

// Auto-init all carousels on the page (works even if script loads late)
function boot(){
  const carousels = qsa(document, '.yc-blog-carousel');
  carousels.forEach(root => buildCarousel(root));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Optional export if you want manual control elsewhere
export { buildCarousel };
