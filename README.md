# Christine's Beauty Parlour Management PWA

A Progressive Web App (PWA) to manage appointments, walk-ins, completed services, and income reports for **Christine's Beauty Parlour**. Works offline, installable on desktop and mobile devices, providing an easy and efficient way to track spa operations.

---

## 🌟 Features
- **Add Bookings**: Schedule appointments with client and service details.  
- **Manage Walk-Ins**: Record walk-in clients, payments, and service details.  
- **Complete Bookings**: Mark bookings as completed and track payments. 
- **Cancel/Postpone Bookings**: Manage changes to appointments.  
- **Income Summaries**: View daily, weekly, monthly, and yearly income.  
- **Top Services**: See the most popular services booked.  
- **Charts & Reports**: Visualize income and top services using charts.  
- **Export PDF**: Download the dashboard summary as a PDF.  
- **Installable App**: Works as a standalone app on desktop and mobile.  

---

## 💻 Installation

   ### Option 1: Open Locally
1. Clone or download the repository:
   ```bash
   git clone https://github.com/Cherryl-A-Schneider/Christine-beauty-parlour.git

2. Navigate to the project folder.

3. Open index.html in a modern browser (Chrome, Edge, Firefox).

4. Use the *Install App* button in the PWA prompt to install it on your device.

### Option 2: Host Online

For 24/7 access for your client, host the app on any static hosting platform:

.GitHub Pages: Free, simple hosting for static sites.

.Netlify: Free tier with instant deployment.

.Vercel: Great for static apps with PWA support.

After hosting, your client can install the PWA by opening the hosted index.html URL in a browser. The *Install App* button or browser PWA prompt will allow them to install it on desktop or mobile.

#### ⚡ PWA Notes

The app works offline using service workers.

All client data (bookings, payments, walk-ins) is stored locally on their device using localStorage.

Installable via the Install App button or browser PWA prompt.


# 📂 Repository Structure
SpaApp/
├─ icons/                 # App icons (192x192, 512x512)
├─ app.js                 # Main JavaScript functionality
├─ sw.js                  # Service Worker for offline support
├─ style.css              # App styling
├─ christines-beautyparlourmanagement.html  # Main HTML file
├─ manifest.json          # PWA manifest file
└─ README.md              # This file

 # 🔒 Data Privacy

-All data is stored locally on the client’s device.

-No external servers or cloud storage are used.

-Only the device owner can access their bookings and financial data.

# 📄 License

This project is licensed under the MIT License.

# 👩‍💼 Client Ready

This PWA is customized for Christine's Beauty Parlour to provide a professional, offline-capable, and installable experience for daily spa management.

