/* ===== STORAGE ===== */
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
let completedServices = JSON.parse(localStorage.getItem("completedServices")) || [];
let admins = JSON.parse(localStorage.getItem("admins")) || [];

/* ===== STORAGE HELPERS ===== */
function saveData() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
  localStorage.setItem("completedServices", JSON.stringify(completedServices));
  localStorage.setItem("admins", JSON.stringify(admins));
}

/* ===== DATE HELPERS ===== */
function parseDate(dateStr) { return new Date(dateStr); }
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getFullYear(),0,1));
  return Math.ceil((((d - yearStart)/86400000)+1)/7);
}

/* ===== ADMIN AUTH ===== */
function createAdmin(username, password) {
  if (admins.find(a => a.username === username)) return false;
  admins.push({username, password});
  saveData();
  return true;
}

function loginAdmin(username, password, remember=false) {
  const admin = admins.find(a => a.username === username && a.password === password);
  if (admin) {
    localStorage.setItem("loggedAdmin", JSON.stringify({username, remember}));
    showDashboard();
    return true;
  }
  return false;
}

function logoutAdmin() {
  localStorage.removeItem("loggedAdmin");
  document.getElementById("loginContainer").hidden = false;
  document.getElementById("dashboard").hidden = true;
  document.getElementById("profileContainer").hidden = true;
}

function deleteAdminAccount() {
  const logged = JSON.parse(localStorage.getItem("loggedAdmin"));
  if (!logged) return;
  const index = admins.findIndex(a => a.username === logged.username);
  if (index !== -1) admins.splice(index,1);
  saveData();
  logoutAdmin();
}

/* ===== DASHBOARD SHOW/HIDE ===== */
function showDashboard() {
  const logged = JSON.parse(localStorage.getItem("loggedAdmin"));
  if (!logged) return;
  document.getElementById("loginContainer").hidden = true;
  document.getElementById("dashboard").hidden = false;
  document.getElementById("profileContainer").hidden = false;
  document.getElementById("adminNameDisplay").innerText = logged.username;
}

/* ===== BOOKINGS ===== */
function addBooking(client, service, date, notes="") {
  bookings.push({
    id: Date.now(),
    client,
    service,
    date,
    status: "Active",
    notes
  });
  saveData();
  renderBookings();
}

function editBooking(id) {
  const booking = bookings.find(b => b.id === id);
  if (!booking) return;
  const newClient = prompt("Edit client name:", booking.client) || booking.client;
  const newService = prompt("Edit service:", booking.service) || booking.service;
  const newDate = prompt("Edit date & time (YYYY-MM-DD HH:MM):", booking.date) || booking.date;
  const newNotes = prompt("Edit notes:", booking.notes) || booking.notes;
  booking.client = newClient;
  booking.service = newService;
  booking.date = newDate;
  booking.notes = newNotes;
  saveData();
  renderBookings();
}

function completeBookingPrompt(id) {
  const total = prompt("Enter total amount:");
  if(total === null) return;
  const paid = prompt("Enter amount paid:");
  if(paid === null) return;
  const notes = prompt("Add notes (optional):") || "";
  completeBooking(id, total, paid, notes);
}

function completeBooking(id, total, paid, notes="") {
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) return;
  const b = bookings[index];
  saveCompletedService(b.client, b.service, b.date, total, paid, "Booking", notes);
  bookings.splice(index,1);
  saveData();
  renderBookings();
}

function cancelBooking(id){
  const index = bookings.findIndex(b => b.id === id);
  if(index === -1) return;
  if(confirm(`Cancel booking for ${bookings[index].client}?`)){
    bookings[index].status = "Cancelled";
    saveData();
    renderBookings();
  }
}

function postponeBooking(id) {
  const booking = bookings.find(b => b.id === id);
  if (!booking) return;
  const newDate = prompt("Enter new date & time (YYYY-MM-DD HH:MM):", booking.date);
  if (!newDate) return;
  booking.date = newDate;
  booking.status = "Postponed";
  saveData();
  renderBookings();
}

/* ===== WALK-IN ===== */
function addWalkIn(client, service, total, paid, notes="") {
  saveCompletedService(client, service, new Date().toISOString().split("T")[0], total, paid, "Walk-in", notes);
}

/* ===== COMPLETED SERVICES ===== */
function saveCompletedService(client, service, date, total, paid, type, notes="") {
  const totalAmount = Number(total) || 0;
  const amountPaid = Number(paid) || 0;
  completedServices.push({
    id: Date.now(),
    client,
    service,
    date,
    type,
    totalAmount,
    amountPaid,
    unpaidAmount: Math.max(0, totalAmount - amountPaid),
    notes,
    payments: amountPaid < totalAmount ? [{date: new Date().toISOString().split("T")[0], amount: amountPaid}] : []
  });
  saveData();
  renderCompletedServices();
  updateSummaries();
  renderTopServices();
  drawIncomeChart();
  drawTopServicesChart();
}

