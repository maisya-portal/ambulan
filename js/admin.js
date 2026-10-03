/**
 * =========================================================================
 * ADMIN PORTAL CONTROLLER - AMBULAN PONPES IMAM SYAFI'I BREBES
 * =========================================================================
 * Mengelola Dashboard, Data Donatur, Donasi Masuk, Verifikasi Pembayaran,
 * Pengeluaran Operasional, Saldo Kas, Laporan & Cetak Kwitansi,
 * Bukti Transaksi, Manajemen User, dan Audit Log.
 * =========================================================================
 */

class AdminPortal {
  constructor() {
    this.currentUser = null;
    this.adminData = null;
    this.currentVerifyDonasi = null;
    this.activeFilterStatus = 'all';
    this.initEventListeners();
  }

  isLoggedIn() {
    return !!sessionStorage.getItem('maisya_admin_token');
  }

  getCurrentUser() {
    const raw = sessionStorage.getItem('maisya_admin_user');
    return raw ? JSON.parse(raw) : null;
  }

  async init() {
    if (this.isLoggedIn()) {
      this.currentUser = this.getCurrentUser();
      this.updateAdminHeader();
      await this.loadAdminData();
    }
  }

  updateAdminHeader() {
    const elName = document.getElementById('admin-profile-name');
    const elRole = document.getElementById('admin-profile-role');
    if (this.currentUser) {
      if (elName) elName.innerText = this.currentUser.nama || this.currentUser.username;
      if (elRole) elRole.innerText = (this.currentUser.role || 'Admin').toUpperCase();
    }
  }

  async loadAdminData() {
    try {
      this.adminData = await window.ambulanApi.getAdminData();
      if (!this.adminData) return;

      this.renderDashboard();
      this.renderDonasiMasuk();
      this.renderDataDonatur();
      this.renderPengeluaran();
      this.renderSaldo();
      this.renderBuktiTransaksi();
      this.renderUsers();
      this.renderAuditLog();
      this.renderLaporanTab();
      this.populateSettingsForm();
    } catch (err) {
      console.error('Gagal memuat data admin:', err);
      window.app.showToast('Gagal memuat data admin: ' + err.toString(), 'error');
    }
  }

