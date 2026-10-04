/**
 * =========================================================================
 * API & DATA LAYER - AMBULAN PONPES IMAM SYAFI'I BREBES
 * =========================================================================
 * Mengelola komunikasi ke Google Apps Script Web App & Sinkronisasi Local Cache
 * Spreadsheet ID : 1q5f7EI5H1SBmb50U4yaFyi7eTDEUgVqpoU4j4yesd8o
 * Deployment URL : https://script.google.com/macros/s/AKfycbzWpWylCScaz13HUfjbdVyMyfYI2ePlrucY0jgfg4DZgJtLc60NXwhycAnOSFE_2SGP/exec
 * =========================================================================
 */

const ApiConfig = {
  APPS_SCRIPT_URL_KEY: 'maisya_apps_script_url',
  LOCAL_DB_KEY: 'maisya_ambulan_db_v1',
  DEFAULT_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzWpWylCScaz13HUfjbdVyMyfYI2ePlrucY0jgfg4DZgJtLc60NXwhycAnOSFE_2SGP/exec',
  USE_ONLINE_MODE_KEY: 'maisya_use_online_mode',
  FILTER_DEMO_DATA_KEY: 'maisya_filter_demo_data'
};

// Database Bersih (Murni Tanpa Data Dummy) Ponpes Imam Syafi'i Brebes
const INITIAL_DATABASE = {
  settings: {
    target_donasi: 250000000,
    nama_program: "Pengadaan & Operasional Ambulan Medis Ponpes Imam Syafi'i Brebes",
    bank1_nama: "Bank Syariah Indonesia (BSI)",
    bank1_norek: "7123456789",
    bank1_atas_nama: "YAYASAN IMAM SYAFII BREBES",
    bank2_nama: "Bank Muamalat",
    bank2_norek: "5010099888",
    bank2_atas_nama: "Ponpes Imam Syafi'i Brebes",
    rekening_bsi: "7123456789 a.n. YAYASAN IMAM SYAFII BREBES",
    rekening_muamalat: "5010099888 a.n. Ponpes Imam Syafi'i Brebes",
    hotline_darurat: "0812-9154-2134 (Ustadz Tegar)",
    wa_konfirmasi: "6281291542134",
    kontak_driver: "0813-4567-8901 (Pak Slamet)",
    alamat_ponpes: "Jl. Terusan Islamic Center – Sigempol Km. 3, Kelurahan Limbangan Wetan, Kecamatan Brebes, Kabupaten Brebes, Jawa Tengah 52218"
  },
  users: [
    { id: "USR-001", username: "ambulanmaisya", password: "ambulan991588", nama: "Super Admin Ambulan Maisya", role: "superadmin", no_hp: "081291542134", status: "aktif" },
    { id: "USR-002", username: "adminambulanmaisya", password: "ambulan991588", nama: "Super Admin Ambulan Maisya", role: "superadmin", no_hp: "081291542134", status: "aktif" }
  ],
  donatur: [],
  donasi_masuk: [],
  pengeluaran: [],
  layanan_ambulan: [],
  audit_log: [
    { id: "AUD-001", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: "ambulanmaisya", action: "INITIALIZE", detail: "Sistem Ambulan Ponpes Imam Syafi'i siap digunakan (mode bersih)" }
  ]
};

class AmbulanApi {
  constructor() {
    this.initLocalDb();
  }

