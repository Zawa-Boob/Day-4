/**
 * 1. INISIALISASI WAKTU & DATA
 */
document.addEventListener("DOMContentLoaded", () => {
    const dateObj = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const liveDate = document.getElementById('live-date');
    if (liveDate) liveDate.innerText = dateObj.toLocaleDateString('id-ID', options);
    
    try { generateMockData(); } catch(e) { console.error("DB Load Error:", e); }
});

/* BACKGROUND LOOP */
let currentBgIndex = 1;
setInterval(() => {
    const current = document.getElementById(`bg-${currentBgIndex}`);
    if(current) current.classList.remove('active');
    currentBgIndex = currentBgIndex === 5 ? 1 : currentBgIndex + 1;
    const next = document.getElementById(`bg-${currentBgIndex}`);
    if(next) next.classList.add('active');
}, 5000);

/* --- GLOBAL ROUTING & TOAST --- */
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');
    
    const bgOverlay = document.getElementById('global-overlay');
    const bgs = document.querySelectorAll('.bg-slide');
    
    if (pageId === 'page-principal') {
        if(bgOverlay) bgOverlay.style.display = 'none'; 
        bgs.forEach(b => b.style.display = 'none'); 
        document.body.classList.remove('kiosk-mode');
    } else {
        if(bgOverlay) bgOverlay.style.display = 'block'; 
        bgs.forEach(b => b.style.display = 'block'); 
        document.body.classList.add('kiosk-mode');
        
        if(pageId !== 'page-checkin') stopCheckinCamera();
        if(pageId !== 'page-schedule') stopScheduleCamera();
    }
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    
    let icon = 'fa-info-circle', color = 'bg-gray-800 border-gray-700 text-white';
    if(type === 'error') { icon = 'fa-circle-xmark'; color = 'bg-red-600 border-red-500 text-white'; }
    if(type === 'success') { icon = 'fa-circle-check'; color = 'bg-gray-900 border-gray-700 text-[#D4FF59]'; }
    if(type === 'warning') { icon = 'fa-triangle-exclamation'; color = 'bg-yellow-400 border-yellow-500 text-black'; }
    
    toast.className = `${color} border px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transform -translate-y-10 opacity-0 transition-all duration-300 pointer-events-auto mt-2`;
    toast.innerHTML = `<i class="fa-solid ${icon} text-lg shrink-0"></i> <span class="font-medium text-sm tracking-wide leading-tight">${msg}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('-translate-y-10', 'opacity-0'), 10);
    setTimeout(() => { toast.classList.add('-translate-y-10', 'opacity-0'); setTimeout(() => toast.remove(), 400); }, 3500);
}

/* --- KIOSK MODALS --- */
function openGuideModal() { const m = document.getElementById('modal-guide'), c = document.getElementById('guide-content'); if(m) m.classList.remove('hidden'); setTimeout(()=> { if(c) c.classList.replace('scale-0','scale-100'); }, 10); }
function closeGuideModal() { const c = document.getElementById('guide-content'); if(c) c.classList.replace('scale-100','scale-0'); setTimeout(()=> { const m = document.getElementById('modal-guide'); if(m) m.classList.add('hidden'); }, 300); }

function openPrincipalLogin() { 
    const m = document.getElementById('modal-auth-kepsek'), c = document.getElementById('auth-content'); 
    if(m) m.classList.remove('hidden'); 
    const pin = document.getElementById('kepsek-pin'); if(pin) pin.value=''; 
    setTimeout(()=> { if(c) c.classList.replace('scale-0','scale-100'); if(pin) pin.focus(); }, 10); 
}
function closePrincipalLogin() { const c = document.getElementById('auth-content'); if(c) c.classList.replace('scale-100','scale-0'); setTimeout(()=> { const m = document.getElementById('modal-auth-kepsek'); if(m) m.classList.add('hidden'); }, 300); }

function verifyPrincipalLogin(e) {
    e.preventDefault();
    const pin = document.getElementById('kepsek-pin');
    if (pin && pin.value === 'kepsek123') {
        closePrincipalLogin(); showToast("Autentikasi Valid. Membuka Dasbor Aplikasi...", "success");
        setTimeout(() => { navigate('page-principal'); initDashboardData(); }, 400); 
    } else { 
        showToast("Sandi Salah. Akses Ditolak.", "error"); 
        if(pin) pin.value = ''; 
    }
}
function logoutPrincipal() {
    if(window.innerWidth < 1024) toggleMobileSidebar();
    showToast("Sesi Eksekutif Diakhiri. Portal Web diaktifkan kembali.", "warning");
    navigate('page-main');
}

function showTicketModal(title, desc) { 
    const code = 'RSV-' + Math.floor(1000 + Math.random() * 9000);
    const codeEl = document.getElementById('ticket-code'); if(codeEl) codeEl.innerText = code;
    const titleEl = document.getElementById('ticket-title'); if(titleEl) titleEl.innerText = title; 
    const descEl = document.getElementById('ticket-desc'); if(descEl) descEl.innerText = desc; 
    
    const m = document.getElementById('ticket-modal'), c = document.getElementById('ticket-content'); 
    if(m) m.classList.remove('hidden'); 
    setTimeout(()=> { if(c) c.classList.replace('scale-0','scale-100'); }, 10); 
}
function closeTicket() { const c = document.getElementById('ticket-content'); if(c) c.classList.replace('scale-100','scale-0'); setTimeout(()=>{ const m = document.getElementById('ticket-modal'); if(m) m.classList.add('hidden'); navigate('page-main'); }, 300); }

/* --- FITUR COPY RESI --- */
function copyResi() {
    const codeEl = document.getElementById('ticket-code');
    if(!codeEl) return;
    const code = codeEl.innerText;
    
    navigator.clipboard.writeText(code).then(() => {
        const tooltip = document.getElementById('copy-tooltip');
        if(tooltip) { tooltip.innerText = "Tersalin!"; tooltip.classList.replace('bg-gray-800', 'bg-green-600'); }
        showToast("Kode Resi disalin ke clipboard", "success");
        setTimeout(() => {
            if(tooltip) { tooltip.innerText = "Klik untuk salin"; tooltip.classList.replace('bg-green-600', 'bg-gray-800'); }
        }, 2000);
    }).catch(err => {
        const textArea = document.createElement("textarea");
        textArea.value = code; document.body.appendChild(textArea); textArea.select();
        try { document.execCommand('copy'); showToast("Kode Resi disalin", "success"); } catch (ex) { showToast("Gagal menyalin", "error"); }
        document.body.removeChild(textArea);
    });
}

function openTicketStatusModal() { const m = document.getElementById('modal-status'), c = document.getElementById('status-content'); if(m) m.classList.remove('hidden'); const tInput = document.getElementById('ticket-input'); if(tInput) tInput.value = ''; const res = document.getElementById('ticket-result'); if(res) res.classList.add('hidden'); setTimeout(()=> { if(c) c.classList.replace('scale-0','scale-100'); }, 10); }
function closeTicketStatusModal() { const c = document.getElementById('status-content'); if(c) c.classList.replace('scale-100','scale-0'); setTimeout(()=> { const m = document.getElementById('modal-status'); if(m) m.classList.add('hidden'); }, 300); }
function checkTicketStatus(e) {
    e.preventDefault(); 
    const inputEl = document.getElementById('ticket-input');
    if(!inputEl) return;
    const input = inputEl.value.toUpperCase();
    
    if(input.length < 5) { showToast("Format tiket tidak valid.", "error"); return; }
    showToast("Menyelaraskan data server...", "info");
    
    setTimeout(() => {
        const resCon = document.getElementById('ticket-result');
        if(resCon) resCon.classList.remove('hidden');
        
        const badge = document.getElementById('res-badge');
        if(badge) {
            if(input.length % 2 === 0) {
                badge.innerText = "DISETUJUI KEPSEK"; badge.className = "text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30";
            } else {
                badge.innerText = "MENUNGGU (PENDING)"; badge.className = "text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30";
            }
        }
    }, 1000);
}

function renderPublicInfo() {
    const list = document.getElementById('public-announcement-list');
    if(list && list.innerHTML.trim() === '') {
        const announcements = [
            { date: "17 Okt 2026", title: "Penerimaan Siswa Baru", desc: "Pendaftaran gelombang pertama dibuka bulan depan." },
            { date: "15 Okt 2026", title: "Rapat Komite Sekolah", desc: "Undangan telah dikirim via email. Acara berjalan daring." }
        ];
        list.innerHTML = '';
        announcements.forEach(a => { list.innerHTML += `<div class="bg-black/40 p-4 rounded-xl border border-white/10 hover:border-orange-500/50 transition duration-300"><span class="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded mb-2 inline-block">${a.date}</span><h4 class="text-sm font-bold text-white mb-1">${a.title}</h4><p class="text-xs text-gray-400">${a.desc}</p></div>`; });
    }
}

/* --- FITUR WIZARD KIRIM PESAN & JADWAL (GABUNGAN) --- */
let checkinStream = null;
function updateCheckinFileName(input) {
    const nameEl = document.getElementById('c-file-name'), iconEl = document.getElementById('c-file-icon');
    if(!nameEl || !iconEl) return;
    if (input.files && input.files[0]) { 
        nameEl.innerText = input.files[0].name; nameEl.classList.replace('text-gray-400', 'text-accent'); 
        iconEl.classList.replace('fa-cloud-arrow-up', 'fa-file-circle-check'); iconEl.classList.add('text-accent'); 
    } else { 
        nameEl.innerText = 'Lampirkan File Resmi (Opsional)'; nameEl.classList.replace('text-accent', 'text-gray-400'); 
        iconEl.classList.replace('fa-file-circle-check', 'fa-cloud-arrow-up'); iconEl.classList.remove('text-accent'); 
    }
}

function goToCheckinStep(stepNumber) {
    const wName = document.getElementById('w-name'), wPhone = document.getElementById('w-phone');
    const wAgency = document.getElementById('w-agency'), wEmail = document.getElementById('w-email');
    
    if (stepNumber === 2 && (!wName || !wName.value || !wPhone || !wPhone.value || !wAgency || !wAgency.value || !wEmail || !wEmail.value)) { 
        showToast("Lengkapi semua kolom profil pengirim (*)", "error"); return; 
    }
    
    const wTarget = document.getElementById('w-target'), wDetail = document.getElementById('w-detail');
    if (stepNumber === 3 && (!wTarget || !wTarget.value || !wDetail || !wDetail.value)) { 
        showToast("Pilih kategori dan tulis rincian pesan/agenda (*)", "error"); return; 
    }
    
    const wConsent = document.getElementById('w-consent');
    if (stepNumber === 4 && (!wConsent || !wConsent.checked)) { 
        showToast("Persetujuan privasi keamanan diwajibkan.", "error"); return; 
    }
    
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    const stepEl = document.getElementById(`step-${stepNumber}`);
    if(stepEl) stepEl.classList.add('active');
    
    const prog = document.getElementById('wizard-progress');
    if(prog) prog.style.width = ['0%', '33%', '66%', '100%'][stepNumber-1];
    
    for(let i=1; i<=4; i++) {
        const ind = document.getElementById(`ind-${i}`); 
        if(!ind) continue;
        const icon = ind.querySelector('.step-icon'); const text = ind.querySelector('.step-text');
        
        if (i <= stepNumber) { 
            ind.classList.add('active'); icon.classList.replace('bg-primary', 'bg-accent'); icon.classList.replace('text-white', 'text-primary'); 
            icon.classList.remove('border'); icon.classList.add('shadow-[0_0_15px_rgba(212,175,55,0.5)]'); text.classList.replace('text-white/50', 'text-accent'); 
        } else { 
            ind.classList.remove('active'); icon.classList.replace('bg-accent', 'bg-primary'); icon.classList.replace('text-primary', 'text-white'); 
            icon.classList.add('border'); icon.classList.remove('shadow-[0_0_15px_rgba(212,175,55,0.5)]'); text.classList.replace('text-accent', 'text-white/50'); 
        }
    }
    if(stepNumber === 4) startCheckinCamera();
}

function resetCheckinWizard() {
    document.querySelectorAll('#page-checkin input[type="text"], #page-checkin input[type="tel"], #page-checkin input[type="email"], #page-checkin input[type="date"], #page-checkin input[type="time"], #page-checkin textarea, #page-checkin select').forEach(el => el.value = '');
    const wCon = document.getElementById('w-consent'); if(wCon) wCon.checked = false; 
    const cvs = document.getElementById('checkin-canvas'); if(cvs) cvs.classList.add('hidden');
    const input = document.getElementById('w-file'); if(input) { Object.defineProperty(input, 'files', {value: []}); updateCheckinFileName(input); }
    stopCheckinCamera(); goToCheckinStep(1);
}

async function startCheckinCamera() {
    try { 
        const vid = document.getElementById('checkin-camera'); const btn = document.getElementById('btn-start-checkin-cam');
        if(vid) {
            checkinStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); 
            vid.srcObject = checkinStream; vid.classList.remove('hidden'); 
        }
        if(btn) btn.classList.add('hidden');
    } catch(e) { showToast("Gagal mengakses modul kamera. Gunakan PC/HP dengan Webcam aktif.", "error"); }
}

function stopCheckinCamera() { 
    if (checkinStream) { checkinStream.getTracks().forEach(t => t.stop()); checkinStream = null; } 
    const vid = document.getElementById('checkin-camera'); if(vid) vid.classList.add('hidden');
    const btn = document.getElementById('btn-start-checkin-cam'); if(btn) btn.classList.remove('hidden');
}

function takeCheckinPicture() {
    if(!checkinStream) { showToast("Nyalakan kamera terlebih dahulu.", "error"); return; }
    const v = document.getElementById('checkin-camera'), c = document.getElementById('checkin-canvas');
    if(v && c) {
        c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); 
        c.classList.remove('hidden'); showToast("Wajah pengirim berhasil dienkripsi.", "success");
    }
}

function submitCheckin() {
    const canvas = document.getElementById('checkin-canvas');
    if(canvas && canvas.classList.contains('hidden')) { showToast("Wajib merekam wajah pengirim demi keamanan sistem.", "error"); return; }
    
    // MENGIRIM DATA KE DASHBOARD
    const name = document.getElementById('w-name') ? document.getElementById('w-name').value : '';
    const agency = document.getElementById('w-agency') ? document.getElementById('w-agency').value : '';
    const targetRaw = document.getElementById('w-target') ? document.getElementById('w-target').value : '';
    const loc = document.getElementById('w-location') ? document.getElementById('w-location').value : '';
    const reqDate = document.getElementById('w-date') ? document.getElementById('w-date').value : '';
    const reqTime = document.getElementById('w-time') ? document.getElementById('w-time').value : '';
    const detail = document.getElementById('w-detail') ? document.getElementById('w-detail').value : '';
    
    const fileIn = document.getElementById('w-file');
    const fileInput = (fileIn && fileIn.files.length > 0) ? true : false;
    
    const targetMap = {'laporan':'Laporan Umum', 'permohonan':'Permohonan Kebijakan', 'informasi':'Info Digital', 'rapat':'Pengajuan Rapat', 'dokumen':'Penyerahan Dokumen'};
    const targetStr = targetMap[targetRaw] || 'Pengajuan Baru';

    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ' WIB';
    
    let reqInfo = (reqDate && reqTime) ? `${reqDate} | ${reqTime}` : 'As Soon As Possible';
    let locInfo = loc || 'Via Website';

    // Push ke Database Memori
    simDB.inbox.unshift({ 
        id: Date.now(), sender: name, agency: agency, time: timeStr, reqDate: reqInfo, location: locInfo,
        title: targetStr, body: detail, hasFile: fileInput, status: 'PENDING', read: false, avatar: name.charAt(0).toUpperCase() 
    });

    try {
        renderDashboardMetrics();
        renderInboxList();
        renderNotifications(); 
    } catch(e) { console.error("Render Sync Error", e); }

    stopCheckinCamera(); 
    showTicketModal("Pengajuan Terkirim!", "Data dan pesan Anda telah diteruskan ke Dasbor Ibu Kepala Sekolah. Gunakan kode resi untuk mengecek status persetujuan."); 
    resetCheckinWizard();
}

        /* --- FITUR SCHEDULE FORM & CAMERA (DIJAGA 100% UTUH) --- */
        let schStream = null;
        
        function updateFileName(input) {
            const nameEl = document.getElementById('file-name');
            const iconEl = document.getElementById('file-icon');
            if(!nameEl || !iconEl) return;
            if (input.files && input.files[0]) {
                nameEl.innerText = input.files[0].name;
                nameEl.classList.replace('text-gray-400', 'text-emerald-400');
                iconEl.classList.replace('fa-cloud-arrow-up', 'fa-file-circle-check');
                iconEl.classList.add('text-emerald-400');
            } else {
                nameEl.innerText = 'Lampirkan Surat (PDF)';
                nameEl.classList.replace('text-emerald-400', 'text-gray-400');
                iconEl.classList.replace('fa-file-circle-check', 'fa-cloud-arrow-up');
                iconEl.classList.remove('text-emerald-400');
            }
        }
        
        async function startScheduleCamera() {
            try {
                const vid = document.getElementById('schedule-camera');
                const btn = document.getElementById('btn-start-sch-cam');
                schStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                if(vid) { vid.srcObject = schStream; vid.classList.remove('hidden'); }
                if(btn) btn.classList.add('hidden'); 
            } catch(e) { 
                showToast("Kamera diblokir oleh peramban (browser).", "error"); 
            }
        }
        
        function stopScheduleCamera() {
            if (schStream) { schStream.getTracks().forEach(t => t.stop()); schStream = null; }
            const vid = document.getElementById('schedule-camera'); if(vid) vid.classList.add('hidden');
            const btn = document.getElementById('btn-start-sch-cam'); if(btn) btn.classList.remove('hidden');
        }
        
        function takeSchedulePicture() {
            if(!schStream) { showToast("Silakan Nyalakan Kamera terlebih dahulu.", "error"); return; }
            const v = document.getElementById('schedule-camera'), c = document.getElementById('schedule-canvas');
            if(v && c) {
                c.width = v.videoWidth; c.height = v.videoHeight;
                c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
                c.classList.remove('hidden');
                showToast("Wajah berhasil direkam dan dilampirkan.", "success");
            }
        }

        function submitScheduleForm(e) {
            e.preventDefault();
            const canvas = document.getElementById('schedule-canvas');
            if(canvas && canvas.classList.contains('hidden')) {
                showToast("Pengajuan Gagal. Anda wajib merekam foto wajah pemohon pada bagian 4.", "error"); 
                return;
            }
            
            stopScheduleCamera();
            showTicketModal("Jadwal Diajukan!", "Permohonan lengkap beserta foto telah dikirim ke Aplikasi Kepsek. Simpan kode resi Anda untuk mengecek status persetujuan.");
            
            e.target.reset();
            if(canvas) canvas.classList.add('hidden');
            const input = document.getElementById('form-schedule').querySelector('input[type="file"]');
            if(input) { Object.defineProperty(input, 'files', {value: []}); updateFileName(input); }
        }

        /* --- DASHBOARD LOGIC (MODERN UI & SYNC) --- */
        const simDB = { inbox: [] };

        function generateMockData() {
            simDB.inbox = [
                { id: 101, sender: "Dr. Hendra", agency: "Diknas Pusat", time: "10:45 WIB", reqDate: "12 Okt 2026 | 10:00", location: "Ruang Kepsek", title: "Pengajuan Rapat Akreditasi", body: "Mohon izin, kami ingin mendiskusikan laporan nilai akhir. Mohon ibu siapkan data pendukung.", hasFile: true, status: 'PENDING', read: false, avatar: "H" },
                { id: 102, sender: "Bapak Ahmad", agency: "Vendor ATK", time: "09:30 WIB", reqDate: "As Soon As Possible", location: "Via Website", title: "Permohonan Kebijakan Pengadaan", body: "Ada pengajuan proposal ATK tahun ajaran baru. Mohon persetujuan Ibu di sistem.", hasFile: true, status: 'PENDING', read: false, avatar: "A" },
                { id: 103, sender: "Ibu Ratna Susanti", agency: "Wali Murid", time: "Kemarin", reqDate: "Tidak Perlu Lokasi", location: "Via Website", title: "Informasi Lomba Siswa", body: "Anak kami berhasil memenangkan lomba melukis nasional. Kami lampirkan piagam digitalnya.", hasFile: false, status: 'APPROVED', read: true, avatar: "R" }
            ];
        }

        function switchTab(tabId) {
            document.querySelectorAll('.dash-view').forEach(el => { el.classList.remove('active'); el.classList.remove('animate-fadeSlideUp'); });
            
            const target = document.getElementById(tabId); 
            if(target) {
                target.classList.add('active');
                void target.offsetWidth; // Trigger reflow
                target.classList.add('animate-fadeSlideUp');
            }
            
            document.querySelectorAll('.nav-pill').forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.getElementById(tabId.replace('tab', 'nav'));
            if(activeBtn) activeBtn.classList.add('active');
            
            document.querySelectorAll('.side-icon').forEach(btn => btn.classList.remove('active'));
            const sideBtn = document.getElementById(tabId.replace('tab', 'icon'));
            if(sideBtn) sideBtn.classList.add('active');

            const titles = { 'tab-overview': 'Sistem Informasi Kepala Sekolah', 'tab-requests': 'Daftar Pengajuan Interaktif', 'tab-reports': 'Analitik Interaksi Website', 'tab-settings': 'Konfigurasi Profil Eksekutif' };
            const dt = document.getElementById('dash-title');
            if(dt) dt.innerText = titles[tabId] || 'Dasbor Utama';
            
            if(tabId === 'tab-overview' || tabId === 'tab-reports') renderModernBarChart();
        }

        function toggleMobileSidebar() {
            const sidebar = document.getElementById('principal-sidebar');
            const overlay = document.getElementById('mobile-sidebar-overlay');
            if(sidebar) sidebar.classList.toggle('mobile-open'); 
            if(overlay) overlay.classList.toggle('active');
        }

        function toggleNotificationPanel() {
            const panel = document.getElementById('notification-panel');
            if(panel) panel.classList.toggle('hidden');
        }

        function getStatusBadgeUI(status) {
            if(status === 'PENDING') return `<span class="modern-badge b-wait">Menunggu Persetujuan</span>`;
            if(status === 'APPROVED') return `<span class="modern-badge b-ok"><i class="fa-solid fa-check"></i> Disetujui/Tuntas</span>`;
            if(status === 'REJECTED') return `<span class="modern-badge b-no"><i class="fa-solid fa-xmark"></i> Ditolak</span>`;
            return '';
        }

        function initDashboardData() {
            try {
                setTimeout(() => {
                    renderDashboardMetrics();
                    renderInboxList(); 
                    renderModernBarChart();
                    renderNotifications();
                }, 600);
            } catch(e) { console.error("Init Dashboard Error:", e); }
        }

        function renderDashboardMetrics() {
            const actList = document.getElementById('quick-activity-list');
            
            let unreadCount = simDB.inbox.filter(m => !m.read).length;
            let pendingReq = simDB.inbox.filter(m => m.status === 'PENDING').length;
            let approvedReq = simDB.inbox.filter(m => m.status === 'APPROVED').length;

            const mc = document.getElementById('db-msg-count'); if(mc) mc.innerText = simDB.inbox.length;
            const pw = document.getElementById('db-wait'); if(pw) pw.innerText = pendingReq;
            const pa = document.getElementById('db-approved'); if(pa) pa.innerText = approvedReq;
            const ubc = document.getElementById('db-unread-count'); if(ubc) ubc.innerText = unreadCount;
            
            if(actList) {
                actList.innerHTML = '';
                simDB.inbox.slice(0, 4).forEach(req => {
                    actList.innerHTML += `<tr class="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer" onclick="switchTab('tab-requests')">
                        <td class="font-medium text-slate-500 text-sm"><i class="fa-regular fa-clock mr-2 text-slate-400"></i>${req.time}</td>
                        <td class="font-bold text-slate-800 text-sm">${req.sender} <span class="block text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">${req.agency}</span></td>
                        <td><span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">${req.title}</span></td>
                        <td>${getStatusBadgeUI(req.status)}</td>
                    </tr>`;
                });
            }
        }

        function renderInboxList() {
            const listArea = document.getElementById('inbox-list-area');
            const badge = document.getElementById('notif-badge');
            if(!listArea) return; listArea.innerHTML = '';
            
            let unreadCount = simDB.inbox.filter(m => !m.read).length;
            if(badge) {
                if(unreadCount > 0) { badge.innerText = `${unreadCount} BARU`; badge.style.display = 'inline-block'; } 
                else { badge.style.display = 'none'; }
            }
            
            simDB.inbox.forEach((msg) => {
                let unreadClass = !msg.read ? 'unread' : '';
                let statusDot = msg.status === 'PENDING' ? '<span class="inbox-unread-dot bg-yellow-400 shadow-none ml-1"></span>' : '';
                
                listArea.innerHTML += `
                    <div class="inbox-card ${unreadClass}" onclick="openMessage(${msg.id}, this)">
                        <div class="flex justify-between items-start mb-2">
                            <div><h4 class="text-sm text-slate-800 truncate pr-2 font-bold">${msg.sender} ${statusDot}</h4></div>
                            <span class="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">${msg.time}</span>
                        </div>
                        <p class="text-xs text-slate-700 font-semibold truncate mb-1">${msg.title}</p>
                        <p class="text-[11px] text-slate-500 truncate">${msg.body}</p>
                    </div>`;
            });
            renderDashboardMetrics();
        }

        function openMessage(id, element) {
            if(element) {
                document.querySelectorAll('.inbox-card').forEach(el => el.classList.remove('active'));
                element.classList.add('active'); element.classList.remove('unread');
            }
            const msg = simDB.inbox.find(m => m.id === id); 
            if(!msg) return;
            msg.read = true;
            
            let actionButtons = '';
            if(msg.status === 'PENDING') {
                actionButtons = `
                    <button class="px-5 py-2.5 bg-[#D4FF59] hover:bg-[#c4ed4b] text-[#1A1C1E] rounded-full text-xs font-bold transition shadow-sm" onclick="processRequest(${msg.id}, 'APPROVED')"><i class="fa-solid fa-check mr-2"></i>Setujui Pengajuan</button>
                    <button class="px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-bold transition shadow-sm" onclick="processRequest(${msg.id}, 'REJECTED')"><i class="fa-solid fa-xmark mr-2"></i>Tolak</button>
                `;
            } else {
                actionButtons = `<span class="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">Pengajuan Sudah Direspon</span>`;
            }

            let fileIcon = msg.hasFile ? `<div class="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl inline-flex items-center gap-3 cursor-pointer hover:bg-red-100 transition"><i class="fa-solid fa-file-pdf text-red-500 text-xl"></i><div><p class="text-xs font-bold text-slate-700">Lampiran_Resmi.pdf</p><p class="text-[10px] text-slate-500">1.2 MB</p></div></div>` : '';

            const detailArea = document.getElementById('inbox-detail-area');
            if(detailArea) {
                detailArea.innerHTML = `
                    <div class="p-6 border-b border-slate-100 flex justify-between items-start bg-white shrink-0 z-10 shadow-sm">
                        <div class="flex gap-4">
                            <div class="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-[#1A1C1E] to-[#2D333B] flex items-center justify-center text-[#D4FF59] font-bold text-xl shadow-md shrink-0">${msg.avatar}</div>
                            <div>
                                <h2 class="text-lg font-bold text-slate-800 mb-1 leading-tight">${msg.title}</h2>
                                <p class="text-xs font-semibold text-slate-600">${msg.sender} <span class="font-normal text-slate-400">dari ${msg.agency}</span></p>
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            ${getStatusBadgeUI(msg.status)}
                        </div>
                    </div>
                    <div class="px-8 py-4 bg-slate-50 border-b border-slate-100 flex gap-6 text-xs shrink-0">
                        <div><span class="text-slate-400 uppercase tracking-widest text-[9px] block mb-0.5">Waktu Target</span><span class="font-bold text-slate-700">${msg.reqDate}</span></div>
                        <div><span class="text-slate-400 uppercase tracking-widest text-[9px] block mb-0.5">Lokasi Target</span><span class="font-bold text-slate-700">${msg.location}</span></div>
                    </div>
                    <div class="p-8 flex-1 overflow-y-auto bg-[#F8FAFC]">
                        <div class="bg-white p-8 rounded-[1.5rem] border border-slate-200 shadow-sm min-h-[200px] text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">${msg.body}</div>
                        ${fileIcon}
                    </div>
                    <div class="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                        ${actionButtons}
                    </div>
                `;
            }
            renderInboxList(); // Update unread UI
            renderNotifications(); // Update bell
        }

        function processRequest(id, newStatus) {
            const req = simDB.inbox.find(m => m.id === id);
            if(req) {
                req.status = newStatus;
                openMessage(id, null); // Refresh detail view
                showToast(newStatus === 'APPROVED' ? "Pengajuan disetujui. Notifikasi otomatis dikirim." : "Pengajuan ditolak. Pesan pembatalan terkirim.", newStatus === 'APPROVED' ? "success" : "error");
            }
        }

        function renderNotifications() {
            const list = document.getElementById('notification-list');
            const badgeMain = document.getElementById('bell-badge');
            if(!list) return;
            list.innerHTML = '';

            let notifs = [];
            simDB.inbox.forEach(m => {
                if(!m.read) notifs.push({ text: `Pesan digital dari ${m.sender}`, time: m.time, icon: 'fa-envelope', color: 'text-blue-500', action: "switchTab('tab-requests')" });
                if(m.status === 'PENDING') notifs.push({ text: `Pengajuan Tertunda dari ${m.sender}`, time: m.time, icon: 'fa-triangle-exclamation', color: 'text-yellow-500', action: "switchTab('tab-requests')" });
            });

            if(notifs.length === 0) {
                list.innerHTML = '<div class="p-5 text-center text-xs text-slate-500 font-medium">Tidak ada notifikasi sistem baru.</div>';
                if(badgeMain) badgeMain.classList.add('hidden');
            } else {
                if(badgeMain) badgeMain.classList.remove('hidden');
                notifs.forEach(n => {
                    list.innerHTML += `
                        <div class="p-4 border-b border-gray-50 hover:bg-gray-50 flex items-start gap-3 cursor-pointer transition" onclick="toggleNotificationPanel(); ${n.action}">
                            <div class="mt-0.5"><i class="fa-solid ${n.icon} ${n.color} text-sm"></i></div>
                            <div><p class="text-xs font-bold text-gray-800">${n.text}</p><p class="text-[10px] text-gray-400 mt-1">${n.time}</p></div>
                        </div>
                    `;
                });
            }
        }

        function markAllRead() {
            simDB.inbox.forEach(m => m.read = true);
            renderInboxList(); renderNotifications(); toggleNotificationPanel();
            showToast("Seluruh pesan web ditandai sudah dibaca.", "success");
        }

        let chartRendered = false;
        function renderModernBarChart() {
            if (chartRendered) return; const wrap = document.getElementById('bar-chart-wrapper'); if(!wrap) return;
            const rawData = [ { total: 90, done: 50 }, { total: 60, done: 30 }, { total: 75, done: 25 }, { total: 95, done: 32 }, { total: 40, done: 20 }, { total: 65, done: 40 }, { total: 55, done: 25 } ]; 
            wrap.innerHTML = '';
            
            rawData.forEach((data, idx) => {
                let badgeHTML = (idx === 3) ? `<div class="absolute -top-6 bg-[#1A1C1E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">${data.total}%</div>` : '';
                let labelHTML = (idx === 3) ? `<div class="absolute -left-6 bottom-10 bg-[#D4FF59] text-[#1A1C1E] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">${data.done}%</div>` : '';
                
                wrap.innerHTML += `
                <div class="bar-wrap group w-6 sm:w-10 relative h-full flex flex-col justify-end items-center">
                    <div class="chart-tooltip absolute -top-10 bg-[#1e293b] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">${data.total} Pengajuan</div>
                    <div class="absolute inset-0 w-full border-2 dashed border-[#E5E7EB] rounded-full z-0"></div>
                    <div class="bar-fill-black absolute bottom-0 w-full bg-[#1A1C1E] rounded-full z-10 transition-all duration-1000" style="height: 0%;" data-target="${data.total}"></div>
                    <div class="bar-fill-lime absolute bottom-0 w-full bg-[#D4FF59] rounded-full z-20 transition-all duration-1000" style="height: 0%;" data-target="${data.done}"><div class="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div></div>
                    ${badgeHTML}
                    ${labelHTML}
                </div>`;
            });
            setTimeout(() => {
                document.querySelectorAll('.bar-fill-black').forEach(bar => { bar.style.height = `${bar.getAttribute('data-target')}%`; });
                document.querySelectorAll('.bar-fill-lime').forEach(bar => { bar.style.height = `${bar.getAttribute('data-target')}%`; });
            }, 100);
            chartRendered = true;
        }

        function updateStatusIndicator(text, colorClass) {
            const ind = document.getElementById('status-indicator');
            if(ind) {
                ind.className = `text-[10px] md:text-xs font-medium mt-0.5 ${colorClass}`;
                ind.innerHTML = `<i class="fa-solid fa-circle text-[8px] mr-1"></i>${text}`;
            }
        }
        function saveSettings(e) { e.preventDefault(); showToast("Pengaturan profil berhasil disimpan dan sinkron.", "success"); }

    </script>
</body>
</html>
