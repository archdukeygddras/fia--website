/* ===================================================
   app.js — Supabase Client + Shared Utilities
   Fulfilment International Academy
   =================================================== */

/* ─── Supabase Configuration ─── */
const SUPABASE_URL  = 'https://claveflibaousyaszsee.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYXZlZmxpYmFvdXN5YXN6c2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTcwODgsImV4cCI6MjA4ODg5MzA4OH0.0o-XX7WxXxsYi-OjgsZLJh1OsemlJRqGg3PVYQHTWvc';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ─── Auth Helpers ─── */
async function getUser() {
  const { data } = await db.auth.getUser();
  return data?.user || null;
}

async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

async function signOut() {
  await db.auth.signOut();
  window.location.href = 'login.html';
}

/* ─── Student ID Generator ─── */
async function generateStudentId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const { data } = await db.from('students').select('student_id').order('created_at', { ascending: false }).limit(1);
  let maxNum = 0;
  if (data && data.length > 0) {
    const parts = data[0].student_id?.split('-') || [];
    maxNum = parts.length === 3 ? parseInt(parts[2]) || 0 : 0;
  }
  const nextNum = String(maxNum + 1).padStart(4, '0');
  return `FIA-${year}-${nextNum}`;
}

/* ─── Avatar Helpers ─── */
function avatarClass(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `av${Math.abs(hash) % 5}`;
}

function initials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
}

/* ─── Toast Notifications ─── */
function toast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3300);
}

/* ─── Navbar: Active Link ─── */
function setNavActive() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path || (path === '' && href === 'index.html'));
  });
}

/* ─── Navbar: Auth state (sign in / sign out button) ─── */
async function initNavAuth() {
  const user = await getUser();
  const signOutBtn = document.getElementById('navSignOut');
  const signInBtn  = document.getElementById('navSignIn');
  if (signOutBtn) signOutBtn.style.display = user ? 'flex' : 'none';
  if (signInBtn)  signInBtn.style.display  = user ? 'none' : 'flex';
}

/* ─── Hamburger ─── */
function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => links.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !links.contains(e.target)) links.classList.remove('open');
  });
}

/* ─── Scroll Reveal ─── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

/* ─── Animated Counter ─── */
function animateCount(el, target, duration = 1600) {
  if (!el) return;
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target; clearInterval(timer); return; }
    el.textContent = Math.floor(start);
  }, 16);
}

/* ─── Modal Helpers ─── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

/* ─── Format Date ─── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Courses ─── */
const COURSES = [
  'Business Administration', 'Computer Science', 'Data Analytics',
  'Digital Marketing', 'Education & Leadership', 'Engineering Technology',
  'Finance & Accounting', 'Healthcare Management', 'Human Resource Management',
  'International Relations', 'Law & Governance', 'Project Management',
  'Psychology', 'Supply Chain & Logistics',
];

/* ─── On DOM Ready ─── */
document.addEventListener('DOMContentLoaded', () => {
  setNavActive();
  initHamburger();
  initReveal();
  initNavAuth();
});
