/* ===================================================
   students.js — Student List & CRUD (Supabase + Realtime)
   Fulfilment International Academy
   =================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Require auth
  const user = await requireAuth();
  if (!user) return;

  let viewMode      = 'table';
  let searchQuery   = '';
  let filterCourse  = '';
  let filterStatus  = '';
  let deleteTargetId = null;
  let editTargetId   = null;
  let allStudents    = [];

  const tableBody  = document.getElementById('studentsTableBody');
  const gridBody   = document.getElementById('studentsGrid');
  const emptyState = document.getElementById('emptyState');
  const tableWrap  = document.getElementById('tableView');
  const gridWrap   = document.getElementById('gridView');
  const countBadge = document.getElementById('studentCount');

  /* ── Populate filters ── */
  const courseFilter = document.getElementById('courseFilter');
  COURSES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    courseFilter.appendChild(opt);
  });

  const editCourseEl = document.getElementById('editCourse');
  COURSES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    editCourseEl.appendChild(opt);
  });

  /* ── Fetch & render ── */
  async function loadStudents() {
    const { data, error } = await db.from('students').select('*').order('created_at', { ascending: false });
    if (error) { toast('Failed to load students: ' + error.message, 'error'); return; }
    allStudents = data || [];
    renderStudents();
  }

  function filtered() {
    let list = [...allStudents];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.course?.toLowerCase().includes(q)
      );
    }
    if (filterCourse) list = list.filter(s => s.course === filterCourse);
    if (filterStatus)  list = list.filter(s => s.status === filterStatus);
    return list;
  }

  function renderStudents() {
    const students = filtered();
    countBadge.textContent = `${students.length} student${students.length !== 1 ? 's' : ''}`;

    if (students.length === 0) {
      emptyState.style.display = 'flex';
      tableWrap.style.display  = 'none';
      gridWrap.style.display   = 'none';
      return;
    }
    emptyState.style.display = 'none';

    if (viewMode === 'table') {
      tableWrap.style.display = '';
      gridWrap.style.display  = 'none';
      renderTable(students);
    } else {
      tableWrap.style.display = 'none';
      gridWrap.style.display  = '';
      renderGrid(students);
    }
  }

  /* ── HTML escape ── */
  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Table render ── */
  function renderTable(students) {
    tableBody.innerHTML = students.map(s => {
      const av  = avatarClass(s.student_id || s.id);
      const ini = initials(s.first_name, s.last_name);
      const stat = s.status || 'Active';
      const bc   = stat === 'Active' ? 'badge-green' : stat === 'Graduated' ? 'badge-blue' : 'badge-red';
      return `
        <tr>
          <td>
            <div class="student-name-cell">
              <div class="student-avatar ${av}">${ini}</div>
              <div>
                <div class="student-name">${esc(s.first_name)} ${esc(s.last_name)}</div>
                <div class="student-email">${esc(s.email)}</div>
              </div>
            </div>
          </td>
          <td><code style="font-size:0.8rem;color:var(--blue-light)">${esc(s.student_id)}</code></td>
          <td><span class="badge badge-blue">${esc(s.course)}</span></td>
          <td>${esc(s.phone || '—')}</td>
          <td>${formatDate(s.enroll_date)}</td>
          <td><span class="badge ${bc}">${stat}</span></td>
          <td>
            <div class="action-btns">
              <button class="btn btn-sm btn-outline btn-icon" title="View" onclick="viewStudent('${s.id}')">👁️</button>
              <button class="btn btn-sm btn-primary btn-icon" title="Edit" onclick="editStudent('${s.id}')">✏️</button>
              <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="confirmDelete('${s.id}')">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  /* ── Grid render ── */
  function renderGrid(students) {
    gridBody.innerHTML = students.map(s => {
      const av   = avatarClass(s.student_id || s.id);
      const ini  = initials(s.first_name, s.last_name);
      const stat = s.status || 'Active';
      const bc   = stat === 'Active' ? 'badge-green' : stat === 'Graduated' ? 'badge-blue' : 'badge-red';
      return `
        <div class="student-card-grid">
          <div class="scg-header">
            <div class="scg-avatar ${av}">${ini}</div>
            <span class="badge ${bc}">${stat}</span>
          </div>
          <div class="scg-meta">
            <div class="scg-name">${esc(s.first_name)} ${esc(s.last_name)}</div>
            <div class="scg-course">${esc(s.course)}</div>
          </div>
          <div class="scg-info">
            <div class="scg-info-item"><div class="lbl">Student ID</div><div class="val" style="font-size:0.75rem;color:var(--blue-light)">${esc(s.student_id)}</div></div>
            <div class="scg-info-item"><div class="lbl">Enrolled</div><div class="val">${formatDate(s.enroll_date)}</div></div>
            <div class="scg-info-item"><div class="lbl">Phone</div><div class="val">${esc(s.phone || '—')}</div></div>
            <div class="scg-info-item"><div class="lbl">Gender</div><div class="val">${esc(s.gender || '—')}</div></div>
          </div>
          <div class="scg-footer">
            <button class="btn btn-sm btn-outline" style="flex:1" onclick="viewStudent('${s.id}')">👁️ View</button>
            <button class="btn btn-sm btn-primary" style="flex:1" onclick="editStudent('${s.id}')">✏️ Edit</button>
            <button class="btn btn-sm btn-danger btn-icon" onclick="confirmDelete('${s.id}')">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  /* ── Search / filter events ── */
  document.getElementById('searchInput').addEventListener('input', e => { searchQuery = e.target.value; renderStudents(); });
  document.getElementById('courseFilter').addEventListener('change', e => { filterCourse = e.target.value; renderStudents(); });
  document.getElementById('statusFilter').addEventListener('change', e => { filterStatus = e.target.value; renderStudents(); });

  /* ── View toggle ── */
  document.querySelectorAll('.vt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.view;
      document.querySelectorAll('.vt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderStudents();
    });
  });

  /* ── View profile ── */
  window.viewStudent = function(id) {
    const s = allStudents.find(x => x.id === id);
    if (!s) return;
    const av  = avatarClass(s.student_id || s.id);
    const ini = initials(s.first_name, s.last_name);
    const stat = s.status || 'Active';
    const bc   = stat === 'Active' ? 'badge-green' : stat === 'Graduated' ? 'badge-blue' : 'badge-red';
    document.getElementById('profileContent').innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar-lg ${av}">${ini}</div>
        <div>
          <div style="font-family:var(--font-head);font-size:1.3rem;font-weight:800;">${esc(s.first_name)} ${esc(s.last_name)}</div>
          <div class="profile-id">${esc(s.student_id)}</div>
          <span class="badge ${bc}" style="margin-top:6px">${stat}</span>
        </div>
      </div>
      <div class="profile-info-grid">
        <div class="profile-field"><label>Email</label><span>${esc(s.email)}</span></div>
        <div class="profile-field"><label>Phone</label><span>${esc(s.phone||'—')}</span></div>
        <div class="profile-field"><label>Course</label><span>${esc(s.course)}</span></div>
        <div class="profile-field"><label>Gender</label><span>${esc(s.gender||'—')}</span></div>
        <div class="profile-field"><label>Date of Birth</label><span>${formatDate(s.dob)}</span></div>
        <div class="profile-field"><label>Enrolment Date</label><span>${formatDate(s.enroll_date)}</span></div>
        <div class="profile-field"><label>Nationality</label><span>${esc(s.nationality||'—')}</span></div>
        <div class="profile-field"><label>Address</label><span>${esc(s.address||'—')}</span></div>
        ${s.notes ? `<div class="profile-field" style="grid-column:1/-1"><label>Notes</label><span>${esc(s.notes)}</span></div>` : ''}
      </div>`;
    openModal('profileModal');
  };

  /* ── Edit ── */
  window.editStudent = function(id) {
    const s = allStudents.find(x => x.id === id);
    if (!s) return;
    editTargetId = id;
    document.getElementById('editFirstName').value   = s.first_name   || '';
    document.getElementById('editLastName').value    = s.last_name    || '';
    document.getElementById('editEmail').value       = s.email        || '';
    document.getElementById('editPhone').value       = s.phone        || '';
    document.getElementById('editDob').value         = s.dob          || '';
    document.getElementById('editGender').value      = s.gender       || '';
    document.getElementById('editCourse').value      = s.course       || '';
    document.getElementById('editAddress').value     = s.address      || '';
    document.getElementById('editNationality').value = s.nationality  || '';
    document.getElementById('editStatus').value      = s.status       || 'Active';
    document.getElementById('editNotes').value       = s.notes        || '';
    openModal('editModal');
  };

  window.saveEdit = async function() {
    if (!editTargetId) return;
    const updates = {
      first_name:  document.getElementById('editFirstName').value.trim(),
      last_name:   document.getElementById('editLastName').value.trim(),
      email:       document.getElementById('editEmail').value.trim(),
      phone:       document.getElementById('editPhone').value.trim(),
      dob:         document.getElementById('editDob').value || null,
      gender:      document.getElementById('editGender').value,
      course:      document.getElementById('editCourse').value,
      address:     document.getElementById('editAddress').value.trim(),
      nationality: document.getElementById('editNationality').value.trim(),
      status:      document.getElementById('editStatus').value,
      notes:       document.getElementById('editNotes').value.trim(),
    };
    if (!updates.first_name || !updates.last_name || !updates.email || !updates.course) {
      toast('Please fill in all required fields.', 'error'); return;
    }
    const { error } = await db.from('students').update(updates).eq('id', editTargetId);
    if (error) { toast('Update failed: ' + error.message, 'error'); return; }
    closeModal('editModal');
    toast('Student record updated!', 'success');
  };

  /* ── Delete ── */
  window.confirmDelete = function(id) {
    const s = allStudents.find(x => x.id === id);
    if (!s) return;
    deleteTargetId = id;
    document.getElementById('deleteStudentName').textContent = `${s.first_name} ${s.last_name}`;
    openModal('deleteModal');
  };

  window.doDelete = async function() {
    if (!deleteTargetId) return;
    const { error } = await db.from('students').delete().eq('id', deleteTargetId);
    if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
    closeModal('deleteModal');
    deleteTargetId = null;
    toast('Student deleted.', 'info');
  };

  /* ── Export CSV ── */
  window.exportCSV = function() {
    const students = filtered();
    if (!students.length) { toast('No students to export.', 'info'); return; }
    const headers = ['Student ID','First Name','Last Name','Email','Phone','Course','Gender','DOB','Enrolled','Status','Nationality','Address','Notes'];
    const rows = students.map(s => [
      s.student_id,s.first_name,s.last_name,s.email,s.phone,s.course,
      s.gender,s.dob,s.enroll_date,s.status,s.nationality,s.address,s.notes
    ].map(v => `"${(v||'').replace(/"/g,'""')}"`).join(','));
    const csv  = [headers.join(','),...rows].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `FIA_Students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast('CSV exported!', 'success');
  };

  /* ── Realtime subscription ── */
  const channel = db.channel('students-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
      if (payload.eventType === 'INSERT') {
        allStudents.unshift(payload.new);
        toast(`New student added: ${payload.new.first_name} ${payload.new.last_name}`, 'info');
      } else if (payload.eventType === 'UPDATE') {
        const idx = allStudents.findIndex(s => s.id === payload.new.id);
        if (idx !== -1) allStudents[idx] = payload.new;
      } else if (payload.eventType === 'DELETE') {
        allStudents = allStudents.filter(s => s.id !== payload.old.id);
      }
      renderStudents();
    })
    .subscribe();

  /* ── Initial load ── */
  await loadStudents();
});
