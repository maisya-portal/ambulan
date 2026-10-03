/**
 * =========================================================================
 * API & DATA LAYER - AMBULAN PONPES IMAM SYAFI'I BREBES
 * =========================================================================
 * Mengelola komunikasi ke Google Apps Script Web App & Sinkronisasi Local Cache
 * Spreadsheet ID : 1q5f7EI5H1SBmb50U4yaFyi7eTDEUgVqpoU4j4yesd8o
 * Script ID      : 12z6YFl03wUrCn7HE8q9Qs-dAgAK6qQRxWV2WWmQJ6ck_bSMWrL6mkEH-
 * =========================================================================
 */

const ApiConfig = {
  // URL Deployment Web App Apps Script Resmi Ponpes Imam Syafi'i Brebes
  APPS_SCRIPT_URL_KEY: 'maisya_apps_script_url',
  LOCAL_DB_KEY: 'maisya_ambulan_db_v1',
  DEFAULT_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzWpWylCScaz13HUfjbdVyMyfYI2ePlrucY0jgfg4DZgJtLc60NXwhycAnOSFE_2SGP/exec',
  USE_ONLINE_MODE_KEY: 'maisya_use_online_mode'
};

// Database Bersih (Tanpa Data Demo) Ponpes Imam Syafi'i Brebes
const INITIAL_DATABASE = {
  settings: {
    target_donasi: 250000000,
    nama_program: "Pengadaan & Operasional Ambulan Medis Ponpes Imam Syafi'i Brebes",
    rekening_bsi: "7123456789 a.n. YAYASAN IMAM SYAFII BREBES",
    rekening_muamalat: "5010099888 a.n. Ponpes Imam Syafi'i Brebes",
    hotline_darurat: "0812-3456-7890",
    wa_konfirmasi: "6281234567890",
    alamat_ponpes: "Jl. Raya Karangsari - Luwungragi, Kec. Bulakamba, Kab. Brebes, Jawa Tengah 52253"
  },
  users: [
    { id: "USR-001", username: "admin", password: "admin123", nama: "Super Admin Maisya", role: "superadmin", no_hp: "081234567890", status: "aktif" },
    { id: "USR-002", username: "verifikator", password: "maisya2026", nama: "Ustadz Ridwan (Keuangan)", role: "verifikator", no_hp: "081298765432", status: "aktif" },
    { id: "USR-003", username: "driver1", password: "driver123", nama: "Pak Slamet (Driver Ambulan)", role: "driver", no_hp: "081345678901", status: "aktif" }
  ],
  donatur: [],
  donasi_masuk: [],
  pengeluaran: [],
  layanan_ambulan: [],
  audit_log: [
    { id: "AUD-001", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: "system", action: "INITIALIZE", detail: "Sistem Ambulan Ponpes Imam Syafi'i aktif" }
  ]
};

class AmbulanApi {
  constructor() {
    this.initLocalDb();
  }

  initLocalDb() {
    // Selalu pastikan URL Apps Script mengarah ke URL deployment produksi resmi
    localStorage.setItem(ApiConfig.APPS_SCRIPT_URL_KEY, ApiConfig.DEFAULT_APPS_SCRIPT_URL);
    localStorage.setItem(ApiConfig.USE_ONLINE_MODE_KEY, 'true');

    const cleanedFlag = localStorage.getItem('maisya_clean_production_v2');
    if (!cleanedFlag) {
      localStorage.setItem(ApiConfig.LOCAL_DB_KEY, JSON.stringify(INITIAL_DATABASE));
      localStorage.setItem('maisya_clean_production_v2', 'true');
    } else if (!localStorage.getItem(ApiConfig.LOCAL_DB_KEY)) {
      localStorage.setItem(ApiConfig.LOCAL_DB_KEY, JSON.stringify(INITIAL_DATABASE));
    }
  }

  getDb() {
    try {
      const data = localStorage.getItem(ApiConfig.LOCAL_DB_KEY);
      return data ? JSON.parse(data) : INITIAL_DATABASE;
    } catch (e) {
      return INITIAL_DATABASE;
    }
  }

