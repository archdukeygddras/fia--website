/* ===================================================
   login.js — Authentication Logic
   Fulfilment International Academy
   =================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // If already signed in, skip login
  const { data } = await db.auth.getSession();
  if (data?.session) {
    window.location.href = 'index.html';
    return;
  }

  const signInTab   = document.getElementById('tabSignIn');
  const signUpTab   = document.getElementById('tabSignUp');
  const signInForm  = document.getElementById('signInForm');
  const signUpForm  = document.getElementById('signUpForm');
  const signInErr   = document.getElementById('signInError');
  const signUpErr   = document.getElementById('signUpError');
  const signInBtn   = document.getElementById('signInBtn');
  const signUpBtn   = document.getElementById('signUpBtn');

  /* ── Tab switching ── */
  signInTab.addEventListener('click', () => switchTab('signin'));
  signUpTab.addEventListener('click', () => switchTab('signup'));

  function switchTab(tab) {
    if (tab === 'signin') {
      signInTab.classList.add('active');
      signUpTab.classList.remove('active');
      signInForm.style.display = '';
      signUpForm.style.display = 'none';
    } else {
      signUpTab.classList.add('active');
      signInTab.classList.remove('active');
      signUpForm.style.display = '';
      signInForm.style.display = 'none';
    }
    clearErrors();
  }

  function clearErrors() {
    signInErr.textContent = '';
    signUpErr.textContent = '';
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<span class="spinner"></span> Please wait…'
      : btn.dataset.label;
  }

  signInBtn.dataset.label = signInBtn.innerHTML;
  signUpBtn.dataset.label = signUpBtn.innerHTML;

  /* ── Sign In ── */
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const email    = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;

    if (!email || !password) { signInErr.textContent = 'Please enter your email and password.'; return; }

    setLoading(signInBtn, true);
    const { error } = await db.auth.signInWithPassword({ email, password });
    setLoading(signInBtn, false);

    if (error) {
      signInErr.textContent = error.message || 'Sign in failed. Please check your credentials.';
    } else {
      window.location.href = 'index.html';
    }
  });

  /* ── Sign Up ── */
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const name     = document.getElementById('signUpName').value.trim();
    const email    = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirm  = document.getElementById('signUpConfirm').value;

    if (!name || !email || !password) { signUpErr.textContent = 'All fields are required.'; return; }
    if (password.length < 6)          { signUpErr.textContent = 'Password must be at least 6 characters.'; return; }
    if (password !== confirm)          { signUpErr.textContent = 'Passwords do not match.'; return; }

    setLoading(signUpBtn, true);
    const { error } = await db.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    });
    setLoading(signUpBtn, false);

    if (error) {
      signUpErr.textContent = error.message || 'Sign up failed. Please try again.';
    } else {
      signUpErr.style.color = 'var(--success)';
      signUpErr.textContent = '✅ Account created! Check your email to confirm, then sign in.';
    }
  });

  /* ── Password visibility toggle ── */
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁️' : '🙈';
    });
  });
});