  renderDashboard() {
    if (!this.adminData || !this.adminData.kpi) return;
    const kpi = this.adminData.kpi;
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');

    // KPI Cards
    const elSaldo = document.getElementById('kpi-saldo-kas');
    const elMasuk = document.getElementById('kpi-donasi-masuk');
    const elPending = document.getElementById('kpi-donasi-pending');
    const elKeluar = document.getElementById('kpi-pengeluaran');
    const elDonatur = document.getElementById('kpi-total-donatur');

    if (elSaldo) elSaldo.innerText = formatRp(kpi.saldoKas);
    if (elMasuk) elMasuk.innerText = formatRp(kpi.totalMasukVerified);
    if (elPending) elPending.innerText = `${formatRp(kpi.totalPending)} (${kpi.countPending} pending)`;
    if (elKeluar) elKeluar.innerText = formatRp(kpi.totalPengeluaran);
    if (elDonatur) elDonatur.innerText = `${kpi.totalDonatur} Donatur`;

    // Render Recent Pending Donations for Quick Verification
    const containerQuick = document.getElementById('dashboard-quick-pending');
    if (containerQuick) {
      const pendingList = (this.adminData.donasi || []).filter(d => d.status === 'Pending').slice(0, 5);
      if (pendingList.length === 0) {
        containerQuick.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #10b981; font-weight: 600;">
            <i class="fa-solid fa-circle-check" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
            Semua donasi masuk telah diverifikasi! Tidak ada antrean pending.
          </div>
        `;
      } else {
        containerQuick.innerHTML = pendingList.map(d => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0;">
            <div>
              <strong style="color: #0d7a57;">${d.nama_donatur}</strong>
              <div style="font-size: 0.8rem; color: #64748b;">${d.metode_bayar} &bull; ${d.tanggal}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-weight: 800; color: #1e293b;">${formatRp(d.nominal)}</span>
              <button class="btn btn-sm btn-primary" onclick="window.adminPortal.openVerifyModal('${d.id}')">
                Periksa & Verifikasi
              </button>
            </div>
          </div>
        `).join('');
      }
    }
  }

  renderDonasiMasuk() {
    if (!this.adminData || !this.adminData.donasi) return;
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');
    const tbody = document.getElementById('table-body-admin-donasi');
    if (!tbody) return;

    let list = this.adminData.donasi;
    if (this.activeFilterStatus !== 'all') {
      list = list.filter(d => d.status === this.activeFilterStatus);
    }

    const searchQuery = (document.getElementById('search-donasi-input')?.value || '').toLowerCase().trim();
    if (searchQuery) {
      list = list.filter(d =>
        String(d.nama_donatur || '').toLowerCase().includes(searchQuery) ||
        String(d.id || '').toLowerCase().includes(searchQuery) ||
        String(d.no_wa || '').includes(searchQuery)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem; color: #64748b;">Tidak ada data donasi yang cocok.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(d => {
      let badgeClass = 'badge-warning';
      if (d.status === 'Verified') badgeClass = 'badge-success';
      if (d.status === 'Rejected') badgeClass = 'badge-danger';

      return `
        <tr>
          <td><strong style="font-family: monospace; font-size: 0.85rem;">${d.id}</strong></td>
          <td style="white-space: nowrap; font-size: 0.85rem;">${d.tanggal}</td>
          <td>
            <strong>${d.nama_donatur}</strong>
            <div style="font-size: 0.8rem; color: #64748b;">${d.no_wa || '-'}</div>
          </td>
          <td style="font-weight: 800; color: #0d7a57;">${formatRp(d.nominal)}</td>
          <td>
            <div style="font-size: 0.85rem; font-weight: 600;">${d.metode_bayar}</div>
            <small style="color: #64748b;">${d.program}</small>
          </td>
          <td><span class="badge ${badgeClass}">${d.status}</span></td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-sm btn-outline" title="Review Bukti & Verifikasi" onclick="window.adminPortal.openVerifyModal('${d.id}')">
                <i class="fa-solid fa-eye"></i> Periksa
              </button>
              ${d.status === 'Verified' ? `
                <button class="btn btn-sm btn-gold" title="Cetak Kwitansi" onclick="window.adminPortal.printKwitansi('${d.id}')">
                  <i class="fa-solid fa-receipt"></i>
                </button>
                <button class="btn btn-sm btn-primary" title="Kirim WA Kwitansi" onclick="window.adminPortal.sendKwitansiWa('${d.id}')">
                  <i class="fa-brands fa-whatsapp"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderDataDonatur() {
    if (!this.adminData || !this.adminData.donatur) return;
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');
    const tbody = document.getElementById('table-body-admin-donatur');
    if (!tbody) return;

    const list = this.adminData.donatur;
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem; color: #64748b;">Belum ada donatur tercatat</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((d, i) => {
      const rawWa = String(d.no_wa || '').trim();
      let cleanWa = rawWa.replace(/[^0-9]/g, '');
      if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.substring(1);

      return `
        <tr>
          <td>#${i + 1}</td>
          <td><strong>${d.nama || '-'}</strong></td>
          <td>
            ${cleanWa ? `
              <a href="https://wa.me/${cleanWa}" target="_blank" style="color: #10b981; font-weight: 600;">
                <i class="fa-brands fa-whatsapp"></i> ${rawWa}
              </a>
            ` : (rawWa || '-')}
          </td>
          <td>${d.alamat || '-'}</td>
          <td style="font-weight: 800; color: #0d7a57;">${formatRp(d.total_donasi)}</td>
          <td><span class="badge badge-primary">${d.frekuensi || 1}x Donasi</span></td>
        </tr>
      `;
    }).join('');
  }

  renderPengeluaran() {
    if (!this.adminData || !this.adminData.pengeluaran) return;
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');
    const tbody = document.getElementById('table-body-admin-pengeluaran');
    if (!tbody) return;

    const list = this.adminData.pengeluaran;
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem; color: #64748b;">Belum ada data pengeluaran dicatat</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(p => `
      <tr>
        <td style="font-family: monospace; font-size: 0.85rem;">${p.id}</td>
        <td style="white-space: nowrap;">${p.tanggal}</td>
        <td><span class="badge badge-warning">${p.kategori}</span></td>
        <td>${p.deskripsi}</td>
        <td><strong>${p.pic || 'Admin'}</strong></td>
        <td style="font-weight: 800; color: #ef4444;">${formatRp(p.nominal)}</td>
      </tr>
    `).join('');
  }

  renderSaldo() {
    if (!this.adminData || !this.adminData.kpi) return;
    const kpi = this.adminData.kpi;
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');

    const elTotalIn = document.getElementById('saldo-total-in');
    const elTotalOut = document.getElementById('saldo-total-out');
    const elSisaKas = document.getElementById('saldo-sisa-kas');

    if (elTotalIn) elTotalIn.innerText = formatRp(kpi.totalMasukVerified);
    if (elTotalOut) elTotalOut.innerText = formatRp(kpi.totalPengeluaran);
    if (elSisaKas) elSisaKas.innerText = formatRp(kpi.saldoKas);

    // Render Arus Kas Ledger (Gabungan Pemasukan Verified & Pengeluaran urut tanggal)
    const tbodyMutasi = document.getElementById('table-body-mutasi-kas');
    if (tbodyMutasi) {
      const mutasi = [];
      (this.adminData.donasi || []).filter(d => d.status === 'Verified').forEach(d => {
        mutasi.push({
          tanggal: d.tanggal,
          tipe: 'MASUK',
          keterangan: `Donasi dari ${d.nama_donatur} (${d.program})`,
          nominal: Number(d.nominal) || 0
        });
      });
      (this.adminData.pengeluaran || []).forEach(p => {
        mutasi.push({
          tanggal: p.tanggal,
          tipe: 'KELUAR',
          keterangan: `[${p.kategori}] ${p.deskripsi}`,
          nominal: Number(p.nominal) || 0
        });
      });

      // Urutkan tanggal terbaru
      mutasi.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

      let runningBalance = kpi.saldoKas;
      tbodyMutasi.innerHTML = mutasi.slice(0, 50).map(m => {
        const isMasuk = m.tipe === 'MASUK';
        return `
          <tr>
            <td style="white-space: nowrap; font-size: 0.85rem;">${m.tanggal}</td>
            <td>
              <span class="badge ${isMasuk ? 'badge-success' : 'badge-danger'}">
                ${isMasuk ? '+ Kas Masuk' : '- Kas Keluar'}
              </span>
            </td>
            <td>${m.keterangan}</td>
            <td style="font-weight: 800; color: ${isMasuk ? '#16a34a' : '#ef4444'};">
              ${isMasuk ? '+' : '-'} ${formatRp(m.nominal)}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  renderBuktiTransaksi() {
    if (!this.adminData) return;
    const gallery = document.getElementById('gallery-bukti-transaksi');
    if (!gallery) return;

    const listBukti = [];
    (this.adminData.donasi || []).forEach(d => {
      if (d.bukti_transfer && d.bukti_transfer !== '') {
        listBukti.push({
          tipe: 'Donasi: ' + d.nama_donatur,
          nominal: d.nominal,
          tanggal: d.tanggal,
          status: d.status,
          img: d.bukti_transfer
        });
      }
    });

    if (listBukti.length === 0) {
      gallery.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">Belum ada lampiran bukti transfer</div>`;
      return;
    }

    gallery.innerHTML = listBukti.map(b => `
      <div class="card" style="padding: 0.75rem;">
        <div style="height: 180px; background: #f8fafc; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; border: 1px solid #e2e8f0; cursor: pointer;" onclick="window.adminPortal.showImagePreview('${b.img}')">
          <img src="${b.img}" alt="Bukti" style="max-height: 100%; max-width: 100%; object-fit: contain;">
        </div>
        <div style="font-size: 0.85rem; font-weight: 700; color: #0d7a57;">${b.tipe}</div>
        <div style="font-size: 0.8rem; color: #64748b;">${b.tanggal}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem;">
          <strong style="color: #1e293b;">Rp ${Number(b.nominal).toLocaleString('id-ID')}</strong>
          <span class="badge ${b.status === 'Verified' ? 'badge-success' : 'badge-warning'}">${b.status}</span>
        </div>
      </div>
    `).join('');
  }

  renderUsers() {
    if (!this.adminData || !this.adminData.users) return;
    const tbody = document.getElementById('table-body-admin-users');
    if (!tbody) return;

    const currentLoggedInUser = this.getCurrentUser();

    tbody.innerHTML = this.adminData.users.map(u => {
      let roleBadge = 'badge-primary';
      if (u.role === 'superadmin') roleBadge = 'badge-success';
      if (u.role === 'driver') roleBadge = 'badge-warning';

      const isProtected = u.username === 'admin' || (currentLoggedInUser && currentLoggedInUser.username === u.username);

      return `
        <tr>
          <td style="font-family: monospace; font-size: 0.85rem; font-weight: 600;">${u.id}</td>
          <td><strong>${u.username}</strong></td>
          <td>${u.nama}</td>
          <td><span class="badge ${roleBadge}">${(u.role || '').toUpperCase()}</span></td>
          <td>${u.no_hp || '-'}</td>
          <td><span class="badge ${u.status === 'aktif' ? 'badge-success' : 'badge-danger'}">${(u.status || 'aktif').toUpperCase()}</span></td>
          <td style="text-align: center;">
            <div style="display: inline-flex; gap: 0.4rem; justify-content: center;">
              <button class="btn btn-sm btn-outline" title="Edit Pengguna" onclick="window.adminPortal.openEditUserModal('${u.id}')" style="padding: 0.35rem 0.65rem;">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              ${isProtected ? `
                <button class="btn btn-sm btn-outline" disabled title="Akun utama/sedang aktif tidak dapat dihapus" style="opacity: 0.4; cursor: not-allowed; padding: 0.35rem 0.65rem;">
                  <i class="fa-solid fa-lock"></i>
                </button>
              ` : `
                <button class="btn btn-sm btn-danger" title="Hapus Pengguna" onclick="window.adminPortal.deleteUser('${u.id}', '${u.username}')" style="padding: 0.35rem 0.65rem;">
                  <i class="fa-solid fa-trash"></i> Hapus
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderAuditLog() {
    if (!this.adminData || !this.adminData.auditLog) return;
    const tbody = document.getElementById('table-body-audit-log');
    if (!tbody) return;

    tbody.innerHTML = (this.adminData.auditLog || []).map(a => `
      <tr>
        <td style="white-space: nowrap; font-size: 0.82rem;">${a.timestamp}</td>
        <td><strong style="color: #0d7a57;">${a.user}</strong></td>
        <td><span class="badge badge-primary">${a.action}</span></td>
        <td>${a.detail}</td>
      </tr>
    `).join('');
  }

  renderLaporanTab() {
    if (!this.adminData) return;
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');
    const kpi = this.adminData.kpi || {};

    const elLapTotalMasuk = document.getElementById('lap-total-masuk');
    const elLapTotalKeluar = document.getElementById('lap-total-keluar');
    const elLapSaldoAkhir = document.getElementById('lap-saldo-akhir');

    if (elLapTotalMasuk) elLapTotalMasuk.innerText = formatRp(kpi.totalMasukVerified);
    if (elLapTotalKeluar) elLapTotalKeluar.innerText = formatRp(kpi.totalPengeluaran);
    if (elLapSaldoAkhir) elLapSaldoAkhir.innerText = formatRp(kpi.saldoKas);
  }

  populateSettingsForm() {
    if (!this.adminData || !this.adminData.settings) return;
    const s = this.adminData.settings;

    const inputTarget = document.getElementById('setting-target-donasi');
    const inputBsi = document.getElementById('setting-rek-bsi');
    const inputMuamalat = document.getElementById('setting-rek-muamalat');
    const inputHotline = document.getElementById('setting-hotline');
    const inputWa = document.getElementById('setting-wa-konfirmasi');
    const inputAlamat = document.getElementById('setting-alamat');
    const inputAppsScriptUrl = document.getElementById('setting-apps-script-url');
    const checkOnlineMode = document.getElementById('setting-online-mode-toggle');

    if (inputTarget) inputTarget.value = s.target_donasi || 250000000;
    if (inputBsi) inputBsi.value = s.rekening_bsi || '';
    if (inputMuamalat) inputMuamalat.value = s.rekening_muamalat || '';
    if (inputHotline) inputHotline.value = s.hotline_darurat || '';
    if (inputWa) inputWa.value = s.wa_konfirmasi || '';
    if (inputAlamat) inputAlamat.value = s.alamat_ponpes || '';
    if (inputAppsScriptUrl) inputAppsScriptUrl.value = window.ambulanApi.getAppsScriptUrl();
    if (checkOnlineMode) checkOnlineMode.checked = window.ambulanApi.isOnlineMode();
  }

  openVerifyModal(donasiId) {
    if (!this.adminData || !this.adminData.donasi) return;
    const d = this.adminData.donasi.find(x => x.id === donasiId);
    if (!d) return;

    this.currentVerifyDonasi = d;
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');

    document.getElementById('verify-modal-id').innerText = d.id;
    document.getElementById('verify-modal-nama').innerText = d.nama_donatur;
    document.getElementById('verify-modal-wa').innerText = d.no_wa || '-';
    document.getElementById('verify-modal-nominal').innerText = formatRp(d.nominal);
    document.getElementById('verify-modal-metode').innerText = d.metode_bayar;
    document.getElementById('verify-modal-program').innerText = d.program;
    document.getElementById('verify-modal-doa').innerText = `"${d.doa_pesan || '-'}"`;
    document.getElementById('verify-modal-status-badge').innerHTML = `<span class="badge ${d.status === 'Verified' ? 'badge-success' : (d.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${d.status}</span>`;

    const imgBukti = document.getElementById('verify-modal-img');
    if (imgBukti) {
      imgBukti.src = d.bukti_transfer || 'assets/logo.svg';
    }

    const modal = document.getElementById('modal-verifikasi-donasi');
    if (modal) modal.classList.add('show');
  }

  async submitVerification(status) {
    if (!this.currentVerifyDonasi) return;
    const adminUser = this.getCurrentUser();
    const adminName = adminUser ? adminUser.nama : 'Admin';
    const alasan = status === 'Rejected' ? (prompt('Masukkan alasan penolakan:') || 'Bukti transfer tidak valid') : '';

    if (status === 'Rejected' && !alasan) return;

    try {
      const res = await window.ambulanApi.verifyDonasi(this.currentVerifyDonasi.id, status, adminName, alasan);
      if (res && res.success) {
        window.app.showToast(res.message, 'success');
        window.app.closeModal('modal-verifikasi-donasi');
        await this.loadAdminData();
        await window.publicPortal.refreshPublicData();

        if (status === 'Verified') {
          // Tawarkan kirim konfirmasi WA
          const tanyaWA = confirm('Apakah Anda ingin langsung mengirim Kwitansi Donasi ke WhatsApp donatur?');
          if (tanyaWA) {
            this.sendKwitansiWa(this.currentVerifyDonasi.id);
          }
        }
      }
    } catch (e) {
      window.app.showToast('Gagal memverifikasi donasi: ' + e.toString(), 'error');
    }
  }

  sendKwitansiWa(donasiId) {
    if (!this.adminData || !this.adminData.donasi) return;
    const d = this.adminData.donasi.find(x => x.id === donasiId);
    const rawWa = String(d?.no_wa || '').trim();
    if (!d || !rawWa || rawWa === '-') {
      window.app.showToast('Nomor WhatsApp donatur tidak tersedia', 'warning');
      return;
    }

    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');
    let phone = rawWa.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

    const pesan = encodeURIComponent(
      `*KWITANSI RESMI TANDA TERIMA DONASI AMBULAN*\n` +
      `*PONDOK PESANTREN IMAM SYAFI'I BREBES*\n` +
      `-----------------------------------------\n` +
      `No. Transaksi : *${d.id}*\n` +
      `Tanggal : ${d.tanggal}\n` +
      `Nama Donatur : *${d.nama_donatur}*\n` +
      `Jumlah Donasi : *${formatRp(d.nominal)}*\n` +
      `Peruntukan : ${d.program}\n` +
      `Metode Bayar : ${d.metode_bayar}\n` +
      `Status : *SAH & TERVERIFIKASI*\n` +
      `-----------------------------------------\n` +
      `_Jazakumullahu Khairan Katsiran._\n` +
      `Semoga Allah Subhanahu wa Ta'ala membalas sedekah jariyah Bapak/Ibu dengan keberkahan rezeki, pahala yang tiada henti, dan kesehatan bagi keluarga.\n\n` +
      `Hormat kami,\n` +
      `*Tim Layanan Ambulan Ponpes Imam Syafi'i Brebes*\n` +
      `Jl. Raya Karangsari - Luwungragi, Bulakamba, Brebes`
    );

    window.open(`https://wa.me/${phone}?text=${pesan}`, '_blank');
  }

  printKwitansi(donasiId) {
    if (!this.adminData || !this.adminData.donasi) return;
    const d = this.adminData.donasi.find(x => x.id === donasiId);
    if (!d) return;

    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');

    // Isi template print kwitansi
    document.getElementById('print-kwitansi-no').innerText = d.id;
    document.getElementById('print-kwitansi-tgl').innerText = d.tanggal;
    document.getElementById('print-kwitansi-nama').innerText = d.nama_donatur;
    document.getElementById('print-kwitansi-nominal').innerText = formatRp(d.nominal);
    document.getElementById('print-kwitansi-terbilang').innerText = this.terbilang(d.nominal) + " Rupiah";
    document.getElementById('print-kwitansi-untuk').innerText = `Donasi ${d.program} - Ambulan Ponpes Imam Syafi'i Brebes`;

    window.print();
  }

  printLaporan() {
    window.print();
  }

  exportCsv(type) {
    if (!this.adminData) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = "laporan-ambulan.csv";

    if (type === 'donasi') {
      filename = `donasi-ambulan-${new Date().toISOString().substring(0,10)}.csv`;
      csvContent += "ID,Tanggal,Nama Donatur,No WA,Nominal,Metode,Program,Status\n";
      (this.adminData.donasi || []).forEach(d => {
        csvContent += `"${d.id}","${d.tanggal}","${d.nama_donatur}","${String(d.no_wa || '-')}",${d.nominal},"${d.metode_bayar}","${d.program}","${d.status}"\n`;
      });
    } else if (type === 'pengeluaran') {
      filename = `pengeluaran-ambulan-${new Date().toISOString().substring(0,10)}.csv`;
      csvContent += "ID,Tanggal,Kategori,Deskripsi,Nominal,PIC\n";
      (this.adminData.pengeluaran || []).forEach(p => {
        csvContent += `"${p.id}","${p.tanggal}","${p.kategori}","${p.deskripsi}",${p.nominal},"${p.pic}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  showImagePreview(src) {
    const modal = document.getElementById('modal-lightbox');
    const img = document.getElementById('lightbox-img');
    if (modal && img) {
      img.src = src;
      modal.classList.add('show');
    }
  }

  openEditUserModal(userId) {
    if (!this.adminData || !this.adminData.users) return;
    const user = this.adminData.users.find(u => u.id === userId);
    if (!user) {
      window.app.showToast('Data user tidak ditemukan', 'error');
      return;
    }

    const inputId = document.getElementById('edit-user-id');
    const inputUsername = document.getElementById('edit-user-username');
    const inputNama = document.getElementById('edit-user-nama');
    const selectRole = document.getElementById('edit-user-role');
    const inputHp = document.getElementById('edit-user-hp');
    const selectStatus = document.getElementById('edit-user-status');
    const inputPassword = document.getElementById('edit-user-password');

    if (inputId) inputId.value = user.id;
    if (inputUsername) inputUsername.value = user.username;
    if (inputNama) inputNama.value = user.nama || '';
    if (selectRole) selectRole.value = user.role || 'verifikator';
    if (inputHp) inputHp.value = user.no_hp || '';
    if (selectStatus) selectStatus.value = user.status || 'aktif';
    if (inputPassword) inputPassword.value = '';

    window.app.openModal('modal-edit-user');
  }

  async deleteUser(userId, username) {
    const currentUser = this.getCurrentUser();
    if (username === 'admin') {
      window.app.showToast('Akun super administrator utama tidak dapat dihapus!', 'warning');
      return;
    }

    if (currentUser && currentUser.username === username) {
      window.app.showToast('Anda tidak dapat menghapus akun yang sedang Anda gunakan!', 'warning');
      return;
    }

    const isConfirmed = confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${username}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!isConfirmed) return;

    try {
      const res = await window.ambulanApi.manageUser('delete', { id: userId }, currentUser?.nama || 'Admin');
      if (res && res.success) {
        window.app.showToast(`Akun pengguna ${username} berhasil dihapus.`, 'success');
        await this.loadAdminData();
      } else {
        window.app.showToast('Gagal menghapus user: ' + (res.message || 'Error'), 'error');
      }
    } catch (err) {
      window.app.showToast('Terjadi kesalahan: ' + err.toString(), 'error');
    }
  }

  async clearSpreadsheetDemo() {
    const isSure = confirm("PERINGATAN: Apakah Anda yakin ingin membersihkan seluruh data demo (donasi masuk, pengeluaran, donatur) di Google Spreadsheet dan lokal? Tindakan ini akan mengosongkan tabel transaksi agar siap digunakan untuk data riil.");
    if (!isSure) return;

    try {
      window.app.showToast("Sedang membersihkan data demo...", "info");
      const res = await window.ambulanApi.clearDemoData();
      window.app.showToast(res.message || "Seluruh data demo berhasil dibersihkan!", "success");
      await this.loadAdminData();
      await window.publicPortal.refreshPublicData();
    } catch (e) {
      window.app.showToast("Gagal membersihkan data demo: " + e.toString(), "error");
    }
  }

  terbilang(bilangan) {
    const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let hasil = "";
    const n = Number(bilangan);

    if (n < 12) {
      hasil = " " + angka[n];
    } else if (n < 20) {
      hasil = this.terbilang(n - 10) + " Belas";
    } else if (n < 100) {
      hasil = this.terbilang(Math.floor(n / 10)) + " Puluh" + this.terbilang(n % 10);
    } else if (n < 200) {
      hasil = " Seratus" + this.terbilang(n - 100);
    } else if (n < 1000) {
      hasil = this.terbilang(Math.floor(n / 100)) + " Ratus" + this.terbilang(n % 100);
    } else if (n < 2000) {
      hasil = " Seribu" + this.terbilang(n - 1000);
    } else if (n < 1000000) {
      hasil = this.terbilang(Math.floor(n / 1000)) + " Ribu" + this.terbilang(n % 1000);
    } else if (n < 1000000000) {
      hasil = this.terbilang(Math.floor(n / 1000000)) + " Juta" + this.terbilang(n % 1000000);
    } else if (n < 1000000000000) {
      hasil = this.terbilang(Math.floor(n / 1000000000)) + " Milyar" + this.terbilang(n % 1000000000);
    }
    return hasil.trim();
  }

  initEventListeners() {
    // Search Donasi
    const searchInput = document.getElementById('search-donasi-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderDonasiMasuk());
    }

    // Filter Status Donasi Tabs
    const filterButtons = document.querySelectorAll('.filter-donasi-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilterStatus = btn.getAttribute('data-status');
        this.renderDonasiMasuk();
      });
    });

    // Form Tambah Pengeluaran
    const formPengeluaran = document.getElementById('form-tambah-pengeluaran');
    if (formPengeluaran) {
      formPengeluaran.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          tanggal: document.getElementById('exp-tanggal').value,
          kategori: document.getElementById('exp-kategori').value,
          deskripsi: document.getElementById('exp-deskripsi').value.trim(),
          nominal: Number(document.getElementById('exp-nominal').value.replace(/[^0-9]/g, '')) || 0,
          pic: document.getElementById('exp-pic').value.trim() || 'Admin'
        };

        if (data.nominal <= 0 || !data.deskripsi) {
          window.app.showToast('Harap isi deskripsi dan nominal pengeluaran yang sah', 'warning');
          return;
        }

        try {
          const res = await window.ambulanApi.addPengeluaran(data, this.getCurrentUser()?.nama || 'Admin');
          if (res.success) {
            window.app.showToast(res.message, 'success');
            formPengeluaran.reset();
            window.app.closeModal('modal-tambah-pengeluaran');
            await this.loadAdminData();
            await window.publicPortal.refreshPublicData();
          }
        } catch (err) {
          window.app.showToast('Gagal menyimpan pengeluaran: ' + err.toString(), 'error');
        }
      });
    }

    // Form Settings
    const formSettings = document.getElementById('form-admin-settings');
    if (formSettings) {
      formSettings.addEventListener('submit', async (e) => {
        e.preventDefault();
        const targetVal = Number(document.getElementById('setting-target-donasi').value) || 250000000;
        const bsiVal = document.getElementById('setting-rek-bsi').value.trim();
        const muamalatVal = document.getElementById('setting-rek-muamalat').value.trim();
        const hotlineVal = document.getElementById('setting-hotline').value.trim();
        const waVal = document.getElementById('setting-wa-konfirmasi').value.trim();
        const alamatVal = document.getElementById('setting-alamat').value.trim();
        const appsScriptUrl = document.getElementById('setting-apps-script-url').value.trim();
        const onlineMode = document.getElementById('setting-online-mode-toggle').checked;

        window.ambulanApi.setAppsScriptUrl(appsScriptUrl);
        window.ambulanApi.setOnlineMode(onlineMode);

        const newSettings = {
          target_donasi: targetVal,
          rekening_bsi: bsiVal,
          rekening_muamalat: muamalatVal,
          hotline_darurat: hotlineVal,
          wa_konfirmasi: waVal,
          alamat_ponpes: alamatVal
        };

        try {
          await window.ambulanApi.updateSettings(newSettings, this.getCurrentUser()?.nama || 'Admin');
          window.app.showToast('Pengaturan sistem dan koneksi Apps Script berhasil disimpan!', 'success');
          await this.loadAdminData();
          await window.publicPortal.refreshPublicData();
        } catch (e) {
          window.app.showToast('Gagal menyimpan pengaturan: ' + e.toString(), 'error');
        }
      });
    }

    // Form Tambah User
    const formUser = document.getElementById('form-tambah-user');
    if (formUser) {
      formUser.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          username: document.getElementById('user-username').value.trim(),
          password: document.getElementById('user-password').value.trim(),
          nama: document.getElementById('user-nama').value.trim(),
          role: document.getElementById('user-role').value,
          no_hp: document.getElementById('user-hp').value.trim()
        };

        if (!data.username || !data.password || !data.nama) {
          window.app.showToast('Harap isi semua kolom user', 'warning');
          return;
        }

        try {
          const res = await window.ambulanApi.manageUser('add', data, this.getCurrentUser()?.nama || 'Admin');
          if (res.success) {
            window.app.showToast(res.message, 'success');
            formUser.reset();
            window.app.closeModal('modal-tambah-user');
            await this.loadAdminData();
          }
        } catch (err) {
          window.app.showToast('Gagal menambahkan user: ' + err.toString(), 'error');
        }
      });
    }

    // Form Edit User
    const formEditUser = document.getElementById('form-edit-user');
    if (formEditUser) {
      formEditUser.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-user-id').value;
        const nama = document.getElementById('edit-user-nama').value.trim();
        const role = document.getElementById('edit-user-role').value;
        const no_hp = document.getElementById('edit-user-hp').value.trim();
        const status = document.getElementById('edit-user-status').value;
        const password = document.getElementById('edit-user-password').value.trim();

        if (!id || !nama) {
          window.app.showToast('Nama lengkap tidak boleh kosong', 'warning');
          return;
        }

        const data = { id, nama, role, no_hp, status };
        if (password) {
          data.password = password;
        }

        try {
          const res = await window.ambulanApi.manageUser('edit', data, this.getCurrentUser()?.nama || 'Admin');
          if (res.success) {
            window.app.showToast('Data pengguna berhasil diperbarui!', 'success');
            window.app.closeModal('modal-edit-user');
            await this.loadAdminData();
          } else {
            window.app.showToast('Gagal memperbarui user: ' + (res.message || 'Error'), 'error');
          }
        } catch (err) {
          window.app.showToast('Gagal memperbarui user: ' + err.toString(), 'error');
        }
      });
    }
  }
}

window.adminPortal = new AdminPortal();