  saveDb(db) {
    localStorage.setItem(ApiConfig.LOCAL_DB_KEY, JSON.stringify(db));
  }

  getAppsScriptUrl() {
    return localStorage.getItem(ApiConfig.APPS_SCRIPT_URL_KEY) || ApiConfig.DEFAULT_APPS_SCRIPT_URL;
  }

  setAppsScriptUrl(url) {
    localStorage.setItem(ApiConfig.APPS_SCRIPT_URL_KEY, url.trim());
  }

  isOnlineMode() {
    return localStorage.getItem(ApiConfig.USE_ONLINE_MODE_KEY) === 'true';
  }

  setOnlineMode(isOnline) {
    localStorage.setItem(ApiConfig.USE_ONLINE_MODE_KEY, isOnline ? 'true' : 'false');
  }

  // ------------------------------------------------------------------------
  // PUBLIC ENDPOINTS
  // ------------------------------------------------------------------------

  async getPublicData() {
    // Coba ambil dari Google Apps Script jika online mode aktif
    if (this.isOnlineMode()) {
      try {
        const url = `${this.getAppsScriptUrl()}?action=getPublicData`;
        const res = await fetch(url);
        const json = await res.json();
        if (json && json.success && json.data) {
          return json.data;
        }
      } catch (err) {
        console.warn('Apps Script offline/unreachable, fallback to local storage:', err);
      }
    }

    // Fallback Local Storage
    const db = this.getDb();
    let totalTerkumpul = 0;
    let totalDonatur = 0;
    const verifiedDonations = [];

    (db.donasi_masuk || []).forEach(d => {
      if (d.status === 'Verified') {
        const nom = Number(d.nominal) || 0;
        totalTerkumpul += nom;
        totalDonatur++;
        verifiedDonations.push({
          id: d.id,
          tanggal: d.tanggal,
          nama: d.nama_donatur,
          nominal: nom,
          program: d.program,
          doa: d.doa_pesan
        });
      }
    });

    let totalPengeluaran = 0;
    const listPengeluaran = [];
    (db.pengeluaran || []).forEach(p => {
      const nom = Number(p.nominal) || 0;
      totalPengeluaran += nom;
      listPengeluaran.push({
        id: p.id,
        tanggal: p.tanggal,
        kategori: p.kategori,
        deskripsi: p.deskripsi,
        nominal: nom,
        pic: p.pic,
        bukti: p.bukti_nota
      });
    });

    const targetDonasi = Number(db.settings.target_donasi) || 250000000;
    const saldoKas = totalTerkumpul - totalPengeluaran;
    const persentase = Math.min(100, Math.round((totalTerkumpul / targetDonasi) * 100));

    return {
      stats: {
        targetDonasi,
        totalTerkumpul,
        sisaTarget: Math.max(0, targetDonasi - totalTerkumpul),
        persentase,
        totalDonatur,
        totalPengeluaran,
        saldoKas
      },
      settings: db.settings,
      transparansiDonasi: verifiedDonations.slice(0, 50),
      transparansiPengeluaran: listPengeluaran.slice(0, 50)
    };
  }

