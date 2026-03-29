/* ===================================================
   landing.js — Public Landing Page Logic
   Fulfilment International Academy
   =================================================== */

const SUPABASE_URL  = 'https://claveflibaousyaszsee.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYXZlZmxpYmFvdXN5YXN6c2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTcwODgsImV4cCI6MjA4ODg5MzA4OH0.0o-XX7WxXxsYi-OjgsZLJh1OsemlJRqGg3PVYQHTWvc';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ─── Courses ─── */
const COURSES = [
  'Business Administration', 'Computer Science', 'Data Analytics',
  'Digital Marketing', 'Education & Leadership', 'Engineering Technology',
  'Finance & Accounting', 'Healthcare Management', 'Human Resource Management',
  'International Relations', 'Law & Governance', 'Project Management',
  'Psychology', 'Supply Chain & Logistics',
];

/* ─── Typing animation ─── */
function typeWriter(el, texts, speed = 80, pause = 2200) {
  let textIdx = 0, charIdx = 0, deleting = false;
  function tick() {
    const current = texts[textIdx];
    el.textContent = deleting ? current.slice(0, charIdx--) : current.slice(0, charIdx++);
    let delay = deleting ? speed / 2 : speed;
    if (!deleting && charIdx > current.length) {
      delay = pause; deleting = true;
    } else if (deleting && charIdx < 0) {
      deleting = false; textIdx = (textIdx + 1) % texts.length; delay = 400;
    }
    setTimeout(tick, delay);
  }
  tick();
}

/* ─── Scroll-triggered reveal ─── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ─── Animated counter ─── */
function animateCounters() {
  const counters = document.querySelectorAll('.counter-num[data-target]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el     = e.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const dur    = 1800;
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / dur, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => obs.observe(el));
}

/* ─── Sticky navbar ─── */
function initNavbar() {
  const nav = document.querySelector('.land-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

/* ─── Smooth scroll ─── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

/* ─── Populate waitlist course dropdown ─── */
function populateWaitlistCourses() {
  const sel = document.getElementById('wlCourse');
  if (!sel) return;
  COURSES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
}

/* ─── Toast ─── */
function toast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3300);
}

/* ─── Waitlist form submit ─── */
function initWaitlistForm() {
  const form       = document.getElementById('waitlistForm');
  const formCard   = document.getElementById('waitlistFormCard');
  const successEl  = document.getElementById('waitlistSuccess');
  const submitBtn  = document.getElementById('wlSubmitBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name    = document.getElementById('wlName').value.trim();
    const email   = document.getElementById('wlEmail').value.trim();
    const phone   = document.getElementById('wlPhone').value.trim();
    const course  = document.getElementById('wlCourse').value;
    const message = document.getElementById('wlMessage').value.trim();

    if (!name || !email) { toast('Please enter your name and email.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Please enter a valid email.', 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Joining…';

    const { error } = await db.from('waitlist').insert([{ full_name: name, email, phone, course, message }]);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '🎓 Join the Waitlist';

    if (error) {
      toast('Something went wrong. Please try again.', 'error');
      return;
    }

    document.getElementById('wlSuccessName').textContent = name;
    formCard.style.display = 'none';
    successEl.classList.add('show');
  });
}

/* ─── Live enrolment ticker (optional) ─── */
async function loadLiveCount() {
  const el = document.getElementById('liveCount');
  if (!el) return;
  
  async function update() {
    const { count } = await db.from('students').select('*', { count: 'exact', head: true });
    el.textContent = count || '0';
  }
  
  await update();
  
  // Real-time subscription for the public count
  db.channel('public-count')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
      update();
    })
    .subscribe();
}

/* ─── Spinner style injected ─── */
const spinStyle = document.createElement('style');
spinStyle.textContent = `.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:var(--white);border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px}`;
document.head.appendChild(spinStyle);

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initSmoothScroll();
  initReveal();
  animateCounters();
  populateWaitlistCourses();
  initWaitlistForm();
  loadLiveCount();

  // Typing animation
  const typedEl = document.getElementById('typedText');
  if (typedEl) {
    typeWriter(typedEl, [
      'International Academy',
      'World-Class Education',
      'Your Future Starts Here',
      'Excellence in Learning',
    ], 70, 2400);
  }
});
