// ----------------------
// ADMIN ACCOUNT & LOGIN
// ----------------------
function hashPassword(password) {
  return btoa(password);
}

let adminData = JSON.parse(localStorage.getItem('adminData'));

if (!adminData) {
  const username = prompt("Create admin username:");
  const password = prompt("Create admin password:");
  adminData = {
    username: username.trim(),
    password: hashPassword(password.trim()),
    remember: false
  };
  localStorage.setItem('adminData', JSON.stringify(adminData));
  alert("Admin account created. Please log in.");
}

const loginContainer = document.getElementById('loginContainer');
const profileContainer = document.getElementById('profileContainer');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const adminNameDisplay = document.getElementById('adminNameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const rememberMeCheckbox = document.getElementById('rememberMe');

function showProfile() {
  loginContainer.hidden = true;
  profileContainer.hidden = false;
  dashboard.hidden = false;
  adminNameDisplay.textContent = adminData.username;
}

if (localStorage.getItem('rememberAdmin') === 'true') {
  showProfile();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('adminUsername').value.trim();
  const password = hashPassword(document.getElementById('adminPassword').value.trim());
  const remember = rememberMeCheckbox.checked;

  if (username === adminData.username && password === adminData.password) {
    adminData.remember = remember;
    localStorage.setItem('adminData', JSON.stringify(adminData));
    localStorage.setItem('rememberAdmin', remember ? 'true' : 'false');
    showProfile();
  } else {
    alert("Invalid username or password!");
  }
});

logoutBtn.addEventListener('click', () => {
  profileContainer.hidden = true;
  dashboard.hidden = true;
  loginContainer.hidden = false;
  localStorage.setItem('rememberAdmin', 'false');
});

deleteAccountBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to delete the admin account? Login data will be removed, but all records will remain.")) {
    localStorage.removeItem('adminData');
    localStorage.setItem('rememberAdmin', 'false');
    location.reload();
  }
});

// ----------------------
// DATA MANAGEMENT
// ----------------------
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let walkIns = JSON.parse(localStorage.getItem('walkIns')) || [];
let completed = JSON.parse(localStorage.getItem('completed')) || [];

const bookingForm = document.getElementById('bookingForm');
const walkInForm = document.getElementById('walkInForm');
const bookingTableBody = document.querySelector('#bookingTable tbody');
const completedTableBody = document.querySelector('#completedTable tbody');
const dailyTotal = document.getElementById('dailyTotal');
const weeklyTotal = document.getElementById('weeklyTotal');
const monthlyTotal = document.getElementById('monthlyTotal');
const yearlyTotal = document.getElementById('yearlyTotal');

// Helper to save all
function saveAll() {
  localStorage.setItem('bookings', JSON.stringify(bookings));
  localStorage.setItem('walkIns', JSON.stringify(walkIns));
  localStorage.setItem('completed', JSON.stringify(completed));
}

// ----------------------
// BOOKING FORM
// ----------------------
bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newBooking = {
    client: document.getElementById('clientName').value.trim(),
    service: document.getElementById('serviceName').value.trim(),
    date: document.getElementById('bookingDate').value,
    status: 'Pending',
    notes: ''
  };
  bookings.push(newBooking);
  saveAll();
  renderBookings();
  bookingForm.reset();
});

// ----------------------
// WALK-IN FORM
// ----------------------
walkInForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const total = parseFloat(document.getElementById('walkTotal').value);
  const paid = parseFloat(document.getElementById('walkPaid').value);
  const newWalkIn = {
    client: document.getElementById('walkClient').value.trim(),
    service: document.getElementById('walkService').value.trim(),
    total: total,
    paid: paid,
    unpaid: total - paid,
    notes: '',
    date: new Date().toISOString().slice(0,10)
  };
  walkIns.push(newWalkIn);
  completed.push(newWalkIn); // directly added to completed services
  saveAll();
  renderCompleted();
  renderSummaries();
  walkInForm.reset();
});