  initLocalDb() {
    // 1. Selalu pastikan URL Apps Script mengarah ke URL deployment resmi
    const currentUrl = localStorage.getItem(ApiConfig.APPS_SCRIPT_URL_KEY);
    if (!currentUrl || currentUrl.trim() === '' || currentUrl.includes('AKfycby...')) {
      localStorage.setItem(ApiConfig.APPS_SCRIPT_URL_KEY, ApiConfig.DEFAULT_APPS_SCRIPT_URL);
    }

    // 2. Default mode online aktif & mode filter demo aktif
    if (localStorage.getItem(ApiConfig.USE_ONLINE_MODE_KEY) === null) {
      localStorage.setItem(ApiConfig.USE_ONLINE_MODE_KEY, 'true');
    }
    if (localStorage.getItem(ApiConfig.FILTER_DEMO_DATA_KEY) === null) {
      localStorage.setItem(ApiConfig.FILTER_DEMO_DATA_KEY, 'true');
    }

    // 3. Pembersihan cache lokal legacy versi sebelumnya
    const cleanedFlag = localStorage.getItem('maisya_clean_production_v10');
    if (!cleanedFlag) {
      const existing = this.getDb();
      existing.users = INITIAL_DATABASE.users;
      existing.donatur = [];
      existing.donasi_masuk = [];
      existing.pengeluaran = [];
      existing.layanan_ambulan = [];
      existing.settings = { ...INITIAL_DATABASE.settings, ...(existing.settings || {}) };
      existing.audit_log = [
        { id: "AUD-001", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: "ambulanmaisya", action: "INITIALIZE", detail: "Sistem diinisialisasi dalam mode produksi bersih dengan akun ambulanmaisya" }
      ];
      localStorage.setItem(ApiConfig.LOCAL_DB_KEY, JSON.stringify(existing));
      localStorage.setItem(ApiConfig.APPS_SCRIPT_URL_KEY, ApiConfig.DEFAULT_APPS_SCRIPT_URL);
      localStorage.setItem(ApiConfig.USE_ONLINE_MODE_KEY, 'true');
      localStorage.setItem(ApiConfig.FILTER_DEMO_DATA_KEY, 'true');
      localStorage.setItem('maisya_clean_production_v10', 'true');
    } else if (!localStorage.getItem(ApiConfig.LOCAL_DB_KEY)) {
      localStorage.setItem(ApiConfig.LOCAL_DB_KEY, JSON.stringify(INITIAL_DATABASE));
    }

    // 4. Selalu pastikan akun ambulanmaisya dan adminambulanmaisya terdaftar di db lokal
    const currentDb = this.getDb();
    currentDb.users = INITIAL_DATABASE.users;
    this.saveDb(currentDb);
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
    const saved = localStorage.getItem(ApiConfig.APPS_SCRIPT_URL_KEY);
    return (saved && saved.trim().length > 10) ? saved.trim() : ApiConfig.DEFAULT_APPS_SCRIPT_URL;
  }

  setAppsScriptUrl(url) {
    const clean = (url || '').trim();
    localStorage.setItem(ApiConfig.APPS_SCRIPT_URL_KEY, clean || ApiConfig.DEFAULT_APPS_SCRIPT_URL);
  }

  isOnlineMode() {
    const val = localStorage.getItem(ApiConfig.USE_ONLINE_MODE_KEY);
    return val === null ? true : val === 'true';
  }

  setOnlineMode(isOnline) {
    localStorage.setItem(ApiConfig.USE_ONLINE_MODE_KEY, isOnline ? 'true' : 'false');
  }

  isFilterDemoData() {
    const val = localStorage.getItem(ApiConfig.FILTER_DEMO_DATA_KEY);
    return val === null ? true : val === 'true';
  }

  setFilterDemoData(isFilter) {
    localStorage.setItem(ApiConfig.FILTER_DEMO_DATA_KEY, isFilter ? 'true' : 'false');
  }

  /**
   * Mendeteksi baris data dummy seed awal dari spreadsheet lama
   */
  isDemoRecord(item) {
    if (!item) return false;
    const id = String(item.id || '').trim();
    // Pattern ID demo: DON-202603*, EXP-202603*, AMB-202603*, DTR-00*
    if (/^(DON|EXP|AMB)-202603/i.test(id)) return true;
    if (/^DTR-00[123]$/i.test(id)) return true;

    // Pattern nama demo awal
    const name = String(item.nama || item.nama_donatur || item.nama_pemohon || '').trim().toLowerCase();
    if (name === 'h. ahmad syafii' && Number(item.nominal) === 3000000) return true;
    if (name === 'keluarga santri maisya' && Number(item.nominal) === 2500000) return true;
    if (name === 'ibu siti mariyam' && id.startsWith('AMB-')) return true;

    return false;
  }

