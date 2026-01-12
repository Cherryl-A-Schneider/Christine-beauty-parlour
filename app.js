let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
let completedServices = JSON.parse(localStorage.getItem("completedServices")) || [];

/* ===== STORAGE ===== */
function saveData() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
  localStorage.setItem("completedServices", JSON.stringify(completedServices));
}

/* ===== HELPERS ===== */
function parseDate(dateStr) { return new Date(dateStr); }
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getFullYear(),0,1));
  return Math.ceil((((d - yearStart)/86400000)+1)/7);
}

/* ===== BOOKINGS ===== */
function addBooking(client, service, date){
  bookings.push({id: Date.now(), client, service, date, status: "Active"});
  saveData();
  renderBookings();
}

/* ===== BOOKING STATUS ===== */
function completeBookingPrompt(id){
  const total = prompt("Enter total amount:");
  if(total===null) return;
  const paid = prompt("Enter amount paid:");
  if(paid===null) return;
  completeBooking(id, total, paid);
}

function completeBooking(id, total, paid){
  const index = bookings.findIndex(b=>b.id===id);
  if(index===-1) return;
  saveCompletedService(bookings[index].client, bookings[index].service, bookings[index].date, total, paid, "Booking");
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
function addWalkIn(client, service, total, paid){
  saveCompletedService(client, service, new Date().toISOString().split("T")[0], total, paid, "Walk-in");
}

/* ===== COMPLETED SERVICES ===== */
function saveCompletedService(client, service, date, total, paid, type){
  const totalAmount = Number(total) || 0;
  const amountPaid = Number(paid) || 0;
  completedServices.push({
    client,
    service,
    date,
    type,
    totalAmount,
    amountPaid,
    unpaidAmount: Math.max(0, totalAmount - amountPaid)
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
  completedServices.forEach((s, index)=>{
    const row = document.createElement("tr");
    row.innerHTML=`
      <td>${s.client}</td>
      <td>${s.service}</td>
      <td>${s.date}</td>
      <td>${s.type}</td>
      <td>${s.totalAmount}</td>
      <td>${s.amountPaid}</td>
      <td>${s.unpaidAmount}</td>
      <td>
        <button onclick='generateReceipt(${JSON.stringify(s)})'>Receipt</button>
        <button onclick='deleteService(${index})'>Delete</button>
      </td>
    `;
    table.appendChild(row);
  });
}

/* ===== DELETE FUNCTIONS ===== */
function deleteService(index){
  if(confirm('Are you sure you want to delete this record?')){
    completedServices.splice(index, 1);
    saveData();
    renderCompletedServices();
    updateSummaries();
    renderTopServices();
    drawIncomeChart();
    drawTopServicesChart();
  }
}

// Clear all data button
document.getElementById('clearAllBtn')?.addEventListener('click', () => {
  if(confirm('This will delete ALL bookings and completed services. Are you sure?')){
    localStorage.clear();
    bookings = [];
    completedServices = [];
    renderBookings();
    renderCompletedServices();
    updateSummaries();
    renderTopServices();
    drawIncomeChart();
    drawTopServicesChart();
  }
});

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
function sum(obj){ return Object.values(obj).reduce((a,b)=>a+b,0); }

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
    data:{
      labels: labels,
      datasets:[{label:'Income', data:data, borderColor:'gold', backgroundColor:'rgba(255,215,0,0.2)'}]
    }
  });
}

function drawTopServicesChart(){
  const ctx=document.getElementById("topServicesChart").getContext("2d");
  const top = getTopServices();
  if(topServicesChart) topServicesChart.destroy();
  topServicesChart = new Chart(ctx,{
    type:'bar',
    data:{
      labels: top.map(s=>s[0]),
      datasets:[{label:'Bookings', data: top.map(s=>s[1]), backgroundColor:'silver'}]
    }
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
  <script>window.print();</script>`);
}

/* ===== PDF EXPORT ===== */
document.getElementById("exportPDF").addEventListener("click", () => {
  const element = document.querySelector(".content-wrapper");
  const opt = {
    margin:       0.5,
    filename:     `Spa_Report_${new Date().toISOString().split("T")[0]}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
});

/* ===== INIT ===== */
renderBookings();
renderCompletedServices();
updateSummaries();
renderTopServices();
drawIncomeChart();
drawTopServicesChart();

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
