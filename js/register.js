/* ===================================================
   register.js — Student Registration (Supabase)
   Fulfilment International Academy
   =================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Require auth
  const user = await requireAuth();
  if (!user) return;

  const form          = document.getElementById('registerForm');
  const formCard      = document.getElementById('formCard');
  const successOverlay = document.getElementById('successOverlay');
  const generatedIdEl = document.getElementById('generatedId');

  /* ── Populate courses ── */
  const courseSelect = document.getElementById('course');
  COURSES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    courseSelect.appendChild(opt);
  });

  /* ── Generate Student ID ── */
  let studentId = await generateStudentId();
  generatedIdEl.textContent = studentId;

  /* ── Validation helpers ── */
  function setError(fieldId, msg) {
    const group = document.getElementById(fieldId)?.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    const ctrl = group.querySelector('.form-control');
    if (ctrl) ctrl.classList.add('error');
    const errEl = group.querySelector('.error-msg');
    if (errEl) errEl.textContent = msg;
  }

  function clearError(fieldId) {
    const group = document.getElementById(fieldId)?.closest('.form-group');
    if (!group) return;
    group.classList.remove('has-error');
    const ctrl = group.querySelector('.form-control');
    if (ctrl) { ctrl.classList.remove('error'); if (ctrl.value.trim()) ctrl.classList.add('valid'); }
  }

  function validateField(id) {
    const el = document.getElementById(id);
    if (!el) return true;
    const val = el.value.trim();
    if (el.required && !val) { setError(id, 'This field is required.'); return false; }
    if (id === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setError(id, 'Invalid email address.'); return false; }
    if (id === 'phone' && val && !/^[\d\s\+\-\(\)]{7,20}$/.test(val)) { setError(id, 'Invalid phone number.'); return false; }
    clearError(id);
    return true;
  }

  ['firstName','lastName','email','phone','dob','course','gender'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('blur', () => validateField(id));
      el.addEventListener('input', () => { if (el.classList.contains('error')) validateField(id); });
    }
  });

  /* ── Form submit ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = ['firstName','lastName','email','phone','dob','course','gender'];
    let valid = true;
    fields.forEach(id => { if (!validateField(id)) valid = false; });
    if (!valid) { toast('Please fill in all required fields correctly.', 'error'); return; }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    const student = {
      student_id:  studentId,
      first_name:  document.getElementById('firstName').value.trim(),
      last_name:   document.getElementById('lastName').value.trim(),
      email:       document.getElementById('email').value.trim(),
      phone:       document.getElementById('phone').value.trim(),
      dob:         document.getElementById('dob').value || null,
      gender:      document.getElementById('gender').value,
      course:      document.getElementById('course').value,
      address:     document.getElementById('address').value.trim(),
      nationality: document.getElementById('nationality').value.trim(),
      notes:       document.getElementById('notes').value.trim(),
      enroll_date: new Date().toISOString().split('T')[0],
      status:      'Active',
    };

    const { error } = await db.from('students').insert([student]);
    submitBtn.disabled = false;
    submitBtn.textContent = '✅ Register Student';

    if (error) {
      toast('Error saving student: ' + error.message, 'error');
      return;
    }

    formCard.style.display = 'none';
    successOverlay.classList.add('show');
    document.getElementById('successId').textContent   = studentId;
    document.getElementById('successName').textContent = `${student.first_name} ${student.last_name}`;
  });

  /* ── Reset ── */
  window.resetForm = async function() {
    formCard.style.display = '';
    successOverlay.classList.remove('show');
    form.reset();
    studentId = await generateStudentId();
    generatedIdEl.textContent = studentId;
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error','valid'));
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error','has-success'));
  };
});