// ----------------------
// RENDER FUNCTIONS
// ----------------------
function renderBookings() {
  bookingTableBody.innerHTML = '';
  bookings.forEach((b, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.client}</td>
      <td>${b.service}</td>
      <td>${b.date}</td>
      <td>${b.status}</td>
      <td>
        <button onclick="completeBooking(${i})">Complete</button>
        <button onclick="editBooking(${i})">Edit</button>
        <button onclick="deleteBooking(${i})">Delete</button>
        <button onclick="postponeBooking(${i})">Postpone</button>
        <input type="text" placeholder="Notes..." value="${b.notes}" onchange="updateBookingNotes(${i}, this.value)">
      </td>
    `;
    bookingTableBody.appendChild(tr);
  });
}

function renderCompleted() {
  completedTableBody.innerHTML = '';
  completed.forEach((c, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.client}</td>
      <td>${c.service}</td>
      <td>${c.date}</td>
      <td>${c.type || 'Walk-in'}</td>
      <td>${c.total}</td>
      <td>${c.paid}</td>
      <td>${c.unpaid}</td>
      <td>
        <button onclick="editCompleted(${i})">Edit</button>
        <input type="text" placeholder="Payment Notes..." value="${c.notes}" onchange="updateCompletedNotes(${i}, this.value)">
      </td>
    `;
    completedTableBody.appendChild(tr);
  });
}

// ----------------------
// BOOKING ACTIONS
// ----------------------
function completeBooking(index) {
  const b = bookings[index];
  const total = parseFloat(prompt(`Enter total paid by ${b.client}:`));
  const paid = parseFloat(prompt(`Enter amount already paid (0 if none):`));
  const unpaid = total - paid;
  const completedEntry = {
    client: b.client,
    service: b.service,
    date: b.date,
    type: 'Booking',
    total: total,
    paid: paid,
    unpaid: unpaid,
    notes: b.notes
  };
  completed.push(completedEntry);
  bookings.splice(index, 1);
  saveAll();
  renderBookings();
  renderCompleted();
  renderSummaries();
}

function deleteBooking(index) {
  if(confirm("Delete this booking?")) {
    bookings.splice(index, 1);
    saveAll();
    renderBookings();
  }
}

function editBooking(index) {
  const b = bookings[index];
  const client = prompt("Edit client name:", b.client);
  const service = prompt("Edit service:", b.service);
  const date = prompt("Edit date (YYYY-MM-DD):", b.date);
  b.client = client;
  b.service = service;
  b.date = date;
  saveAll();
  renderBookings();
}

function postponeBooking(index) {
  const newDate = prompt("Enter new date and time (YYYY-MM-DDTHH:MM):", bookings[index].date);
  bookings[index].date = newDate;
  bookings[index].status = "Postponed";
  saveAll();
  renderBookings();
}

function updateBookingNotes(index, value) {
  bookings[index].notes = value;
  saveAll();
}

// ----------------------
// COMPLETED SERVICES ACTIONS
// ----------------------
function editCompleted(index) {
  const c = completed[index];
  c.paid = parseFloat(prompt("Update paid amount:", c.paid));
  c.unpaid = c.total - c.paid;
  saveAll();
  renderCompleted();
  renderSummaries();
}

function updateCompletedNotes(index, value) {
  completed[index].notes = value;
  saveAll();
}

// ----------------------
// INCOME SUMMARIES
// ----------------------
function renderSummaries() {
  let daily = 0, weekly = 0, monthly = 0, yearly = 0;
  let unpaidDaily = 0, unpaidWeekly = 0, unpaidMonthly = 0, unpaidYearly = 0;
  const today = new Date();
  completed.forEach(c => {
    const date = new Date(c.date);
    const paid = parseFloat(c.paid);
    const unpaid = parseFloat(c.unpaid);
    // daily
    if (date.toDateString() === today.toDateString()) { daily += paid; unpaidDaily += unpaid; }
    // weekly
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    if (date >= weekStart && date <= weekEnd) { weekly += paid; unpaidWeekly += unpaid; }
    // monthly
    if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) { monthly += paid; unpaidMonthly += unpaid; }
    // yearly
    if (date.getFullYear() === today.getFullYear()) { yearly += paid; unpaidYearly += unpaid; }
  });
  dailyTotal.textContent = `${daily} (Unpaid: ${unpaidDaily})`;
  weeklyTotal.textContent = `${weekly} (Unpaid: ${unpaidWeekly})`;
  monthlyTotal.textContent = `${monthly} (Unpaid: ${unpaidMonthly})`;
  yearlyTotal.textContent = `${yearly} (Unpaid: ${unpaidYearly})`;
}

// Initial render
renderBookings();
renderCompleted();
renderSummaries();
