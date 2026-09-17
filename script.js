document.addEventListener("DOMContentLoaded", () => {
    const dateObj = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const liveDate = document.getElementById('live-date');
    if (liveDate) liveDate.innerText = dateObj.toLocaleDateString('id-ID', options);
    generateMockData();
});

let currentBgIndex = 1;
setInterval(() => {
    document.getElementById(`bg-${currentBgIndex}`).classList.remove('active');
    currentBgIndex = currentBgIndex === 5 ? 1 : currentBgIndex + 1;
    document.getElementById(`bg-${currentBgIndex}`).classList.add('active');
}, 6000);

function navigate(pageId) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    const bgOverlay = document.getElementById('global-overlay');
    const bgs = document.querySelectorAll('.bg-slide');
    
    if (pageId === 'page-principal') {
        bgOverlay.style.display = 'none'; bgs.forEach(b => b.style.display = 'none');
        document.body.classList.remove('kiosk-mode');
    } else {
        bgOverlay.style.display = 'block'; bgs.forEach(b => b.style.display = 'block');
        document.body.classList.add('kiosk-mode');
    }
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    let icon = 'fa-info-circle', color = 'bg-blue-600 border-blue-500 text-white';
    if(type === 'error') { icon = 'fa-circle-xmark'; color = 'bg-red-600 border-red-500 text-white'; }
    if(type === 'success') { icon = 'fa-circle-check'; color = 'bg-emerald-600 border-emerald-500 text-white'; }
    if(type === 'warning') { icon = 'fa-triangle-exclamation'; color = 'bg-yellow-400 border-yellow-500 text-black'; }
    
    toast.className = `${color} border px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform translate-y-5 opacity-0 transition-all duration-300 z-[9999] pointer-events-auto`;
    toast.innerHTML = `<i class="fa-solid ${icon} text-lg shrink-0"></i> <span class="font-semibold text-sm tracking-wide">${msg}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-5', 'opacity-0'), 10);
    setTimeout(() => { toast.classList.add('translate-y-5', 'opacity-0'); setTimeout(() => toast.remove(), 400); }, 3500);
}

function openGuideModal() { const m = document.getElementById('modal-guide'), c = document.getElementById('guide-content'); m.classList.remove('hidden'); setTimeout(()=>c.classList.replace('scale-0','scale-100'), 10); }
function closeGuideModal() { const c = document.getElementById('guide-content'); c.classList.replace('scale-100','scale-0'); setTimeout(()=>document.getElementById('modal-guide').classList.add('hidden'), 300); }
function openPrincipalLogin() { const m = document.getElementById('modal-auth-kepsek'), c = document.getElementById('auth-content'); m.classList.remove('hidden'); document.getElementById('kepsek-pin').value=''; setTimeout(()=> { c.classList.replace('scale-0','scale-100'); document.getElementById('kepsek-pin').focus(); }, 10); }
function closePrincipalLogin() { const c = document.getElementById('auth-content'); c.classList.replace('scale-100','scale-0'); setTimeout(()=>document.getElementById('modal-auth-kepsek').classList.add('hidden'), 300); }

function verifyPrincipalLogin(e) {
    e.preventDefault();
    if (document.getElementById('kepsek-pin').value === 'kepsek123') {
        closePrincipalLogin();
        showToast("Autentikasi Valid. Membuka Portal Eksekutif...", "success");
        setTimeout(() => { navigate('page-principal'); initDashboardData(); }, 400);
    } else {
        showToast("Sandi Salah. Akses Ditolak.", "error"); document.getElementById('kepsek-pin').value = '';
    }
}
function logoutPrincipal() {
    if(window.innerWidth < 768) toggleMobileSidebar();
    showToast("Sesi Eksekutif Diakhiri. Kiosk kembali ke Mode Publik.", "warning");
    navigate('page-main');
}

function showTicketModal(title, desc) { document.getElementById('ticket-title').innerText = title; document.getElementById('ticket-desc').innerText = desc; const m = document.getElementById('ticket-modal'), c = document.getElementById('ticket-content'); m.classList.remove('hidden'); setTimeout(()=>c.classList.replace('scale-0','scale-100'), 10); }
function closeTicket() { const c = document.getElementById('ticket-content'); c.classList.replace('scale-100','scale-0'); setTimeout(()=>{ document.getElementById('ticket-modal').classList.add('hidden'); navigate('page-main'); }, 300); }

/* --- FITUR CHECKIN WIZARD & CAMERA --- */
let checkinStream = null;
function goToCheckinStep(stepNumber) {
    if (stepNumber === 2 && (!document.getElementById('w-name').value || !document.getElementById('w-phone').value || !document.getElementById('w-agency').value)) { showToast("Lengkapi semua kolom identitas wajib (*)", "error"); return; }
    if (stepNumber === 3 && (!document.getElementById('w-target').value || !document.getElementById('w-detail').value)) { showToast("Pilih tujuan dan tuliskan rincian pesan (*)", "error"); return; }
    if (stepNumber === 4 && !document.getElementById('w-consent').checked) { showToast("Persetujuan pengambilan gambar diwajibkan", "error"); return; }
    if (stepNumber === 4) startCheckinCamera();

    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    document.getElementById('wizard-progress').style.width = ['0%', '33%', '66%', '100%'][stepNumber-1];
    
    for(let i=1; i<=4; i++) {
        const ind = document.getElementById(`ind-${i}`); const icon = ind.querySelector('.step-icon'); const text = ind.querySelector('.step-text');
        if (i <= stepNumber) { ind.classList.add('active'); icon.classList.remove('bg-primary', 'border-white/30', 'text-white'); icon.classList.add('bg-accent', 'text-primary', 'shadow-[0_0_15px_rgba(212,175,55,0.5)]', 'border-transparent'); text.classList.replace('text-white/50', 'text-accent'); } 
        else { ind.classList.remove('active'); icon.classList.remove('bg-accent', 'text-primary', 'shadow-[0_0_15px_rgba(212,175,55,0.5)]', 'border-transparent'); icon.classList.add('bg-primary', 'border-white/30', 'text-white'); text.classList.replace('text-accent', 'text-white/50'); }
    }
}
function resetCheckinWizard() {
    document.querySelectorAll('#page-checkin input, #page-checkin textarea, #page-checkin select').forEach(el => el.value = '');
    document.getElementById('w-consent').checked = false; document.getElementById('checkin-canvas').classList.add('hidden');
    stopCheckinCamera(); goToCheckinStep(1);
}
async function startCheckinCamera() {
    try { const vid = document.getElementById('checkin-camera'); checkinStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); vid.srcObject = checkinStream; vid.onloadedmetadata = () => document.getElementById('checkin-cam-status').style.display = 'none';
    } catch(e) { showToast("Gagal mengakses kamera perangkat.", "error"); }
}
function stopCheckinCamera() { if (checkinStream) { checkinStream.getTracks().forEach(t => t.stop()); checkinStream = null; } document.getElementById('checkin-cam-status').style.display = 'flex'; }
function takeCheckinPicture() {
    if(!checkinStream) { showToast("Kamera tidak aktif.", "error"); return; }
    const v = document.getElementById('checkin-camera'), c = document.getElementById('checkin-canvas');
    c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); c.classList.remove('hidden'); showToast("Wajah berhasil direkam.", "success");
}
function submitCheckin() {
    if(document.getElementById('checkin-canvas').classList.contains('hidden')) { showToast("Wajib merekam wajah.", "error"); return; }
    stopCheckinCamera(); showTicketModal("Tamu Lobi Tercatat!", "Silakan tunggu di lobi. Anda masuk dalam antrean reguler."); resetCheckinWizard();
}

/* --- FITUR SCHEDULE FORM & CAMERA --- */
let schStream = null;
function updateFileName(input) {
    const nameEl = document.getElementById('file-name'), iconEl = document.getElementById('file-icon');
    if (input.files && input.files[0]) { nameEl.innerText = input.files[0].name; nameEl.classList.replace('text-gray-400', 'text-emerald-400'); iconEl.classList.replace('fa-cloud-arrow-up', 'fa-file-circle-check'); iconEl.classList.add('text-emerald-400'); } 
    else { nameEl.innerText = 'Lampirkan Surat (PDF)'; nameEl.classList.replace('text-emerald-400', 'text-gray-400'); iconEl.classList.replace('fa-file-circle-check', 'fa-cloud-arrow-up'); iconEl.classList.remove('text-emerald-400'); }
}
async function startScheduleCamera() {
    try { const vid = document.getElementById('schedule-camera'), btn = document.getElementById('btn-start-sch-cam'); schStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); vid.srcObject = schStream; vid.classList.remove('hidden'); btn.classList.add('hidden'); 
    } catch(e) { showToast("Kamera ditolak oleh peramban.", "error"); }
}
function stopScheduleCamera() {
    if (schStream) { schStream.getTracks().forEach(t => t.stop()); schStream = null; }
    document.getElementById('schedule-camera').classList.add('hidden'); document.getElementById('btn-start-sch-cam').classList.remove('hidden');
}
function takeSchedulePicture() {
    if(!schStream) { showToast("Silakan Nyalakan Kamera terlebih dahulu.", "error"); return; }
    const v = document.getElementById('schedule-camera'), c = document.getElementById('schedule-canvas');
    c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); c.classList.remove('hidden'); showToast("Wajah berhasil direkam dan dilampirkan.", "success");
}
function submitScheduleForm(e) {
    e.preventDefault();
    if(document.getElementById('schedule-canvas').classList.contains('hidden')) { showToast("Pengajuan Gagal. Anda wajib merekam foto wajah pada bagian 4.", "error"); return; }
    stopScheduleCamera(); showTicketModal("Jadwal Diajukan!", "Permohonan lengkap beserta foto telah dikirim ke Aplikasi Kepsek. Simpan kode resi Anda untuk mengecek status di menu Lobi.");
    e.target.reset(); document.getElementById('schedule-canvas').classList.add('hidden'); const input = document.getElementById('form-schedule').querySelector('input[type="file"]'); Object.defineProperty(input, 'files', {value: []}); updateFileName(input); 
}

/* --- FITUR TICKET STATUS --- */
function openTicketStatusModal() { const m = document.getElementById('modal-status'), c = document.getElementById('status-content'); m.classList.remove('hidden'); document.getElementById('ticket-input').value = ''; document.getElementById('ticket-result').classList.add('hidden'); setTimeout(()=>c.classList.replace('scale-0','scale-100'), 10); }
function closeTicketStatusModal() { const c = document.getElementById('status-content'); c.classList.replace('scale-100','scale-0'); setTimeout(()=>document.getElementById('modal-status').classList.add('hidden'), 300); }
function checkTicketStatus(e) {
    e.preventDefault(); const input = document.getElementById('ticket-input').value.toUpperCase();
    if(input.length < 5) { showToast("Format tiket tidak valid.", "error"); return; }
    showToast("Mencari data di server...", "info");
    setTimeout(() => {
        document.getElementById('ticket-result').classList.remove('hidden');
        if(input.length % 2 === 0) {
            document.getElementById('res-badge').innerText = "DISETUJUI KEPSEK"; document.getElementById('res-badge').className = "text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30";
        } else {
            document.getElementById('res-badge').innerText = "MENUNGGU (PENDING)"; document.getElementById('res-badge').className = "text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30";
        }
    }, 1000);
}

/* --- FITUR DASHBOARD --- */
function switchTab(tabId) {
    document.querySelectorAll('.dash-tab').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(tabId); target.classList.remove('hidden');
    if (tabId === 'tab-inbox' || tabId === 'tab-schedule' || tabId === 'tab-staff' || tabId === 'tab-audit') { target.classList.add('flex'); } else { target.classList.add('block'); }
    
    document.querySelectorAll('.dash-nav-btn').forEach(btn => { btn.classList.remove('bg-white/10', 'text-white'); btn.classList.add('hover:bg-white/5', 'text-gray-400'); });
    const activeBtn = document.getElementById(tabId.replace('tab', 'nav'));
    if(activeBtn){ activeBtn.classList.add('bg-white/10', 'text-white'); activeBtn.classList.remove('hover:bg-white/5', 'text-gray-400'); }
    
    const titles = { 'tab-overview': 'Ringkasan Utama Dasbor', 'tab-inbox': 'Pusat Pesan & Walk-in', 'tab-schedule': 'Manajemen Kalender Master', 'tab-staff': 'Manajemen Staf Tata Usaha', 'tab-audit': 'Audit Log & Keamanan Sistem', 'tab-reports': 'Analitik Performa Kunjungan', 'tab-settings': 'Konfigurasi Profil Eksekutif' };
    document.getElementById('dash-title').innerText = titles[tabId];
    if(tabId === 'tab-reports') renderBarChart();
}

function toggleMobileSidebar() { document.getElementById('principal-sidebar').classList.toggle('mobile-open'); document.getElementById('mobile-sidebar-overlay').classList.toggle('active'); }

const simDB = { activities: [], inbox: [], staff: [], audit: [] };
function generateMockData() {
    simDB.activities = [
        { time: '10:45', name: 'Dr. Hendra (Diknas)', cat: 'Tamu VIP', status: 'PENDING' },
        { time: '09:30', name: 'Kurir J&T Ekspres', cat: 'Titip Barang', status: 'APPROVED' },
        { time: '08:15', name: 'Ibu Ratna Susanti', cat: 'Walk-In', status: 'APPROVED' },
        { time: '07:50', name: 'Bpk. Ahmad (Vendor ATK)', cat: 'Tamu Biasa', status: 'REJECTED' }
    ];
    simDB.inbox = [
        { id: 101, sender: "Kementerian Pendidikan Pusat", email: "info@kemdikbud.go.id", time: "10:15 WIB", title: "Undangan Rapat Koordinasi Nasional", body: "Yth. Ibu Kepala Sekolah,\n\nSehubungan dengan peningkatan mutu pendidikan, kami mengundang Ibu untuk hadir dalam Rapat Koordinasi Nasional yang akan diselenggarakan secara hybrid. Kurir kami sedang menunggu di lobi untuk menyerahkan dokumen hardcopy beserta TOR acara.\n\nHarap berkenan menemui atau mengutus Wakil untuk menerima dokumen ini.\n\nSalam hormat,\nSekretariat.", read: false, avatar: "K" },
        { id: 102, sender: "Vendor IT Cemerlang", email: "sales@itcemerlang.com", time: "09:30 WIB", title: "Pengajuan Maintenance Server CBT", body: "Selamat Pagi Ibu,\n\nTeknisi kami telah tiba di sekolah untuk jadwal pemeliharaan rutin server ujian (CBT) dan sistem SiTamu. Mohon izin akses masuk ke ruang server.\n\nTerima kasih.", read: false, avatar: "V" }
    ];
    simDB.staff = [
        { id: 'STF-01', name: 'Andi Sujarwo', role: 'Kepala Tata Usaha', lastLogin: 'Hari ini, 07:00 WIB', status: 'Aktif' },
        { id: 'STF-02', name: 'Siti Aminah', role: 'Staf Resepsionis 1', lastLogin: 'Hari ini, 07:15 WIB', status: 'Aktif' }
    ];
    const actions = ['Login Sistem berhasil', 'Akses Modul Pengaturan', 'Menyetujui Jadwal Temu', 'Menolak Tamu Walk-in', 'Memperbarui Profil'];
    for(let i=1; i<=5; i++) {
        simDB.audit.push({ time: `2026-10-${Math.floor(Math.random()*10)+10} 09:${Math.floor(Math.random()*50)+10}:00`, ip: `192.168.1.${Math.floor(Math.random()*255)}`, actor: i%3 === 0 ? 'Ibu Kepsek' : 'Siti Aminah (TU)', action: actions[Math.floor(Math.random()*actions.length)] });
    }
}

function getBadge(status) {
    if(status === 'PENDING') return `<span class="badge badge-pending">Menunggu</span>`;
    if(status === 'APPROVED' || status === 'Aktif') return `<span class="badge badge-approved"><i class="fa-solid fa-check"></i> Disetujui / Aktif</span>`;
    if(status === 'REJECTED') return `<span class="badge badge-rejected"><i class="fa-solid fa-xmark"></i> Ditolak</span>`;
    return '';
}

function initDashboardData() {
    setTimeout(() => {
        const actList = document.getElementById('quick-activity-list'); actList.innerHTML = '';
        simDB.activities.forEach(act => { actList.innerHTML += `<tr class="border-b border-gray-100 hover:bg-gray-50 transition"><td class="font-medium text-gray-500"><i class="fa-regular fa-clock mr-2 text-gray-400"></i>${act.time}</td><td class="font-bold text-gray-800">${act.name}</td><td><span class="text-[10px] bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-gray-600 font-bold uppercase tracking-wider">${act.cat}</span></td><td>${getBadge(act.status)}</td></tr>`; });
        renderInboxList(); renderStaffTable(); renderAuditLog();
    }, 800);
}

function renderInboxList() {
    const listArea = document.getElementById('inbox-list-area'); listArea.innerHTML = '';
    simDB.inbox.forEach((msg) => {
        let unreadClass = !msg.read ? 'unread font-extrabold' : 'font-semibold';
        listArea.innerHTML += `<div class="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition" onclick="openMessage(${msg.id})">
            <div class="flex justify-between items-center mb-1"><h4 class="text-sm text-gray-800 truncate pr-4 ${unreadClass}">${msg.sender}</h4><span class="text-[10px] text-gray-500 whitespace-nowrap">${msg.time}</span></div>
            <p class="text-xs text-gray-800 font-medium truncate mb-1">${msg.title}</p><p class="text-[11px] text-gray-500 truncate">${msg.body}</p></div>`;
    });
}

function openMessage(id) {
    const msg = simDB.inbox.find(m => m.id === id); msg.read = true;
    const detailArea = document.getElementById('inbox-detail-area');
    detailArea.innerHTML = `<div class="p-6 border-b border-gray-100 flex justify-between items-start"><div class="flex gap-4"><div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">${msg.avatar}</div><div><h2 class="text-xl font-bold text-gray-800 mb-1 leading-tight">${msg.title}</h2><p class="text-sm font-semibold text-gray-700">${msg.sender} <span class="font-normal text-gray-500">&lt;${msg.email}&gt;</span></p></div></div></div><div class="p-8 flex-1 overflow-y-auto bg-gray-50/30"><div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[300px]"><p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">${msg.body}</p></div></div>`;
    renderInboxList();
}

