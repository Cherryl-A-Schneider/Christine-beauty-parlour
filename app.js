/* ===== STORAGE ===== */
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
let completedServices = JSON.parse(localStorage.getItem("completedServices")) || [];
let admin = JSON.parse(localStorage.getItem("admin")) || null;

/* ===== SAVE DATA ===== */
function saveData() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
  localStorage.setItem("completedServices", JSON.stringify(completedServices));
  localStorage.setItem("admin", JSON.stringify(admin));
}

/* ===== HELPER FUNCTIONS ===== */
function parseDate(dateStr) { return new Date(dateStr); }
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getFullYear(),0,1));
  return Math.ceil((((d - yearStart)/86400000)+1)/7);
}
function sum(obj){ return Object.values(obj).reduce((a,b)=>a+b,0); }

/* ===== LOGIN / ADMIN SYSTEM ===== */
const loginContainer = document.getElementById("loginContainer");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const createAdminForm = document.getElementById("createAdminForm");
const firstTimeMsg = document.getElementById("firstTimeMsg");
const rememberMe = document.getElementById("rememberMe");
const profilePicInput = document.getElementById("profilePicInput");
const profilePicDisplay = document.getElementById("profilePicDisplay");
const logoutBtn = document.getElementById("logoutBtn");
const deleteAdminBtn = document.getElementById("deleteAdminBtn");

function showDashboard() {
  loginContainer.style.display = "none";
  dashboard.style.display = "block";
  renderProfile();
  renderBookings();
  renderCompletedServices();
  updateSummaries();
  renderTopServices();
  drawIncomeChart();
  drawTopServicesChart();
}

function renderProfile() {
  if(admin && admin.picture) profilePicDisplay.src = admin.picture;
}

function checkLogin() {
  const saved = localStorage.getItem("rememberedAdmin");
  if(saved) {
    admin = JSON.parse(saved);
    showDashboard();
  } else if(!admin) {
    createAdminForm.style.display = "block";
    firstTimeMsg.style.display = "block";
  } else {
    loginContainer.style.display = "block";
  }
}

/* ===== ADMIN CREATION ===== */
createAdminForm.addEventListener("submit", e=>{
  e.preventDefault();
  const username = document.getElementById("createUsername").value;
  const password = document.getElementById("createPassword").value;
  if(!username || !password) return alert("Fill both fields");
  admin = {username, password, picture: ""};
  saveData();
  alert("Admin account created!");
  showDashboard();
});

/* ===== LOGIN ===== */
loginForm.addEventListener("submit", e=>{
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  if(!admin) return alert("No admin account exists. Create one first.");
  if(username===admin.username && password===admin.password){
    if(rememberMe.checked) localStorage.setItem("rememberedAdmin", JSON.stringify(admin));
    showDashboard();
  } else {
    alert("Incorrect credentials!");
  }
});

/* ===== LOGOUT ===== */
logoutBtn.addEventListener("click", ()=>{
  localStorage.removeItem("rememberedAdmin");
  dashboard.style.display = "none";
  loginContainer.style.display = "block";
});

/* ===== DELETE ADMIN ===== */
deleteAdminBtn.addEventListener("click", ()=>{
  if(confirm("Delete admin account? All records will remain.")){
    localStorage.removeItem("admin");
    localStorage.removeItem("rememberedAdmin");
    admin = null;
    dashboard.style.display = "none";
    loginContainer.style.display = "block";
  }
});

/* ===== PROFILE PIC UPLOAD ===== */
profilePicInput.addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    admin.picture = reader.result;
    saveData();
    renderProfile();
  };
  reader.readAsDataURL(file);
});

/* ===== BOOKINGS ===== */
function addBooking(client, service, date){
  bookings.push({id: Date.now(), client, service, date, status: "Active"});
  saveData();
  renderBookings();
}

function completeBookingPrompt(id){
  const total = prompt("Enter total amount:");
  if(total===null) return;
  const paid = prompt("Enter amount paid:");
  if(paid===null) return;
  const notes = prompt("Optional notes:");
  completeBooking(id, total, paid, notes);
}