function editCompletedService(id){
  const service = completedServices.find(s => s.id === id);
  if(!service) return;
  const total = prompt("Edit total amount:", service.totalAmount) || service.totalAmount;
  const paid = prompt("Edit amount paid:", service.amountPaid) || service.amountPaid;
  const notes = prompt("Edit notes:", service.notes) || service.notes;
  service.totalAmount = Number(total);
  if(paid != service.amountPaid) {
    const amountPaid = Number(paid);
    service.amountPaid = amountPaid;
    service.unpaidAmount = Math.max(0, service.totalAmount - service.amountPaid);
    service.payments.push({date:new Date().toISOString().split("T")[0], amount: amountPaid});
  }
  service.notes = notes;
  saveData();
  renderCompletedServices();
  updateSummaries();
  drawIncomeChart();
}

function deleteCompletedService(id){
  const index = completedServices.findIndex(s => s.id === id);
  if(index === -1) return;
  if(confirm("Delete this completed service?")){
    completedServices.splice(index,1);
    saveData();
    renderCompletedServices();
    updateSummaries();
    drawIncomeChart();
  }
}

/* ===== RENDER ===== */
function renderBookings(){
  const table=document.getElementById("bookingTable").querySelector("tbody");
  table.innerHTML="";
  bookings.forEach(b=>{
    const row = document.createElement("tr");
    row.innerHTML=`
      <td>${b.client}</td>
      <td>${b.service}</td>
      <td>${b.date}</td>
      <td>${b.status}</td>
      <td>
        ${b.status==="Active"?`<button onclick="completeBookingPrompt(${b.id})">Complete</button>`:""}
        <button onclick="editBooking(${b.id})">Edit</button>
        ${b.status!=="Completed"?`<button onclick="cancelBooking(${b.id})">Cancel</button>`:""}
        ${b.status==="Active"?`<button onclick="postponeBooking(${b.id})">Postpone</button>`:""}
        <button onclick="deleteBooking(${b.id})">Delete</button>
      </td>
      <td><input type="text" value="${b.notes}" readonly></td>
    `;
    table.appendChild(row);
  });
}

function deleteBooking(id){
  const index = bookings.findIndex(b => b.id===id);
  if(index===-1) return;
  if(confirm("Delete this booking?")) {
    bookings.splice(index,1);
    saveData();
    renderBookings();
  }
}

function renderCompletedServices(){
  const table=document.getElementById("completedTable").querySelector("tbody");
  table.innerHTML="";
  completedServices.forEach(s=>{
    const row = document.createElement("tr");
    row.innerHTML=`
      <td>${s.client}</td>
      <td>${s.service}</td>
      <td>${s.date}</td>
      <td>${s.type}</td>
      <td>${s.totalAmount}</td>
      <td>${s.amountPaid}</td>
      <td>${s.unpaidAmount}</td>
      <td>${s.notes}</td>
      <td>${s.payments.map(p=>`${p.date}: ${p.amount}`).join("<br>")}</td>
      <td>
        <button onclick="editCompletedService(${s.id})">Edit</button>
        <button onclick="deleteCompletedService(${s.id})">Delete</button>
        <button onclick='generateReceipt(${JSON.stringify(s)})'>Receipt</button>
      </td>
    `;
    table.appendChild(row);
  });
}

/* ===== INCOME SUMMARIES ===== */
function updateSummaries(){
  let daily={}, weekly={}, monthly={}, yearly={};
  let dailyUnpaid=0, weeklyUnpaid=0, monthlyUnpaid=0, yearlyUnpaid=0;
  completedServices.forEach(s=>{
    const d=parseDate(s.date);
    const keyW = `${d.getFullYear()}-W${getWeekNumber(d)}`;
    const keyM = `${d.getFullYear()}-${d.getMonth()+1}`;
    daily[s.date] = (daily[s.date]||0)+s.amountPaid;
    weekly[keyW] = (weekly[keyW]||0)+s.amountPaid;
    monthly[keyM] = (monthly[keyM]||0)+s.amountPaid;
    yearly[d.getFullYear()] = (yearly[d.getFullYear()]||0)+s.amountPaid;

    dailyUnpaid += s.unpaidAmount;
    weeklyUnpaid += s.unpaidAmount;
    monthlyUnpaid += s.unpaidAmount;
    yearlyUnpaid += s.unpaidAmount;
  });

  document.getElementById("dailyTotal").innerText = sum(daily) + " (Unpaid: "+dailyUnpaid+")";
  document.getElementById("weeklyTotal").innerText = sum(weekly) + " (Unpaid: "+weeklyUnpaid+")";
  document.getElementById("monthlyTotal").innerText = sum(monthly) + " (Unpaid: "+monthlyUnpaid+")";
  document.getElementById("yearlyTotal").innerText = sum(yearly) + " (Unpaid: "+yearlyUnpaid+")";
}

