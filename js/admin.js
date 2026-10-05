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
    this.currentDonasiManualBukti = null;
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

    let list = this.adminData.donatur;
    const searchQuery = (document.getElementById('search-donatur-input')?.value || '').toLowerCase().trim();
    if (searchQuery) {
      list = list.filter(d =>
        String(d.nama || '').toLowerCase().includes(searchQuery) ||
        String(d.no_wa || '').includes(searchQuery) ||
        String(d.alamat || '').toLowerCase().includes(searchQuery) ||
        String(d.id || '').toLowerCase().includes(searchQuery)
      );
    }

    const badgeTotal = document.getElementById('badge-total-donatur-count');
    if (badgeTotal) {
      badgeTotal.innerText = `${(this.adminData.donatur || []).length} Donatur Terdaftar`;
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2.5rem; color: #64748b;">
        <i class="fa-solid fa-users" style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem; display: block;"></i>
        ${searchQuery ? 'Tidak ada data donatur yang sesuai dengan pencarian.' : 'Belum ada donatur tercatat. Setiap donasi masuk otomatis mencatat profil donatur di sini.'}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((d, i) => {
      const rawWa = String(d.no_wa || '').trim();
      let cleanWa = rawWa.replace(/[^0-9]/g, '');
      if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.substring(1);
      const safeNama = (d.nama || 'Hamba Allah').replace(/'/g, "\\'");
      const safeWa = (rawWa || '-').replace(/'/g, "\\'");

      const waPesan = cleanWa ? encodeURIComponent(
        `*Yth. Bapak/Ibu ${d.nama}*\n\n` +
        `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `Semoga Bapak/Ibu senantiasa dalam limpahan taufik dan kesehatan dari Allah Subhanahu wa Ta'ala.\n` +
        `Kami dari Pengurus Layanan Ambulan Pondok Pesantren Imam Syafi'i Brebes mengucapkan *Jazakumullahu Khairan Katsiran* atas sedekah jariyah yang telah disalurkan.\n\n` +
        `Semoga Allah membalasnya dengan rezeki yang berkah dan pahala yang berlipat ganda. Aamiin.\n\n` +
        `*Layanan Ambulan Ponpes Imam Syafi'i Brebes*`
      ) : '';

      return `
        <tr>
          <td><strong style="color: #64748b;">#${i + 1}</strong></td>
          <td>
            <div style="font-weight: 700; color: #064e3b; font-size: 0.95rem;">${d.nama || 'Hamba Allah'}</div>
            <div style="font-size: 0.75rem; color: #94a3b8; font-family: monospace;">ID: ${d.id || '-'}</div>
          </td>
          <td>
            ${cleanWa && cleanWa.length >= 8 ? `
              <a href="https://wa.me/${cleanWa}" target="_blank" class="btn btn-sm btn-outline" style="color: #059669; border-color: #a7f3d0; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.6rem;">
                <i class="fa-brands fa-whatsapp" style="font-size: 0.95rem;"></i> ${rawWa}
              </a>
            ` : `<span style="color: #94a3b8;">${rawWa || '-'}</span>`}
          </td>
          <td>
            <span style="font-size: 0.85rem; color: #475569;">${d.alamat && d.alamat !== '-' ? d.alamat : 'Brebes & Sekitarnya'}</span>
          </td>
          <td style="font-weight: 800; color: #0d7a57; font-size: 0.95rem;">
            ${formatRp(d.total_donasi)}
          </td>
          <td>
            <span class="badge badge-success" style="font-size: 0.8rem; font-weight: 600;">
              ${d.frekuensi || 1}x Donasi
            </span>
          </td>
          <td style="font-size: 0.82rem; color: #64748b; white-space: nowrap;">
            ${d.donasi_terakhir ? d.donasi_terakhir.substring(0, 10) : '-'}
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-sm btn-primary" title="Catat Donasi Baru untuk Donatur ini" onclick="window.adminPortal.openTambahDonasiModal('${safeNama}', '${safeWa}')" style="padding: 0.25rem 0.55rem; font-size: 0.8rem;">
                <i class="fa-solid fa-plus"></i> Donasi
              </button>
              ${cleanWa && cleanWa.length >= 8 ? `
                <a href="https://wa.me/${cleanWa}?text=${waPesan}" target="_blank" class="btn btn-sm btn-gold" title="Kirim Pesan Terima Kasih via WhatsApp" style="padding: 0.25rem 0.55rem; font-size: 0.8rem;">
                  <i class="fa-solid fa-paper-plane"></i>
                </a>
              ` : ''}
            </div>
          </td>
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

    const list = this.adminData.auditLog || [];
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 2rem;">Belum ada catatan jejak audit</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(a => {
      let timestamp = a.timestamp || a.waktu || a.tanggal || a.created_at;
      let user = a.user || a.pengguna || a.admin || a.nama;
      let action = a.action || a.tindakan || a.aksi;
      let detail = a.detail || a.rincian || a.keterangan || a.catatan || a.deskripsi;

      // Robust fallback jika baris pertama sheet tertimpa data sehingga key berisi nilai data
      if (!timestamp && !user && !action) {
        const vals = Object.values(a);
        const keys = Object.keys(a);
        if (vals.length >= 4) {
          timestamp = vals[1] || keys[1];
          user = vals[2] || keys[2];
          action = vals[3] || keys[3];
          detail = vals[4] || keys[4];
        }
      }

      const timeStr = timestamp ? String(timestamp) : '-';
      const userStr = user ? String(user) : 'system';
      const actionStr = action ? String(action).toUpperCase() : 'ACTIVITY';
      const detailStr = detail ? String(detail) : '-';

      return `
        <tr>
          <td style="white-space: nowrap; font-size: 0.82rem; color: #475569;">${timeStr}</td>
          <td><strong style="color: #0d7a57;">${userStr}</strong></td>
          <td><span class="badge badge-primary">${actionStr}</span></td>
          <td style="color: #334155;">${detailStr}</td>
        </tr>
      `;
    }).join('');
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
    const inputTarget = document.getElementById('setting-target-donasi');
    const inputBank1Nama = document.getElementById('setting-bank1-nama');
    const inputBank1Norek = document.getElementById('setting-bank1-norek');
    const inputBank1AtasNama = document.getElementById('setting-bank1-atas-nama');

    const inputBank2Nama = document.getElementById('setting-bank2-nama');
    const inputBank2Norek = document.getElementById('setting-bank2-norek');
    const inputBank2AtasNama = document.getElementById('setting-bank2-atas-nama');

    const inputHotline = document.getElementById('setting-hotline');
    const inputWa = document.getElementById('setting-wa-konfirmasi');
    const inputDriver = document.getElementById('setting-kontak-driver');
    const inputAlamat = document.getElementById('setting-alamat');

    const inputBsiLegacy = document.getElementById('setting-rek-bsi');
    const inputMuamalatLegacy = document.getElementById('setting-rek-muamalat');

    const inputAppsScriptUrl = document.getElementById('setting-apps-script-url');
    const checkOnlineMode = document.getElementById('setting-online-mode-toggle');
    const checkFilterDemo = document.getElementById('setting-filter-demo-toggle');

    if (inputAppsScriptUrl) inputAppsScriptUrl.value = window.ambulanApi.getAppsScriptUrl();
    if (checkOnlineMode) checkOnlineMode.checked = window.ambulanApi.isOnlineMode();
    if (checkFilterDemo) checkFilterDemo.checked = window.ambulanApi.isFilterDemoData();

    const s = (this.adminData && this.adminData.settings) ? this.adminData.settings : (window.ambulanApi.getDb()?.settings || {});

    // Target
    if (inputTarget) inputTarget.value = s.target_donasi || 250000000;

    // Bank 1
    const b1Nama = s.bank1_nama || 'Bank Syariah Indonesia (BSI)';
    const b1Norek = s.bank1_norek || (s.rekening_bsi ? (s.rekening_bsi.match(/\d[\d\s-]{4,}\d/) || [s.rekening_bsi])[0].replace(/[^\d]/g, '') : '7123456789');
    let b1An = s.bank1_atas_nama || (s.rekening_bsi && s.rekening_bsi.includes('a.n.') ? s.rekening_bsi.split('a.n.')[1].trim() : 'YAYASAN IMAM SYAFII BREBES');
    const b1Aktif = (s.bank1_aktif === undefined || s.bank1_aktif === null || String(s.bank1_aktif) === 'true' || s.bank1_aktif === true);

    if (inputBank1Nama) inputBank1Nama.value = b1Nama;
    if (inputBank1Norek) inputBank1Norek.value = b1Norek;
    if (inputBank1AtasNama) inputBank1AtasNama.value = b1An;

    const inputBank1Aktif = document.getElementById('setting-bank1-aktif');
    if (inputBank1Aktif) {
      inputBank1Aktif.checked = b1Aktif;
      this.updateBankCardVisual(1, b1Aktif);
    }

    // Bank 2
    const b2Nama = s.bank2_nama || 'Bank Muamalat';
    const b2Norek = s.bank2_norek || (s.rekening_muamalat ? (s.rekening_muamalat.match(/\d[\d\s-]{4,}\d/) || [s.rekening_muamalat])[0].replace(/[^\d]/g, '') : '5010099888');
    let b2An = s.bank2_atas_nama || (s.rekening_muamalat && s.rekening_muamalat.includes('a.n.') ? s.rekening_muamalat.split('a.n.')[1].trim() : "Ponpes Imam Syafi'i Brebes");
    const b2Aktif = (s.bank2_aktif === undefined || s.bank2_aktif === null || String(s.bank2_aktif) === 'true' || s.bank2_aktif === true);

    if (inputBank2Nama) inputBank2Nama.value = b2Nama;
    if (inputBank2Norek) inputBank2Norek.value = b2Norek;
    if (inputBank2AtasNama) inputBank2AtasNama.value = b2An;

    const inputBank2Aktif = document.getElementById('setting-bank2-aktif');
    if (inputBank2Aktif) {
      inputBank2Aktif.checked = b2Aktif;
      this.updateBankCardVisual(2, b2Aktif);
    }

    // Legacy
    if (inputBsiLegacy) inputBsiLegacy.value = `${b1Norek} a.n. ${b1An}`;
    if (inputMuamalatLegacy) inputMuamalatLegacy.value = `${b2Norek} a.n. ${b2An}`;

    // Kontak
    if (inputHotline) inputHotline.value = s.hotline_darurat || '0812-9154-2134 (Ustadz Tegar)';
    if (inputWa) inputWa.value = s.wa_konfirmasi || '6281291542134';
    if (inputDriver) inputDriver.value = s.kontak_driver || '0857-1234-5678 (Driver Pak Slamet)';
    if (inputAlamat) inputAlamat.value = s.alamat_ponpes || 'Jl. Terusan Islamic Center – Sigempol Km. 3, Kelurahan Limbangan Wetan, Kecamatan Brebes, Kabupaten Brebes, Jawa Tengah 52218';

    this.updateConnectionBadges(true);
  }

  updateBankCardVisual(bankNum, isChecked) {
    const card = document.getElementById(`card-setting-bank${bankNum}`);
    const badge = document.getElementById(`badge-bank${bankNum}-status`);
    const container = document.getElementById(`container-setting-bank${bankNum}-inputs`);
    if (badge) {
      if (isChecked) {
        badge.innerText = 'Ditampilkan';
        badge.style.background = '#d1fae5';
        badge.style.color = '#065f46';
      } else {
        badge.innerText = 'Disembunyikan';
        badge.style.background = '#e2e8f0';
        badge.style.color = '#475569';
      }
    }
    if (container) {
      container.style.opacity = isChecked ? '1' : '0.45';
    }
    if (card) {
      card.style.borderColor = isChecked ? '#e2e8f0' : '#cbd5e1';
      card.style.background = isChecked ? '#f8fafc' : '#f1f5f9';
    }
  }

  async runTestConnection(manualUrl = null) {
    const inputUrl = document.getElementById('setting-apps-script-url');
    const targetUrl = (manualUrl || (inputUrl ? inputUrl.value.trim() : '')) || window.ambulanApi.getAppsScriptUrl();
    
    const btnTest = document.getElementById('btn-test-connection');
    const resultBox = document.getElementById('connection-test-result');
    const badge = document.getElementById('connection-quick-badge');

    const originalText = btnTest ? btnTest.innerHTML : '<i class="fa-solid fa-plug-circle-check"></i> Tes Koneksi Apps Script';
    if (btnTest) {
      btnTest.disabled = true;
      btnTest.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sedang Menguji Koneksi...';
    }

    if (badge) {
      badge.innerHTML = '<span class="pulse-amber"></span> Memeriksa...';
      badge.style.background = '#fef3c7';
      badge.style.color = '#92400e';
      badge.style.borderColor = '#fde68a';
    }

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem; color: #065f46;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.25rem;"></i>
          <div>
            <strong>Menguji konektivitas ke Google Apps Script...</strong>
            <div style="font-size: 0.8rem; color: #64748b;">Menghubungi endpoint: ${targetUrl}</div>
          </div>
        </div>
      `;
    }

    try {
      const res = await window.ambulanApi.testConnection(targetUrl);

      if (res.success) {
        if (badge) {
          badge.innerHTML = `<span class="pulse-green"></span> Terhubung (${res.pingLatency}ms)`;
          badge.style.background = '#ecfdf5';
          badge.style.color = '#065f46';
          badge.style.borderColor = '#a7f3d0';
        }
        this.updateConnectionBadges(true);

        const formattedDate = res.serverTimestamp ? new Date(res.serverTimestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }) : '-';
        const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');

        if (resultBox) {
          resultBox.className = 'card';
          resultBox.style.display = 'block';
          resultBox.style.border = '1px solid #10b981';
          resultBox.style.background = '#f0fdf4';
          resultBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid #a7f3d0; padding-bottom: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; color: #065f46;">
                <i class="fa-solid fa-circle-check" style="font-size: 1.4rem; color: #10b981;"></i>
                <div>
                  <h4 style="margin: 0; font-size: 1.05rem; color: #064e3b;">Koneksi Google Apps Script Berhasil Terhubung!</h4>
                  <small style="color: #047857;">Endpoint aktif, merespon cepat, dan tersinkronisasi dengan Google Spreadsheet.</small>
                </div>
              </div>
              <span class="badge badge-success" style="font-size: 0.82rem; padding: 0.4rem 0.75rem;">
                <i class="fa-solid fa-bolt"></i> Latensi: ${res.pingLatency} ms (Sangat Cepat)
              </span>
            </div>

            <div class="diagnostic-grid">
              <div class="diagnostic-item">
                <span class="diagnostic-item-label">Status Server API</span>
                <span class="diagnostic-item-value" style="color: #065f46;">
                  <i class="fa-solid fa-check text-success"></i> ${res.serverMessage}
                </span>
              </div>
              <div class="diagnostic-item">
                <span class="diagnostic-item-label">Database Spreadsheet</span>
                <span class="diagnostic-item-value" style="color: #065f46;">
                  <i class="fa-solid fa-table text-success"></i> ${res.spreadsheetConnected ? 'Terkoneksi & Siap' : 'Terhubung'}
                </span>
              </div>
              <div class="diagnostic-item">
                <span class="diagnostic-item-label">Mode Produksi</span>
                <span class="diagnostic-item-value" style="color: #0d7a57;">
                  <i class="fa-solid fa-shield-halved text-success"></i> Murni Tanpa Dummy
                </span>
              </div>
              <div class="diagnostic-item">
                <span class="diagnostic-item-label">Target Donasi Resmi</span>
                <span class="diagnostic-item-value" style="color: #0d7a57;">
                  ${formatRp(res.targetDonasi)}
                </span>
              </div>
            </div>

            <div style="background: #ffffff; border-radius: 8px; border: 1px solid #d1fae5; padding: 0.75rem 1rem; margin-top: 0.75rem; font-size: 0.82rem; color: #334155; line-height: 1.5;">
              <div><strong>URL Web App:</strong> <span style="font-family: monospace; word-break: break-all; color: #0d7a57;">${res.url}</span></div>
              <div style="margin-top: 0.25rem;"><strong>Waktu Respon Server:</strong> ${formattedDate} WIB</div>
              <div style="margin-top: 0.25rem;"><strong>Program Ambulan:</strong> ${res.namaProgram}</div>
            </div>

            <div style="margin-top: 0.75rem; display: flex; justify-content: flex-end;">
              <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('connection-test-result').style.display='none'">
                Tutup Hasil Diagnostik
              </button>
            </div>
          `;
        }

        window.app.showToast('Koneksi Google Apps Script berhasil diuji! (Latensi: ' + res.pingLatency + 'ms)', 'success');
      } else {
        if (badge) {
          badge.innerHTML = '<span class="pulse-red"></span> Gagal Terhubung';
          badge.style.background = '#fef2f2';
          badge.style.color = '#991b1b';
          badge.style.borderColor = '#fecaca';
        }
        this.updateConnectionBadges(false);

        if (resultBox) {
          resultBox.className = 'card';
          resultBox.style.display = 'block';
          resultBox.style.border = '1px solid #ef4444';
          resultBox.style.background = '#fff5f5';
          resultBox.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem; color: #991b1b; margin-bottom: 0.75rem;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.5rem; color: #ef4444; margin-top: 0.1rem;"></i>
              <div>
                <h4 style="margin: 0; color: #b91c1c;">Gagal Terhubung ke Google Apps Script</h4>
                <div style="font-size: 0.85rem; color: #7f1d1d; margin-top: 0.25rem;">${res.error || 'Server tidak merespon.'}</div>
              </div>
            </div>
            
            <div style="background: #ffffff; border-radius: 8px; border: 1px solid #fecaca; padding: 0.75rem 1rem; font-size: 0.82rem; color: #374151; line-height: 1.6;">
              <strong>Langkah Pemeriksaan:</strong>
              <ul style="margin: 0.4rem 0 0 1.25rem; padding: 0;">
                <li>Pastikan URL berakhiran <code>/exec</code> (bukan <code>/edit</code>).</li>
                <li>Pastikan opsi <strong>"Who has access"</strong> saat deploy di Google Apps Script dipilih <strong>"Anyone"</strong>.</li>
                <li>Periksa koneksi internet perangkat Anda.</li>
                <li>Gunakan tombol <strong>"Reset ke URL Resmi"</strong> untuk memulihkan konfigurasi bawaan Ponpes Imam Syafi'i.</li>
              </ul>
            </div>

            <div style="margin-top: 0.75rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button type="button" class="btn btn-sm btn-outline" onclick="window.adminPortal.runTestConnection()">
                <i class="fa-solid fa-rotate"></i> Coba Lagi
              </button>
              <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('connection-test-result').style.display='none'">
                Tutup
              </button>
            </div>
          `;
        }

        window.app.showToast('Gagal terhubung ke Apps Script: ' + (res.error || 'Timeout'), 'error');
      }
    } catch (e) {
      console.error('Error running test connection:', e);
      window.app.showToast('Kesalahan pengujian koneksi: ' + e.toString(), 'error');
    } finally {
      if (btnTest) {
        btnTest.disabled = false;
        btnTest.innerHTML = originalText;
      }
    }
  }

  updateConnectionBadges(isOnline = true) {
    const sidebarStatus = document.getElementById('admin-sidebar-status');
    if (sidebarStatus) {
      if (isOnline) {
        sidebarStatus.innerHTML = '<span class="pulse-green"></span> Apps Script Online';
        sidebarStatus.style.color = '#a7f3d0';
      } else {
        sidebarStatus.innerHTML = '<span class="pulse-red"></span> Apps Script Offline';
        sidebarStatus.style.color = '#fca5a5';
      }
    }
  }

  openTambahDonasiModal(donorNama = '', donorWa = '') {
    const formDonasi = document.getElementById('form-tambah-donasi');
    if (formDonasi) formDonasi.reset();
    const tglInput = document.getElementById('donasi-manual-tanggal');
    if (tglInput) {
      tglInput.value = new Date().toISOString().substring(0, 10);
    }
    if (donorNama) {
      const namaInput = document.getElementById('donasi-manual-nama');
      if (namaInput) namaInput.value = donorNama;
    }
    if (donorWa && donorWa !== '-') {
      const waInput = document.getElementById('donasi-manual-wa');
      if (waInput) waInput.value = donorWa;
    }
    this.currentDonasiManualBukti = null;
    const previewCont = document.getElementById('donasi-manual-bukti-preview-container');
    if (previewCont) previewCont.style.display = 'none';
    const previewImg = document.getElementById('donasi-manual-bukti-preview');
    if (previewImg) previewImg.src = '';

    // Update opsi metode donasi manual sesuai bank yang aktif
    const selMetode = document.getElementById('donasi-manual-metode');
    if (selMetode) {
      const s = (this.adminData && this.adminData.settings) ? this.adminData.settings : (window.ambulanApi.getDb()?.settings || {});
      const b1Nama = s.bank1_nama || 'Bank Syariah Indonesia (BSI)';
      const b2Nama = s.bank2_nama || 'Bank Muamalat';
      const isB1Aktif = (s.bank1_aktif === undefined || s.bank1_aktif === null || String(s.bank1_aktif) === 'true' || s.bank1_aktif === true);
      const isB2Aktif = (s.bank2_aktif === undefined || s.bank2_aktif === null || String(s.bank2_aktif) === 'true' || s.bank2_aktif === true);

      let html = '';
      if (isB1Aktif) html += `<option value="${b1Nama}">${b1Nama}</option>`;
      if (isB2Aktif) html += `<option value="${b2Nama}">${b2Nama}</option>`;
      html += `<option value="QRIS">QRIS</option>`;
      html += `<option value="Tunai / Kas">Tunai / Kas Langsung</option>`;
      if (!isB1Aktif && !isB2Aktif) {
        html += `<option value="Transfer Bank Lain">Transfer Bank Lain</option>`;
      }
      selMetode.innerHTML = html;
    }

    window.app.openModal('modal-tambah-donasi');
  }

  openTambahPengeluaranModal() {
    const formExp = document.getElementById('form-tambah-pengeluaran');
    if (formExp) formExp.reset();
    const tglInput = document.getElementById('exp-tanggal');
    if (tglInput) {
      tglInput.value = new Date().toISOString().substring(0, 10);
    }
    window.app.openModal('modal-tambah-pengeluaran');
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
      `Jl. Terusan Islamic Center – Sigempol Km. 3, Limbangan Wetan, Brebes`
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
    } else if (type === 'donatur') {
      filename = `data-donatur-ambulan-${new Date().toISOString().substring(0, 10)}.csv`;
      csvContent += "ID,Nama Donatur,No WA,Alamat,Total Kontribusi,Frekuensi Donasi,Donasi Terakhir\n";
      (this.adminData.donatur || []).forEach(d => {
        csvContent += `"${d.id}","${d.nama}","${String(d.no_wa || '-')}","${d.alamat || '-'}","${d.total_donasi}","${d.frekuensi}","${d.donasi_terakhir || '-'}"\n`;
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

    // Search Donatur
    const searchDonaturInput = document.getElementById('search-donatur-input');
    if (searchDonaturInput) {
      searchDonaturInput.addEventListener('input', () => this.renderDataDonatur());
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

    // Form Tambah Donasi Manual
    const formTambahDonasi = document.getElementById('form-tambah-donasi');
    if (formTambahDonasi) {
      // Live format rupiah untuk nominal donasi manual
      const donasiNominalInput = document.getElementById('donasi-manual-nominal');
      if (donasiNominalInput) {
        donasiNominalInput.addEventListener('input', (e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          e.target.value = raw ? Number(raw).toLocaleString('id-ID') : '';
        });
      }

      // Input file bukti transfer / kwitansi manual
      const inputBuktiManual = document.getElementById('donasi-manual-bukti');
      const previewCont = document.getElementById('donasi-manual-bukti-preview-container');
      const previewImg = document.getElementById('donasi-manual-bukti-preview');
      const btnHapusBukti = document.getElementById('btn-hapus-bukti-manual');

      if (inputBuktiManual) {
        inputBuktiManual.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              window.app.showToast('Ukuran foto bukti donasi maksimal 5MB', 'error');
              inputBuktiManual.value = '';
              return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
              this.currentDonasiManualBukti = event.target.result;
              if (previewImg && previewCont) {
                previewImg.src = event.target.result;
                previewCont.style.display = 'block';
              }
            };
            reader.readAsDataURL(file);
          }
        });
      }

      if (btnHapusBukti) {
        btnHapusBukti.addEventListener('click', () => {
          this.currentDonasiManualBukti = null;
          if (inputBuktiManual) inputBuktiManual.value = '';
          if (previewCont) previewCont.style.display = 'none';
          if (previewImg) previewImg.src = '';
        });
      }

      formTambahDonasi.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tanggal = document.getElementById('donasi-manual-tanggal')?.value;
        const nama = document.getElementById('donasi-manual-nama')?.value.trim();
        const no_wa = document.getElementById('donasi-manual-wa')?.value.trim();
        const nominal = Number((document.getElementById('donasi-manual-nominal')?.value || '').replace(/[^0-9]/g, '')) || 0;
        const metode_bayar = document.getElementById('donasi-manual-metode')?.value;
        const program = document.getElementById('donasi-manual-program')?.value;
        const status = document.getElementById('donasi-manual-status')?.value || 'Verified';
        const doa_pesan = document.getElementById('donasi-manual-doa')?.value.trim();

        if (!nama) {
          window.app.showToast('Harap masukkan nama donatur', 'warning');
          return;
        }

        if (nominal <= 0) {
          window.app.showToast('Harap masukkan nominal donasi yang sah (> Rp 0)', 'warning');
          return;
        }

        const submitBtn = formTambahDonasi.querySelector('button[type="submit"]');
        const origBtnText = submitBtn ? submitBtn.innerHTML : 'Simpan Donasi';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        }

        try {
          const res = await window.ambulanApi.addDonasiManual({
            tanggal: tanggal,
            nama: nama,
            no_wa: no_wa || '-',
            nominal: nominal,
            metode_bayar: metode_bayar,
            program: program,
            status: status,
            doa_pesan: doa_pesan || 'Donasi dicatat manual oleh admin',
            bukti_base64: this.currentDonasiManualBukti || ''
          }, this.getCurrentUser()?.nama || 'Admin');

          if (res && res.success) {
            window.app.showToast(res.message || 'Donasi manual berhasil dicatat!', 'success');
            formTambahDonasi.reset();
            this.currentDonasiManualBukti = null;
            if (previewCont) previewCont.style.display = 'none';
            if (previewImg) previewImg.src = '';
            window.app.closeModal('modal-tambah-donasi');

            await this.loadAdminData();
            await window.publicPortal.refreshPublicData();

            // Jika status Verified dan ada nomor WhatsApp, tawarkan pengiriman kwitansi
            if (status === 'Verified' && no_wa && no_wa !== '-' && res.donasiId) {
              setTimeout(() => {
                if (confirm(`Donasi ${res.donasiId} berhasil dicatat sebagai TERVERIFIKASI.\n\nApakah Anda ingin langsung membuka WhatsApp untuk mengirim Kwitansi Tanda Terima resmi ke donatur (${nama})?`)) {
                  this.sendKwitansiWa(res.donasiId);
                }
              }, 400);
            }
          } else {
            window.app.showToast(res?.message || 'Gagal menyimpan donasi manual', 'error');
          }
        } catch (err) {
          window.app.showToast('Gagal mencatat donasi manual: ' + err.toString(), 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnText;
          }
        }
      });
    }

    // Form Tambah Pengeluaran
    const formPengeluaran = document.getElementById('form-tambah-pengeluaran');
    if (formPengeluaran) {
      // Live format rupiah untuk nominal pengeluaran
      const expNominalInput = document.getElementById('exp-nominal');
      if (expNominalInput) {
        expNominalInput.addEventListener('input', (e) => {
          const raw = e.target.value.replace(/[^0-9]/g, '');
          e.target.value = raw ? Number(raw).toLocaleString('id-ID') : '';
        });
      }
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
        const targetVal = Number(document.getElementById('setting-target-donasi')?.value) || 250000000;
        
        const bank1Nama = document.getElementById('setting-bank1-nama')?.value.trim() || 'Bank Syariah Indonesia (BSI)';
        const bank1Norek = (document.getElementById('setting-bank1-norek')?.value.trim() || '7123456789').replace(/[^\d]/g, '');
        const bank1AtasNama = document.getElementById('setting-bank1-atas-nama')?.value.trim() || 'YAYASAN IMAM SYAFII BREBES';
        const bank1Aktif = document.getElementById('setting-bank1-aktif') ? document.getElementById('setting-bank1-aktif').checked : true;

        const bank2Nama = document.getElementById('setting-bank2-nama')?.value.trim() || 'Bank Muamalat';
        const bank2Norek = (document.getElementById('setting-bank2-norek')?.value.trim() || '5010099888').replace(/[^\d]/g, '');
        const bank2AtasNama = document.getElementById('setting-bank2-atas-nama')?.value.trim() || "Ponpes Imam Syafi'i Brebes";
        const bank2Aktif = document.getElementById('setting-bank2-aktif') ? document.getElementById('setting-bank2-aktif').checked : true;

        const hotlineVal = document.getElementById('setting-hotline')?.value.trim() || '0812-9154-2134 (Ustadz Tegar)';
        const waVal = (document.getElementById('setting-wa-konfirmasi')?.value.trim() || '6281291542134').replace(/[^\d]/g, '');
        const driverVal = document.getElementById('setting-kontak-driver')?.value.trim() || '0857-1234-5678 (Driver Pak Slamet)';
        const alamatVal = document.getElementById('setting-alamat')?.value.trim() || '';

        const appsScriptUrl = document.getElementById('setting-apps-script-url')?.value.trim() || '';
        const onlineMode = document.getElementById('setting-online-mode-toggle')?.checked ?? true;
        const filterDemo = document.getElementById('setting-filter-demo-toggle')?.checked ?? true;

        window.ambulanApi.setAppsScriptUrl(appsScriptUrl);
        window.ambulanApi.setOnlineMode(onlineMode);
        window.ambulanApi.setFilterDemoData(filterDemo);

        const newSettings = {
          target_donasi: targetVal,
          bank1_nama: bank1Nama,
          bank1_norek: bank1Norek,
          bank1_atas_nama: bank1AtasNama,
          bank1_aktif: bank1Aktif ? "true" : "false",
          bank2_nama: bank2Nama,
          bank2_norek: bank2Norek,
          bank2_atas_nama: bank2AtasNama,
          bank2_aktif: bank2Aktif ? "true" : "false",
          rekening_bsi: `${bank1Norek} a.n. ${bank1AtasNama}`,
          rekening_muamalat: `${bank2Norek} a.n. ${bank2AtasNama}`,
          hotline_darurat: hotlineVal,
          wa_konfirmasi: waVal,
          kontak_driver: driverVal,
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

    // Checkbox Toggle Tampilkan Bank 1 & Bank 2
    const chkBank1 = document.getElementById('setting-bank1-aktif');
    if (chkBank1) {
      chkBank1.addEventListener('change', (e) => {
        this.updateBankCardVisual(1, e.target.checked);
      });
    }

    const chkBank2 = document.getElementById('setting-bank2-aktif');
    if (chkBank2) {
      chkBank2.addEventListener('change', (e) => {
        this.updateBankCardVisual(2, e.target.checked);
      });
    }

    // Tombol Tes Koneksi Apps Script
    const btnTest = document.getElementById('btn-test-connection');
    if (btnTest) {
      btnTest.addEventListener('click', (e) => {
        e.preventDefault();
        this.runTestConnection();
      });
    }

    // Tombol Reset ke URL Resmi
    const btnResetUrl = document.getElementById('btn-reset-apps-script-url');
    if (btnResetUrl) {
      btnResetUrl.addEventListener('click', (e) => {
        e.preventDefault();
        const inputUrl = document.getElementById('setting-apps-script-url');
        const checkOnline = document.getElementById('setting-online-mode-toggle');
        const checkFilter = document.getElementById('setting-filter-demo-toggle');

        const defaultUrl = 'https://script.google.com/macros/s/AKfycbzWpWylCScaz13HUfjbdVyMyfYI2ePlrucY0jgfg4DZgJtLc60NXwhycAnOSFE_2SGP/exec';
        if (inputUrl) inputUrl.value = defaultUrl;
        if (checkOnline) checkOnline.checked = true;
        if (checkFilter) checkFilter.checked = true;

        window.ambulanApi.setAppsScriptUrl(defaultUrl);
        window.ambulanApi.setOnlineMode(true);
        window.ambulanApi.setFilterDemoData(true);

        window.app.showToast("URL Apps Script direset ke deployment resmi Ponpes Imam Syafi'i", "info");
        this.runTestConnection(defaultUrl);
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
