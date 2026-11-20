const DB = {
  getUsers: () => JSON.parse(localStorage.getItem('users') || '[]'),
  saveUsers: (u) => localStorage.setItem('users', JSON.stringify(u)),
  getRecords: () => JSON.parse(localStorage.getItem('records') || '[]'),
  saveRecords: (r) => localStorage.setItem('records', JSON.stringify(r)),
  getSession: () => JSON.parse(localStorage.getItem('session') || 'null'),
  saveSession: (s) => localStorage.setItem('session', JSON.stringify(s)),
  logout: () => localStorage.removeItem('session'),
};

// ============ SIGNUP ============
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;
    const errorMsg = document.getElementById('errorMsg');

    if (password !== confirm) {
      errorMsg.textContent = 'Passwords do not match.';
      return;
    }
    const users = DB.getUsers();
    if (users.find(u => u.email === email)) {
      errorMsg.textContent = 'This email is already registered.';
      return;
    }
    users.push({ fullname, email, password, role: 'user' });
    DB.saveUsers(users);
    alert('Registration successful! Please login.');
    window.location.href = 'login.html';
  });
}

// ============ LOGIN ============
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    const users = DB.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      errorMsg.textContent = 'Invalid email or password.';
      return;
    }
    DB.saveSession({ email: user.email, fullname: user.fullname, role: user.role });
    window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
  });
}

// ============ AUTH GUARD ============
function requireAuth(requireAdmin = false) {
  const session = DB.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  if (requireAdmin && session.role !== 'admin') {
    window.location.href = 'user.html';
    return null;
  }
  return session;
}

// ============ USER DASHBOARD ============
const welcome = document.getElementById('welcome');
if (welcome) {
  const session = requireAuth();
  if (session) {
    welcome.textContent = `Welcome, ${session.fullname}`;
    const badge = document.getElementById('roleBadge');
    if (badge) {
      badge.textContent = session.role.toUpperCase();
      badge.classList.add(session.role);
    }
    renderUserDashboard(session.email);
  }
}

function renderUserDashboard(userEmail) {
  const allRecords = DB.getRecords();
  const myRecords = allRecords.filter(r => r.owner === userEmail);
  const births = myRecords.filter(r => r.type === 'birth');
  const deaths = myRecords.filter(r => r.type === 'death');

  document.getElementById('totalBirths').textContent = births.length;
  document.getElementById('totalDeaths').textContent = deaths.length;

  const list = document.getElementById('recordsList');
  if (!list) return;
  if (myRecords.length === 0) {
    list.innerHTML = '<p>No records yet. Record a birth or death.</p>';
    return;
  }

  list.innerHTML = `
    <h3>My Records (${myRecords.length})</h3>
    <table>
      <thead>
        <tr><th>Type</th><th>Name</th><th>Date</th><th>Place</th></tr>
      </thead>
      <tbody>
        ${myRecords.map(r => `
          <tr>
            <td>${r.type === 'birth' ? '👶 Birth' : '⚰️ Death'}</td>
            <td>${r.name}</td>
            <td>${r.date}</td>
            <td>${r.place}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============ SHOW FORM ============
function showForm(type) {
  const session = DB.getSession();
  if (!session) return;
  const area = document.getElementById('formArea');
  if (!area) return;

  const label = type === 'birth' ? 'Birth' : 'Death';
  area.innerHTML = `
    <div class="form-container" style="margin:1rem 0;">
      <h3>Record ${label}</h3>
      <form id="recordForm">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="recName" required>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="recDate" required>
        </div>
        <div class="form-group">
          <label>Place</label>
          <input type="text" id="recPlace" required>
        </div>
        <button type="submit" class="btn-primary full">Save</button>
      </form>
    </div>
  `;

  document.getElementById('recordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('recName').value.trim();
    const date = document.getElementById('recDate').value;
    const place = document.getElementById('recPlace').value.trim();

    const records = DB.getRecords();
    records.push({ type, name, date, place, owner: session.email });
    DB.saveRecords(records);
    area.innerHTML = '';
    alert(`${label} record saved!`);
    renderUserDashboard(session.email);
  });
}

// ============ ADMIN DASHBOARD ============
const adminBirths = document.getElementById('adminBirths');
if (adminBirths) {
  const session = requireAuth(true);
  if (session) {
    const adminWelcome = document.getElementById('adminWelcome');
    if (adminWelcome) adminWelcome.textContent = `Admin: ${session.fullname}`;
    const records = DB.getRecords();
    const users = DB.getUsers();

    document.getElementById('adminBirths').textContent = records.filter(r => r.type === 'birth').length;
    document.getElementById('adminDeaths').textContent = records.filter(r => r.type === 'death').length;
    document.getElementById('adminUsers').textContent = users.length;

    document.getElementById('usersList').innerHTML = `
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${u.fullname}</td>
              <td>${u.email}</td>
              <td><span class="badge ${u.role}">${u.role}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.getElementById('allRecordsList').innerHTML = records.length === 0 ? '<p>No records yet.</p>' : `
        <table>
          <thead><tr><th>Type</th><th>Name</th><th>Date</th><th>Place</th><th>Owner</th></tr></thead>
          <tbody>
            ${records.map(r => `
              <tr>
                <td>${r.type === 'birth' ? '👶 Birth' : '⚰️ Death'}</td>
                <td>${r.name}</td>
                <td>${r.date}</td>
                <td>${r.place}</td>
                <td>${r.owner || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
  }
}

// ============ LOGOUT ============
function logout() {
  DB.logout();
  window.location.href = 'index.html';
}