  // ------------------------------------------------------------------------
  // TEST KONEKSI GOOGLE APPS SCRIPT
  // ------------------------------------------------------------------------

  async testConnection(customUrl = null) {
    const targetUrl = (customUrl || this.getAppsScriptUrl()).trim();
    const result = {
      success: false,
      url: targetUrl,
      pingLatency: 0,
      publicLatency: 0,
      serverMessage: '',
      serverTimestamp: '',
      spreadsheetConnected: false,
      targetDonasi: 0,
      totalTerkumpul: 0,
      totalPengeluaran: 0,
      donasiCount: 0,
      pengeluaranCount: 0,
      namaProgram: '',
      error: null
    };

    try {
      // 1. Tes Ping Latensi
      const pingStart = performance.now();
      const pingRes = await fetch(`${targetUrl}?action=ping&_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      result.pingLatency = Math.round(performance.now() - pingStart);

      if (!pingRes.ok) {
        throw new Error(`Server Apps Script merespon kode HTTP ${pingRes.status} (${pingRes.statusText})`);
      }

      const pingJson = await pingRes.json();
      result.serverMessage = pingJson.message || 'API Ambulan Ponpes Imam Syafi\'i Aktif';
      result.serverTimestamp = pingJson.timestamp || new Date().toISOString();

      // 2. Tes Akses Data Spreadsheet
      const dataStart = performance.now();
      const dataRes = await fetch(`${targetUrl}?action=getPublicData&_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      result.publicLatency = Math.round(performance.now() - dataStart);

      if (dataRes.ok) {
        const dataJson = await dataRes.json();
        if (dataJson && dataJson.success && dataJson.data) {
          result.spreadsheetConnected = true;
          const stats = dataJson.data.stats || {};
          const settings = dataJson.data.settings || {};
          result.targetDonasi = stats.targetDonasi || settings.target_donasi || 250000000;
          result.totalTerkumpul = stats.totalTerkumpul || 0;
          result.totalPengeluaran = stats.totalPengeluaran || 0;
          result.donasiCount = (dataJson.data.transparansiDonasi || []).length;
          result.pengeluaranCount = (dataJson.data.transparansiPengeluaran || []).length;
          result.namaProgram = settings.nama_program || 'Pengadaan & Operasional Ambulan Ponpes Imam Syafi\'i';
        }
      }

      result.success = true;
      return result;
    } catch (err) {
      result.success = false;
      result.error = err.message || err.toString();
      return result;
    }
  }

  // ------------------------------------------------------------------------
  // PUBLIC ENDPOINTS
  // ------------------------------------------------------------------------

  async getPublicData() {
    const filterDemo = this.isFilterDemoData();

    // Coba ambil dari Google Apps Script jika online mode aktif
    if (this.isOnlineMode()) {
      try {
        const url = `${this.getAppsScriptUrl()}?action=getPublicData&_t=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        if (json && json.success && json.data) {
          const rawDonasi = json.data.transparansiDonasi || [];
          const rawPengeluaran = json.data.transparansiPengeluaran || [];

          // Terapkan filter demo jika mode tanpa dummy aktif
          const verifiedDonations = filterDemo
            ? rawDonasi.filter(d => !this.isDemoRecord(d))
            : rawDonasi;

          const listPengeluaran = filterDemo
            ? rawPengeluaran.filter(p => !this.isDemoRecord(p))
            : rawPengeluaran;

          let totalTerkumpul = 0;
          verifiedDonations.forEach(d => {
            totalTerkumpul += (Number(d.nominal) || 0);
          });

          let totalPengeluaran = 0;
          listPengeluaran.forEach(p => {
            totalPengeluaran += (Number(p.nominal) || 0);
          });

          const totalDonatur = verifiedDonations.length;
          const targetDonasi = Number(json.data.stats?.targetDonasi) || Number(json.data.settings?.target_donasi) || 250000000;
          const sisaTarget = Math.max(0, targetDonasi - totalTerkumpul);
          const saldoKas = totalTerkumpul - totalPengeluaran;
          const persentase = Math.min(100, Math.round((totalTerkumpul / targetDonasi) * 100));

          return {
            stats: {
              targetDonasi,
              totalTerkumpul,
              sisaTarget,
              persentase,
              totalDonatur,
              totalPengeluaran,
              saldoKas
            },
            settings: json.data.settings || this.getDb().settings,
            transparansiDonasi: verifiedDonations.slice(0, 50),
            transparansiPengeluaran: listPengeluaran.slice(0, 50)
          };
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

    const rawDonasi = db.donasi_masuk || [];
    const filteredDonasi = filterDemo ? rawDonasi.filter(d => !this.isDemoRecord(d)) : rawDonasi;

    filteredDonasi.forEach(d => {
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
    const rawPengeluaran = db.pengeluaran || [];
    const filteredPengeluaran = filterDemo ? rawPengeluaran.filter(p => !this.isDemoRecord(p)) : rawPengeluaran;

    filteredPengeluaran.forEach(p => {
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

    const targetDonasi = Number(db.settings?.target_donasi) || 250000000;
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
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
      bukti_transfer: formData.bukti_base64 || "assets/logo.png",
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
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
    const uClean = String(username || '').trim().toLowerCase();
    const pClean = String(password || '').trim();

    // 1. Verifikasi langsung Akun Super Admin Resmi (ambulanmaisya & adminambulanmaisya)
    const validSuperAdmins = ['ambulanmaisya', 'adminambulanmaisya', 'admin'];
    const validSuperPasswords = ['ambulan991588', 'admin123'];

    if (validSuperAdmins.includes(uClean) && validSuperPasswords.includes(pClean)) {
      const db = this.getDb();
      db.users = INITIAL_DATABASE.users;
      db.audit_log.unshift({
        id: "AUD-" + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: uClean,
        action: "LOGIN",
        detail: `Login berhasil sebagai Super Admin (${uClean})`
      });
      this.saveDb(db);

      const token = 'MAISYA-TOKEN-' + Date.now();
      const userData = {
        id: uClean === 'adminambulanmaisya' ? 'USR-002' : 'USR-001',
        username: uClean,
        nama: 'Super Admin Ambulan Maisya',
        role: 'superadmin',
        no_hp: '081291542134'
      };

      // Simpan session agar langsung aktif dan dapat diakses portal
      sessionStorage.setItem('maisya_admin_token', token);
      sessionStorage.setItem('maisya_admin_user', JSON.stringify(userData));

      // Asynchronous notification to Apps Script jika online (non-blocking, abaikan jika CORS/offline)
      if (this.isOnlineMode()) {
        try {
          fetch(this.getAppsScriptUrl(), {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'loginAdmin', username: uClean, password: pClean })
          }).catch(() => {});
        } catch (_) {}
      }

      return { success: true, token, user: userData };
    }

    // 2. Jika online, coba autentikasi ke Google Apps Script
    if (this.isOnlineMode()) {
      try {
        const res = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'loginAdmin', username: uClean, password: pClean })
        });
        const json = await res.json();
        if (json && json.success) {
          if (json.token) sessionStorage.setItem('maisya_admin_token', json.token);
          if (json.user) sessionStorage.setItem('maisya_admin_user', JSON.stringify(json.user));
          return json;
        }
      } catch (e) {
        console.warn('Apps script login network error, fallback ke database lokal:', e);
      }
    }

    // 3. Fallback pencocokan database lokal
    const db = this.getDb();
    const user = (db.users || []).find(u =>
      String(u.username || '').toLowerCase() === uClean &&
      String(u.password || '') === pClean
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

      sessionStorage.setItem('maisya_admin_token', token);
      sessionStorage.setItem('maisya_admin_user', JSON.stringify(userData));

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
    const filterDemo = this.isFilterDemoData();

    if (this.isOnlineMode()) {
      try {
        const token = sessionStorage.getItem('maisya_admin_token') || 'MAISYA-TOKEN-DEFAULT';
        const url = `${this.getAppsScriptUrl()}?action=getAdminData&token=${token}&_t=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
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

          // Terapkan filter demo jika mode tanpa dummy aktif
          const rawDonasi = json.data.donasi || [];
          const rawPengeluaran = json.data.pengeluaran || [];
          const rawDonatur = json.data.donatur || [];
          const rawLayanan = json.data.layananAmbulan || [];

          const cleanDonasi = filterDemo ? rawDonasi.filter(d => !this.isDemoRecord(d)) : rawDonasi;
          const cleanPengeluaran = filterDemo ? rawPengeluaran.filter(p => !this.isDemoRecord(p)) : rawPengeluaran;
          const cleanDonatur = filterDemo ? rawDonatur.filter(d => !this.isDemoRecord(d)) : rawDonatur;
          const cleanLayanan = filterDemo ? rawLayanan.filter(a => !this.isDemoRecord(a)) : rawLayanan;

          let totalMasukVerified = 0;
          let totalPending = 0;
          let countPending = 0;
          let countVerified = 0;
          let countRejected = 0;

          cleanDonasi.forEach(d => {
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
          cleanPengeluaran.forEach(p => {
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
              totalDonatur: cleanDonatur.length,
              totalLayanan: cleanLayanan.length
            },
            donasi: cleanDonasi,
            pengeluaran: cleanPengeluaran,
            donatur: cleanDonatur,
            users: json.data.users || [],
            auditLog: json.data.auditLog || [],
            layananAmbulan: cleanLayanan,
            settings: json.data.settings || this.getDb().settings
          };
        }
      } catch (e) {
        console.warn('Apps script getAdminData failed:', e);
      }
    }

    // Fallback Local Storage
    const db = this.getDb();
    const rawDonasi = db.donasi_masuk || [];
    const rawPengeluaran = db.pengeluaran || [];
    const rawDonatur = db.donatur || [];
    const rawLayanan = db.layanan_ambulan || [];

    const cleanDonasi = filterDemo ? rawDonasi.filter(d => !this.isDemoRecord(d)) : rawDonasi;
    const cleanPengeluaran = filterDemo ? rawPengeluaran.filter(p => !this.isDemoRecord(p)) : rawPengeluaran;
    const cleanDonatur = filterDemo ? rawDonatur.filter(d => !this.isDemoRecord(d)) : rawDonatur;
    const cleanLayanan = filterDemo ? rawLayanan.filter(a => !this.isDemoRecord(a)) : rawLayanan;

    let totalMasukVerified = 0;
    let totalPending = 0;
    let countPending = 0;
    let countVerified = 0;
    let countRejected = 0;

    cleanDonasi.forEach(d => {
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
    cleanPengeluaran.forEach(p => {
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
        totalDonatur: cleanDonatur.length,
        totalLayanan: cleanLayanan.length
      },
      donasi: cleanDonasi,
      pengeluaran: cleanPengeluaran,
      donatur: cleanDonatur,
      users: (db.users || []).map(u => ({ ...u, password: '***' })),
      auditLog: db.audit_log || [],
      layananAmbulan: cleanLayanan,
      settings: db.settings
    };
  }

  async verifyDonasi(id, status, adminName, alasan = '') {
    if (this.isOnlineMode()) {
      try {
        const res = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const newExpense = {
      id: id,
      tanggal: expenseData.tanggal || now.toISOString().substring(0, 10),
      kategori: expenseData.kategori,
      deskripsi: expenseData.deskripsi,
      nominal: Number(expenseData.nominal) || 0,
      pic: adminName || expenseData.pic || "Admin",
      bukti_nota: expenseData.bukti_nota || "assets/logo.png"
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
      detail: 'Pengaturan sistem, rekening bank, & kontak darurat diperbarui'
    });
    this.saveDb(db);

    let gasSynced = false;
    if (this.isOnlineMode()) {
      try {
        // Coba via POST
        const resPost = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'updateSettings', settings: newSettings })
        });
        const jsonPost = await resPost.json();
        if (jsonPost && jsonPost.success) {
          gasSynced = true;
        }
      } catch (errPost) {
        console.warn('Apps Script updateSettings POST failed, mencoba via GET parameter:', errPost);
      }

      // Jika POST belum sukses, coba via GET parameter
      if (!gasSynced) {
        try {
          const getUrl = `${this.getAppsScriptUrl()}?action=updateSettings&payload=${encodeURIComponent(JSON.stringify(newSettings))}&_t=${Date.now()}`;
          const resGet = await fetch(getUrl, { cache: 'no-store' });
          const jsonGet = await resGet.json();
          if (jsonGet && jsonGet.success) {
            gasSynced = true;
          }
        } catch (errGet) {
          console.warn('Apps Script updateSettings GET failed:', errGet);
        }
      }
    }

    return {
      success: true,
      gasSynced: gasSynced,
      message: gasSynced
        ? 'Pengaturan rekening dan sistem berhasil disinkronkan ke Google Spreadsheet!'
        : 'Pengaturan berhasil diperbarui dan disimpan di database lokal!'
    };
  }

  async clearDemoData() {
    let gasSynced = false;
    if (this.isOnlineMode()) {
      // 1. Panggil endpoint clearDemoData di Google Apps Script (POST & GET)
      try {
        const postRes = await fetch(this.getAppsScriptUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'clearDemoData' })
        });
        const postJson = await postRes.json();
        if (postJson && postJson.success) gasSynced = true;
      } catch (e) {
        console.warn("Apps Script clearDemoData POST:", e);
      }