function sum(obj){ return Object.values(obj).reduce((a,b)=>a+b,0); }

/* ===== TOP SERVICES ===== */
function getTopServices(period="all"){
  const counts={};
  completedServices.forEach(s=>{ counts[s.service]=(counts[s.service]||0)+1; });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
}

function renderTopServices(){
  const list=document.getElementById("topServicesList");
  const top=getTopServices();
  list.innerHTML="";
  top.forEach(s=>list.innerHTML+=`<li>${s[0]} — ${s[1]} bookings</li>`);
}

/* ===== CHARTS ===== */
let incomeChart, topServicesChart;
function drawIncomeChart(){
  const ctx=document.getElementById("incomeChart").getContext("2d");
  const labels = completedServices.map(s=>s.date);
  const data = completedServices.map(s=>s.amountPaid);
  if(incomeChart) incomeChart.destroy();
  incomeChart = new Chart(ctx,{
    type:'line',
    data:{labels, datasets:[{label:'Income', data, borderColor:'gold', backgroundColor:'rgba(255,215,0,0.2)'}]}
  });
}

function drawTopServicesChart(){
  const ctx=document.getElementById("topServicesChart").getContext("2d");
  const top = getTopServices();
  if(topServicesChart) topServicesChart.destroy();
  topServicesChart = new Chart(ctx,{
    type:'bar',
    data:{labels: top.map(s=>s[0]), datasets:[{label:'Bookings', data: top.map(s=>s[1]), backgroundColor:'silver'}]}
  });
}

/* ===== RECEIPT ===== */
function generateReceipt(service){
  const win = window.open('', '_blank');
  win.document.write(`<h1>Receipt</h1>
  <p>Client: ${service.client}</p>
  <p>Service: ${service.service}</p>
  <p>Date: ${service.date}</p>
  <p>Type: ${service.type}</p>
  <p>Total: ${service.totalAmount}</p>
  <p>Paid: ${service.amountPaid}</p>
  <p>Unpaid: ${service.unpaidAmount}</p>
  <p>Notes: ${service.notes}</p>
  <p>Payments: ${service.payments.map(p=>p.date+": "+p.amount).join(", ")}</p>
  <script>window.print();</script>`);
}

/* ===== PDF EXPORT ===== */
document.getElementById("exportPDF").addEventListener("click", () => {
  const element = document.querySelector(".content-wrapper");
  const opt = {margin:0.5, filename:`Spa_Report_${new Date().toISOString().split("T")[0]}.pdf`,
    image:{type:'jpeg', quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'in', format:'a4', orientation:'portrait'}};
  html2pdf().set(opt).from(element).save();
});

/* ===== INIT ===== */
if(JSON.parse(localStorage.getItem("loggedAdmin"))) showDashboard();
renderBookings();
renderCompletedServices();
updateSummaries();
renderTopServices();
drawIncomeChart();
drawTopServicesChart();

/* ===== FORM SUBMISSIONS ===== */
document.getElementById("bookingForm")?.addEventListener("submit", e=>{
  e.preventDefault();
  addBooking(
    document.getElementById("clientName").value,
    document.getElementById("serviceName").value,
    document.getElementById("bookingDate").value
  );
  e.target.reset();
});

document.getElementById("walkInForm")?.addEventListener("submit", e=>{
  e.preventDefault();
  addWalkIn(
    document.getElementById("walkClient").value,
    document.getElementById("walkService").value,
    document.getElementById("walkTotal").value,
    document.getElementById("walkPaid").value
  );
  e.target.reset();
});

/* ===== LOGIN & PROFILE ===== */
document.getElementById("loginForm")?.addEventListener("submit", e=>{
  e.preventDefault();
  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;
  const remember = document.getElementById("rememberMe").checked;
  if(loginAdmin(username,password,remember)) alert("Logged in!"); 
  else alert("Incorrect credentials");
});

document.getElementById("logoutBtn")?.addEventListener("click", logoutAdmin);
document.getElementById("deleteAccountBtn")?.addEventListener("click", deleteAdminAccount);