function renderStaffTable() {
    const tbody = document.getElementById('staff-list-area'); if(!tbody) return; tbody.innerHTML = '';
    simDB.staff.forEach(s => { tbody.innerHTML += `<tr><td><div class="font-bold text-gray-800">${s.name}</div><div class="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">ID: ${s.id}</div></td><td><div class="bg-gray-100 px-3 py-1.5 inline-block rounded border border-gray-200 text-xs font-bold text-gray-700">${s.role}</div></td><td class="text-sm font-medium text-gray-600">${s.lastLogin}</td><td>${getBadge(s.status)}</td><td><button class="text-blue-600 hover:underline text-xs font-bold">Edit Akses</button></td></tr>`; });
}

function renderAuditLog() {
    const tbody = document.getElementById('audit-list-area'); if(!tbody) return; tbody.innerHTML = '';
    simDB.audit.forEach(log => { tbody.innerHTML += `<tr><td class="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block mt-2 border border-gray-200">${log.time}</td><td class="text-xs text-gray-500 font-medium">${log.ip}</td><td class="font-bold text-gray-700 text-sm"><i class="fa-solid fa-user-shield text-gray-400 mr-2"></i>${log.actor}</td><td class="font-bold text-sm text-gray-800">${log.action}</td></tr>`; });
}

let chartRendered = false;
function renderBarChart() {
    if (chartRendered) return; const wrap = document.getElementById('bar-chart-wrapper'); if(!wrap) return;
    const rawData = [45, 80, 55, 95, 70, 20, 10]; const maxVal = Math.max(...rawData); wrap.innerHTML = '';
    rawData.forEach(val => { let heightPct = (val / maxVal) * 100; if(heightPct < 5) heightPct = 5; wrap.innerHTML += `<div class="chart-bar-wrap"><div class="chart-tooltip">${val} Kunjungan</div><div class="chart-bar" style="height: 0%;" data-target="${heightPct}"></div></div>`; });
    setTimeout(() => { document.querySelectorAll('.chart-bar').forEach(bar => { bar.style.height = `${bar.getAttribute('data-target')}%`; }); }, 100); chartRendered = true;
}

function updateStatusIndicator(text, colorClass) {
    const ind = document.getElementById('status-indicator');
    ind.className = `text-xs font-medium mt-0.5 ${colorClass}`;
    ind.innerHTML = `<i class="fa-solid fa-circle text-[8px] mr-1"></i>${text}`;
}
function saveSettings(e) { e.preventDefault(); showToast("Pengaturan profil berhasil disimpan.", "success"); }