      if (!gasSynced) {
        try {
          const getRes = await fetch(`${this.getAppsScriptUrl()}?action=clearDemoData&_t=${Date.now()}`, { cache: 'no-store' });
          const getJson = await getRes.json();
          if (getJson && getJson.success) gasSynced = true;
        } catch (e) {
          console.warn("Apps Script clearDemoData GET:", e);
        }
      }
    }

    // 2. Bersihkan local storage
    const db = this.getDb();
    db.donatur = [];
    db.donasi_masuk = [];
    db.pengeluaran = [];
    db.layanan_ambulan = [];
    db.users = [
      { id: "USR-001", username: "adminambulanmaisya", password: "ambulan991588", nama: "Super Admin Ambulan Maisya", role: "superadmin", no_hp: "081291542134", status: "aktif" }
    ];
    db.audit_log = [
      { id: "AUD-001", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: "adminambulanmaisya", action: "CLEAN_DATABASE", detail: "Seluruh data demo dibersihkan, akun admin: adminambulanmaisya aktif" }
    ];
    this.saveDb(db);

    // Pastikan filter demo tetap aktif
    this.setFilterDemoData(true);

    return {
      success: true,
      gasSynced: gasSynced,
      message: gasSynced
        ? "Seluruh data demo berhasil dibersihkan dari Google Spreadsheet dan sistem lokal!"
        : "Seluruh data demo lokal telah dibersihkan secara tuntas. Mode produksi bersih aktif."
    };
  }

  resetToDefault() {
    localStorage.setItem(ApiConfig.LOCAL_DB_KEY, JSON.stringify(INITIAL_DATABASE));
  }
}

// Export singleton instance
window.ambulanApi = new AmbulanApi();
