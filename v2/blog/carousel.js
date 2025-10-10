// /blog/carousel.js
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDHDjHrnQ2IwvetQoV6cWAGnkMzANerVDE",
  authDomain: "yangerila-studio.firebaseapp.com",
  projectId: "yangerila-studio"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

// helpers
const qsa=(r,s)=>Array.from(r.querySelectorAll(s));
const qs=(r,s)=>r.querySelector(s);
const ts=t=>t?.seconds? t.seconds*1000:0;
const fmt=t=>t?.seconds? new Date(t.seconds*1000).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'';
const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// data
async function fetchLatest(limit=8){
  // If "published" filter causes any hiccup, we’ll still render drafts for debugging:
  try{
    const qRef = query(collection(db,'blogs'), where('published','==',true));
    const snap = await getDocs(qRef);
    const arr = []; snap.forEach(d=>arr.push({id:d.id, ...d.data()}));
    arr.sort((a,b)=> ts(b.publishedAt||b.updatedAt) - ts(a.publishedAt||a.updatedAt));
    return arr.slice(0, limit);
  }catch(e){
    console.warn('published filter failed, falling back:', e);
    const snap = await getDocs(collection(db,'blogs'));
    const arr = []; snap.forEach(d=>arr.push({id:d.id, ...d.data()}));
    arr.sort((a,b)=> ts(b.publishedAt||b.updatedAt) - ts(a.publishedAt||a.updatedAt));
    return arr.slice(0, limit);
  }
}

async function buildCarousel(root){
  const limit    = Number(root.dataset.limit || 8);
  const interval = Math.max(0, Number(root.dataset.autoplay ?? 6000));
  const BLOG_URL = root.dataset.blogUrl || (location.hostname.includes('yangerila.com') ? 'https://www.yangerila.com/blog/' : '/blog/');

  const track   = qs(root,'.yc-track');
  const dotsBox = qs(root,'.yc-dots');
  const prevBtn = qs(root,'.yc-prev');
  const nextBtn = qs(root,'.yc-next');

  // status line
  const status = document.createElement('div');
  status.className = 'yc-status';
  status.textContent = 'Loading latest posts…';
  track.replaceChildren(status);

  let posts=[];
  try{
    posts = await fetchLatest(limit);
  }catch(err){
    console.error(err);
    status.textContent = 'Error loading posts. Check console.';
    return;
  }

  if(!posts.length){
    status.textContent = 'No posts found. Publish a post in the Blog Editor.';
    return;
  }

  // render slides
  track.innerHTML = posts.map(p=>`
    <li class="yc-card" data-id="${p.id}">
      ${p.imageUrl ? `<img class="yc-cover" src="${esc(p.imageUrl)}" alt="${esc(p.title||'')}" loading="lazy">` : `<div class="yc-cover" style="min-height:140px"></div>`}
      <div class="yc-body">
        <h5 class="yc-title">${esc(p.title||'Untitled')}</h5>
        <div class="yc-meta" style="color:#b7deda; font-size:12px; margin-bottom:8px">
          ${fmt(p.publishedAt||p.updatedAt)}
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

  // dots
  dotsBox.innerHTML = posts.map((_,i)=>`<button class="yc-dot" data-i="${i}" aria-label="Go to slide ${i+1}"></button>`).join('');

  // events
  let active=0, timer;
  const cards = qsa(track,'.yc-card');
  const dots  = qsa(dotsBox,'.yc-dot');

  function setActive(i, smooth=true){
    active = (i + cards.length) % cards.length;
    cards.forEach((el,j)=>el.classList.toggle('active', j===active));
    dots.forEach((d,j)=>d.classList.toggle('active', j===active));
    const card = cards[active];
    const offset = card.offsetLeft - (track.clientWidth - card.clientWidth)/2 + 8;
    track.scrollTo({left: offset, behavior: smooth ? 'smooth' : 'auto'});
    restart();
  }

  function auto(){ if(interval>0){ stop(); timer=setInterval(()=>setActive(active+1), interval); } }
  function stop(){ if(timer) clearInterval(timer); }
  function restart(){ stop(); auto(); }

  cards.forEach((c,i)=>c.addEventListener('click',()=>setActive(i)));
  dots.forEach(d=>d.addEventListener('click',e=>setActive(+e.currentTarget.dataset.i)));
  prevBtn.addEventListener('click',()=>setActive(active-1));
  nextBtn.addEventListener('click',()=>setActive(active+1));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', auto);

  setActive(0,false);
  auto();
}

// boot even if script inserted late
function boot(){
  document.querySelectorAll('.yc-blog-carousel').forEach(buildCarousel);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

export { buildCarousel };