  async submitDonasi(formData) {
    if (this.isOnlineMode()) {
      try {
        const res = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submitDonasi', ...formData })
        });
        const json = await res.json();
        if (json.success) return json;
      } catch (e) {
        console.warn('Apps Script POST failed, saving to local cache:', e);
      }
    }

    // Local DB save
    const db = this.getDb();
    const now = new Date();
    const id = "DON-" + now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + "-" +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const tanggal = now.toISOString().replace('T', ' ').substring(0, 19);
    const nominal = Number(formData.nominal) || 0;

    const newDonasi = {
      id: id,
      tanggal: tanggal,
      nama_donatur: formData.nama || "Hamba Allah",
      no_wa: formData.no_wa || "-",
      nominal: nominal,
      metode_bayar: formData.metode_bayar || "BSI Transfer",
      program: formData.program || "Pengadaan Armada",
      doa_pesan: formData.doa_pesan || "-",
      bukti_transfer: formData.bukti_base64 || "assets/logo.svg",
      status: "Pending",
      verified_by: "",
      verified_at: "",
      alasan_tolak: ""
    };

    db.donasi_masuk.unshift(newDonasi);

    // Update donatur table
    if (formData.no_wa && formData.no_wa !== "-") {
      let donatur = db.donatur.find(d => d.no_wa === formData.no_wa);
      if (donatur) {
        donatur.total_donasi += nominal;
        donatur.frekuensi += 1;
      } else {
        db.donatur.push({
          id: "DTR-" + String(db.donatur.length + 1).padStart(3, '0'),
          nama: formData.nama || "Hamba Allah",
          no_wa: formData.no_wa,
          email: formData.email || "-",
          alamat: formData.alamat || "-",
          total_donasi: nominal,
          frekuensi: 1,
          created_at: tanggal
        });
      }
    }

    // Audit log
    db.audit_log.unshift({
      id: "AUD-" + Date.now(),
      timestamp: tanggal,
      user: "public",
      action: "SUBMIT_DONASI",
      detail: `Donasi baru Rp ${nominal.toLocaleString('id-ID')} diajukan oleh ${newDonasi.nama_donatur}`
    });

    this.saveDb(db);
    return {
      success: true,
      message: "Donasi berhasil dikirim dan menunggu verifikasi admin.",
      donasiId: id
    };
  }

  async requestAmbulance(data) {
    if (this.isOnlineMode()) {
      try {
        const res = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'requestAmbulance', ...data })
        });
        const json = await res.json();
        if (json.success) return json;
      } catch (e) {
        console.warn('Apps script request failed:', e);
      }
    }

    const db = this.getDb();
    const id = "AMB-" + Date.now();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.layanan_ambulan.unshift({
      id: id,
      tanggal: now,
      nama_pemohon: data.nama_pemohon,
      no_wa: data.no_wa,
      nama_pasien: data.nama_pasien,
      kategori_pasien: data.kategori_pasien || "Santri",
      tujuan_faskes: data.tujuan_faskes,
      alamat_jemput: data.alamat_jemput,
      driver: "Menunggu Driver",
      status: "Menunggu Konfirmasi",
      catatan: data.catatan || "-"
    });

    db.audit_log.unshift({
      id: "AUD-" + Date.now(),
      timestamp: now,
      user: "public",
      action: "REQUEST_AMBULANCE",
      detail: `Panggilan darurat dari ${data.nama_pemohon} (${data.no_wa})`
    });

    this.saveDb(db);
    return {
      success: true,
      message: "Permohonan ambulan telah tercatat! Tim siaga darurat kami segera menghubungi Anda via WhatsApp.",
      layananId: id
    };
  }

  // ------------------------------------------------------------------------
  // ADMIN AUTH & CRUD
  // ------------------------------------------------------------------------

  async loginAdmin(username, password) {
    if (this.isOnlineMode()) {
      try {
        const res = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'loginAdmin', username, password })
        });
        const json = await res.json();
        if (json.success) return json;
      } catch (e) {
        console.warn('Apps script login failed:', e);
      }
    }

    const db = this.getDb();
    const user = (db.users || []).find(u =>
      u.username.toLowerCase() === username.trim().toLowerCase() &&
      u.password === password.trim()
    );

    if (user) {
      if (user.status !== 'aktif') {
        return { success: false, message: 'Akun Anda berstatus nonaktif!' };
      }
      const token = 'MAISYA-TOKEN-' + Date.now();
      const userData = {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        no_hp: user.no_hp
      };

      db.audit_log.unshift({
        id: "AUD-" + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: user.username,
        action: "LOGIN",
        detail: `Login berhasil (${user.nama})`
      });
      this.saveDb(db);

      return { success: true, token, user: userData };
    }

    return { success: false, message: 'Username atau kata sandi tidak cocok!' };
  }

  async getAdminData() {
    if (this.isOnlineMode()) {
      try {
        const token = sessionStorage.getItem('maisya_admin_token') || 'MAISYA-TOKEN';
        const url = `${this.getAppsScriptUrl()}?action=getAdminData&token=${token}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data) {
          // Normalisasi tipe data string secara defensif
          if (Array.isArray(json.data.donasi)) {
            json.data.donasi.forEach(d => {
              if (d.no_wa !== undefined && d.no_wa !== null) d.no_wa = String(d.no_wa);
              if (d.id !== undefined && d.id !== null) d.id = String(d.id);
            });
          }
          if (Array.isArray(json.data.donatur)) {
            json.data.donatur.forEach(d => {
              if (d.no_wa !== undefined && d.no_wa !== null) d.no_wa = String(d.no_wa);
              if (d.id !== undefined && d.id !== null) d.id = String(d.id);
            });
          }
          if (Array.isArray(json.data.users)) {
            json.data.users.forEach(u => {
              if (u.no_hp !== undefined && u.no_hp !== null) u.no_hp = String(u.no_hp);
              if (u.id !== undefined && u.id !== null) u.id = String(u.id);
            });
          }
          return json.data;
        }
      } catch (e) {
        console.warn('Apps script getAdminData failed:', e);
      }
    }

    const db = this.getDb();
    let totalMasukVerified = 0;
    let totalPending = 0;
    let countPending = 0;
    let countVerified = 0;
    let countRejected = 0;

    (db.donasi_masuk || []).forEach(d => {
      const nom = Number(d.nominal) || 0;
      if (d.status === 'Verified') {
        totalMasukVerified += nom;
        countVerified++;
      } else if (d.status === 'Pending') {
        totalPending += nom;
        countPending++;
      } else if (d.status === 'Rejected') {
        countRejected++;
      }
    });

    let totalPengeluaran = 0;
    (db.pengeluaran || []).forEach(p => {
      totalPengeluaran += (Number(p.nominal) || 0);
    });

    const saldoKas = totalMasukVerified - totalPengeluaran;

    return {
      kpi: {
        saldoKas,
        totalMasukVerified,
        totalPending,
        countPending,
        countVerified,
        countRejected,
        totalPengeluaran,
        totalDonatur: (db.donatur || []).length,
        totalLayanan: (db.layanan_ambulan || []).length
      },
      donasi: db.donasi_masuk || [],
      pengeluaran: db.pengeluaran || [],
      donatur: db.donatur || [],
      users: (db.users || []).map(u => ({ ...u, password: '***' })),
      auditLog: db.audit_log || [],
      layananAmbulan: db.layanan_ambulan || [],
      settings: db.settings
    };
  }

  async verifyDonasi(id, status, adminName, alasan = '') {
    if (this.isOnlineMode()) {
      try {
        const res = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verifyDonasi', id, status, adminName, alasan })
        });
        const json = await res.json();
        if (json.success) return json;
      } catch (e) {
        console.warn('Apps script verify error:', e);
      }
    }

    const db = this.getDb();
    const item = (db.donasi_masuk || []).find(d => d.id === id);
    if (!item) return { success: false, message: 'Data donasi tidak ditemukan!' };

    item.status = status;
    item.verified_by = adminName;
    item.verified_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    item.alasan_tolak = alasan;

    db.audit_log.unshift({
      id: "AUD-" + Date.now(),
      timestamp: item.verified_at,
      user: adminName,
      action: "VERIFY_DONASI",
      detail: `Donasi ${id} diubah status menjadi ${status} (${alasan || 'Valid'})`
    });

    this.saveDb(db);
    return { success: true, message: `Donasi ${id} berhasil di-${status}!` };
  }

  async addPengeluaran(expenseData, adminName) {
    if (this.isOnlineMode()) {
      try {
        const res = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'addPengeluaran', ...expenseData, pic: adminName })
        });
        const json = await res.json();
        if (json.success) return json;
      } catch (e) {
        console.warn('Apps script addPengeluaran error:', e);
      }
    }

    const db = this.getDb();
    const now = new Date();
    const id = "EXP-" + now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + "-" +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0');

    const newExpense = {
      id: id,
      tanggal: expenseData.tanggal || now.toISOString().substring(0, 10),
      kategori: expenseData.kategori,
      deskripsi: expenseData.deskripsi,
      nominal: Number(expenseData.nominal) || 0,
      pic: adminName || expenseData.pic || "Admin",
      bukti_nota: expenseData.bukti_nota || "assets/logo.svg"
    };

    db.pengeluaran.unshift(newExpense);

    db.audit_log.unshift({
      id: "AUD-" + Date.now(),
      timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
      user: adminName,
      action: "ADD_EXPENSE",
      detail: `Pengeluaran ${newExpense.kategori} senilai Rp ${newExpense.nominal.toLocaleString('id-ID')}`
    });

    this.saveDb(db);
    return { success: true, message: 'Catatan pengeluaran berhasil disimpan!', id: id };
  }

  async manageUser(subAction, data, adminActor) {
    const db = this.getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (subAction === 'add') {
      const newId = "USR-" + String(db.users.length + 1).padStart(3, '0');
      db.users.push({
        id: newId,
        username: data.username,
        password: data.password || 'maisya123',
        nama: data.nama,
        role: data.role || 'verifikator',
        no_hp: data.no_hp || '-',
        status: 'aktif'
      });
      db.audit_log.unshift({
        id: "AUD-" + Date.now(),
        timestamp: now,
        user: adminActor,
        action: "ADD_USER",
        detail: `Menambahkan user baru: ${data.username} (${data.role})`
      });
    } else if (subAction === 'edit') {
      const u = db.users.find(x => x.id === data.id);
      if (u) {
        if (data.nama) u.nama = data.nama;
        if (data.role) u.role = data.role;
        if (data.no_hp) u.no_hp = data.no_hp;
        if (data.status) u.status = data.status;
        if (data.password) u.password = data.password;
        db.audit_log.unshift({
          id: "AUD-" + Date.now(),
          timestamp: now,
          user: adminActor,
          action: "EDIT_USER",
          detail: `Mengubah data user ${data.id}`
        });
      }
    } else if (subAction === 'delete') {
      db.users = db.users.filter(x => x.id !== data.id);
      db.audit_log.unshift({
        id: "AUD-" + Date.now(),
        timestamp: now,
        user: adminActor,
        action: "DELETE_USER",
        detail: `Menghapus user ${data.id}`
      });
    }

    this.saveDb(db);
    return { success: true, message: 'Operasi manajemen user berhasil diselesaikan!' };
  }

  async updateSettings(newSettings, adminActor) {
    const db = this.getDb();
    db.settings = { ...db.settings, ...newSettings };
    db.audit_log.unshift({
      id: "AUD-" + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: adminActor,
      action: "UPDATE_SETTINGS",
      detail: 'Pengaturan sistem ambulan diperbarui'
    });
    this.saveDb(db);
    return { success: true, message: 'Pengaturan berhasil diperbarui!' };
  }

  async clearDemoData() {
    // 1. Panggil endpoint clearDemoData di Google Apps Script (POST & GET)
    try {
      await fetch(this.getAppsScriptUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearDemoData' })
      });
    } catch (e) {
      console.warn("Apps Script clearDemoData POST:", e);
    }

    try {
      await fetch(`${this.getAppsScriptUrl()}?action=clearDemoData`);
    } catch (e) {
      console.warn("Apps Script clearDemoData GET:", e);
    }

    // 2. Bersihkan local storage
    const db = this.getDb();
    db.donatur = [];
    db.donasi_masuk = [];
    db.pengeluaran = [];
    db.layanan_ambulan = [];
    db.audit_log = [
      { id: "AUD-001", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: "admin", action: "CLEAN_DATABASE", detail: "Seluruh data demo berhasil dibersihkan" }
    ];
    this.saveDb(db);

    return { success: true, message: "Seluruh data demo berhasil dibersihkan dari sistem!" };
  }

  resetToDefault() {
    localStorage.setItem(ApiConfig.LOCAL_DB_KEY, JSON.stringify(INITIAL_DATABASE));
  }
}

// Export singleton instance
window.ambulanApi = new AmbulanApi();