function completeBooking(id, total, paid, notes){
  const index = bookings.findIndex(b=>b.id===id);
  if(index===-1) return;
  saveCompletedService(bookings[index].client, bookings[index].service, bookings[index].date, total, paid, "Booking", notes);
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

function postponeBooking(id){
  const index = bookings.findIndex(b => b.id === id);
  if(index === -1) return;
  const newDate = prompt("Enter new date & time (YYYY-MM-DD HH:MM):");
  if(!newDate) return;
  bookings[index].date = newDate;
  bookings[index].status = "Postponed";
  saveData();
  renderBookings();
  alert(`Booking for ${bookings[index].client} postponed to ${newDate}`);
}

/* ===== WALK-IN ===== */
function addWalkIn(client, service, total, paid, notes=""){
  saveCompletedService(client, service, new Date().toISOString().split("T")[0], total, paid, "Walk-in", notes);
}

/* ===== COMPLETED SERVICES ===== */
function saveCompletedService(client, service, date, total, paid, type, notes=""){
  const totalAmount = Number(total) || 0;
  const amountPaid = Number(paid) || 0;
  completedServices.push({
    client,
    service,
    date,
    type,
    totalAmount,
    amountPaid,
    unpaidAmount: Math.max(0, totalAmount - amountPaid),
    notes
  });
  saveData();
  renderCompletedServices();
  updateSummaries();
  renderTopServices();
  drawIncomeChart();
  drawTopServicesChart();
}

/* ===== RENDER TABLES ===== */
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
        ${b.status!=="Completed"?`<button onclick="cancelBooking(${b.id})">Cancel</button>`:""}
        ${b.status==="Active"?`<button onclick="postponeBooking(${b.id})">Postpone</button>`:""}
      </td>
    `;
    if(b.status==="Cancelled") row.style.backgroundColor="rgba(255,0,0,0.1)";
    if(b.status==="Postponed") row.style.backgroundColor="rgba(255,255,0,0.1)";
    table.appendChild(row);
  });
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
      <td>${s.notes || ""}</td>
      <td><button onclick='generateReceipt(${JSON.stringify(s)})'>Receipt</button></td>
    `;
    table.appendChild(row);
  });
}

/* ===== INCOME SUMMARIES ===== */
function updateSummaries(){
  let daily={}, weekly={}, monthly={}, yearly={};
  completedServices.forEach(s=>{
    const d=parseDate(s.date);
    daily[s.date]=(daily[s.date]||0)+s.amountPaid;
    weekly[`${d.getFullYear()}-W${getWeekNumber(d)}`]=(weekly[`${d.getFullYear()}-W${getWeekNumber(d)}`]||0)+s.amountPaid;
    monthly[`${d.getFullYear()}-${d.getMonth()+1}`]=(monthly[`${d.getFullYear()}-${d.getMonth()+1}`]||0)+s.amountPaid;
    yearly[d.getFullYear()] = (yearly[d.getFullYear()]||0) + s.amountPaid;
  });
  document.getElementById("dailyTotal").innerText=sum(daily);
  document.getElementById("weeklyTotal").innerText=sum(weekly);
  document.getElementById("monthlyTotal").innerText=sum(monthly);
  document.getElementById("yearlyTotal").innerText=sum(yearly);
}

/* ===== TOP SERVICES ===== */
function getTopServices(period="all"){
  const counts={};
  completedServices.forEach(s=>{
    counts[s.service]=(counts[s.service]||0)+1;
  });
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
    data:{ labels, datasets:[{label:'Income', data:data, borderColor:'gold', backgroundColor:'rgba(255,215,0,0.2)'}]}
  });
}

function drawTopServicesChart(){
  const ctx=document.getElementById("topServicesChart").getContext("2d");
  const top = getTopServices();
  if(topServicesChart) topServicesChart.destroy();
  topServicesChart = new Chart(ctx,{
    type:'bar',
    data:{ labels: top.map(s=>s[0]), datasets:[{label:'Bookings', data: top.map(s=>s[1]), backgroundColor:'silver'}]}
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
  <p>Notes: ${service.notes || ""}</p>
  <script>window.print();</script>`);
}

/* ===== PDF EXPORT ===== */
document.getElementById("exportPDF").addEventListener("click", () => {
  const element = document.querySelector(".content-wrapper");
  const opt = {
    margin: 0.5,
    filename: `Spa_Report_${new Date().toISOString().split("T")[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
});

/* ===== FORM SUBMISSIONS ===== */
document.getElementById("bookingForm").addEventListener("submit", e=>{
  e.preventDefault();
  addBooking(
    document.getElementById("clientName").value,
    document.getElementById("serviceName").value,
    document.getElementById("bookingDate").value
  );
  e.target.reset();
});

document.getElementById("walkInForm").addEventListener("submit", e=>{
  e.preventDefault();
  addWalkIn(
    document.getElementById("walkClient").value,
    document.getElementById("walkService").value,
    document.getElementById("walkTotal").value,
    document.getElementById("walkPaid").value
  );
  e.target.reset();
});

/* ===== INIT ===== */
checkLogin();
