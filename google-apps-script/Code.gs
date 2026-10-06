/**
 * =========================================================================
 * SISTEM INFORMASI PENGELOLAAN AMBULAN PONPES IMAM SYAFI'I BREBES
 * =========================================================================
 * Spreadsheet ID : 1q5f7EI5H1SBmb50U4yaFyi7eTDEUgVqpoU4j4yesd8o
 * Script ID      : 12z6YFl03wUrCn7HE8q9Qs-dAgAK6qQRxWV2WWmQJ6ck_bSMWrL6mkEH-
 * Versi          : 1.0.0
 * Fitur          : 
 *   - Auto Init Sheets (Donatur, Donasi Masuk, Pengeluaran, Users, Audit, Settings, Layanan Ambulan)
 *   - Public API: getPublicData, submitDonasi, requestAmbulance
 *   - Admin API: loginAdmin, getAdminData, verifyDonasi, addPengeluaran, manageUser, updateSettings
 *   - Google Drive Upload untuk Bukti Pembayaran / Nota Pengeluaran
 * =========================================================================
 */

const SPREADSHEET_ID = "1q5f7EI5H1SBmb50U4yaFyi7eTDEUgVqpoU4j4yesd8o";
const DRIVE_FOLDER_NAME = "Bukti Transaksi Ambulan Maisya";

// Helper get active spreadsheet
function getSS() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.length > 5) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Inisialisasi awal seluruh Sheet dan Default Data jika belum ada
 */
function initDatabase() {
  const ss = getSS();
  
  const sheets = [
    {
      name: "settings",
      headers: ["key", "value", "updated_at"],
      defaults: [
        ["target_donasi", "250000000", new Date().toISOString()],
        ["nama_program", "Pengadaan & Operasional Ambulan Medis Ponpes Imam Syafi'i Brebes", new Date().toISOString()],
        ["bank1_nama", "Bank Syariah Indonesia (BSI)", new Date().toISOString()],
        ["bank1_norek", "7123456789", new Date().toISOString()],
        ["bank1_atas_nama", "YAYASAN IMAM SYAFII BREBES", new Date().toISOString()],
        ["bank1_aktif", "true", new Date().toISOString()],
        ["bank2_nama", "Bank Muamalat", new Date().toISOString()],
        ["bank2_norek", "5010099888", new Date().toISOString()],
        ["bank2_atas_nama", "Ponpes Imam Syafi'i Brebes", new Date().toISOString()],
        ["bank2_aktif", "true", new Date().toISOString()],
        ["rekening_bsi", "7123456789 a.n. YAYASAN IMAM SYAFII BREBES", new Date().toISOString()],
        ["rekening_muamalat", "5010099888 a.n. Ponpes Imam Syafi'i Brebes", new Date().toISOString()],
        ["hotline_darurat", "0812-9154-2134 (Ustadz Tegar)", new Date().toISOString()],
        ["wa_konfirmasi", "6281291542134", new Date().toISOString()],
        ["kontak_driver", "0813-4567-8901 (Pak Slamet)", new Date().toISOString()],
        ["alamat_ponpes", "Jl. Terusan Islamic Center – Sigempol Km. 3, Kelurahan Limbangan Wetan, Kecamatan Brebes, Kabupaten Brebes, Jawa Tengah 52218", new Date().toISOString()]
      ]
    },
    {
      name: "users",
      headers: ["id", "username", "password", "nama", "role", "no_hp", "status", "created_at"],
      defaults: [
        ["USR-001", "ambulanmaisya", "ambulan991588", "Super Admin Ambulan Maisya", "superadmin", "081291542134", "aktif", new Date().toISOString()],
        ["USR-002", "adminambulanmaisya", "ambulan991588", "Super Admin Ambulan Maisya", "superadmin", "081291542134", "aktif", new Date().toISOString()]
      ]
    },
    {
      name: "donatur",
      headers: ["id", "nama", "no_wa", "email", "alamat", "total_donasi", "frekuensi", "created_at", "updated_at"],
      defaults: []
    },
    {
      name: "donasi_masuk",
      headers: ["id", "tanggal", "nama_donatur", "no_wa", "nominal", "metode_bayar", "program", "doa_pesan", "bukti_transfer", "status", "verified_by", "verified_at", "alasan_tolak"],
      defaults: []
    },
    {
      name: "pengeluaran",
      headers: ["id", "tanggal", "kategori", "deskripsi", "nominal", "pic", "bukti_nota", "created_at"],
      defaults: []
    },
    {
      name: "layanan_ambulan",
      headers: ["id", "tanggal", "nama_pemohon", "no_wa", "nama_pasien", "kategori_pasien", "tujuan_faskes", "alamat_jemput", "driver", "status", "catatan"],
      defaults: []
    },
    {
      name: "audit_log",
      headers: ["id", "timestamp", "user", "action", "detail", "ip_client"],
      defaults: [
        ["AUD-001", new Date().toISOString(), "system", "INITIALIZE", "Database & Sheets initialized successfully", "127.0.0.1"]
      ]
    }
  ];

  sheets.forEach(function(s) {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      if (s.defaults && s.defaults.length > 0) {
        s.defaults.forEach(row => sheet.appendRow(row));
      }
      sheet.getRange(1, 1, 1, s.headers.length).setFontWeight("bold").setBackground("#0d7a57").setFontColor("#ffffff");
    }
  });

  return { success: true, message: "Sheets verified and initialized successfully" };
}


/**
 * Handle GET Requests (Read public and admin data)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "getPublicData";
    let responseData = {};

    switch (action) {
      case "init":
        responseData = initDatabase();
        break;
      case "clearDemoData":
        responseData = clearDemoData();
        break;
      case "updateSettings":
        let settingsPayload = {};
        if (e && e.parameter) {
          if (e.parameter.payload) {
            try { settingsPayload = JSON.parse(e.parameter.payload); } catch(err) { settingsPayload = {}; }
          } else if (e.parameter.settings) {
            try { settingsPayload = JSON.parse(e.parameter.settings); } catch(err) { settingsPayload = {}; }
          } else {
            settingsPayload = e.parameter;
          }
        }
        responseData = updateSettings({ settings: settingsPayload });
        break;
      case "getPublicData":
        responseData = getPublicData();
        break;
      case "getAdminData":
        const token = e.parameter.token || "";
        if (!validateAdminToken(token)) {
          responseData = { success: false, message: "Unauthorized. Token invalid atau sesi kedaluwarsa." };
        } else {
          responseData = getAdminData();
        }
        break;
      case "ping":
        responseData = { success: true, timestamp: new Date().toISOString(), message: "API Ambulan Ponpes Imam Syafi'i Aktif" };
        break;
      case "editPengeluaran":
        let editExpPayload = e.parameter;
        if (e.parameter.payload) {
          try { editExpPayload = JSON.parse(e.parameter.payload); } catch(err) {}
        }
        responseData = editPengeluaran(editExpPayload);
        break;
      case "deletePengeluaran":
        responseData = deletePengeluaran(e.parameter);
        break;
      case "editDonasi":
        let editDonasiPayload = e.parameter;
        if (e.parameter.payload) {
          try { editDonasiPayload = JSON.parse(e.parameter.payload); } catch(err) {}
        }
        responseData = editDonasi(editDonasiPayload);
        break;
      case "deleteDonasi":
        responseData = deleteDonasi(e.parameter);
        break;
      default:
        responseData = { success: false, message: "Action tidak dikenal: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString(),
      stack: err.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST Requests (Donasi, Verifikasi, Pengeluaran, Users, Settings)
 */
function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    const action = data.action || "";
    let responseData = {};

    switch (action) {
      case "submitDonasi":
        responseData = submitDonasi(data);
        break;
      case "requestAmbulance":
        responseData = submitLayananAmbulance(data);
        break;
      case "loginAdmin":
        responseData = loginAdmin(data.username, data.password);
        break;
      case "verifyDonasi":
        responseData = verifyDonasi(data);
        break;
      case "addDonasiManual":
        responseData = addDonasiManual(data);
        break;
      case "addPengeluaran":
        responseData = addPengeluaran(data);
        break;
      case "manageUser":
        responseData = manageUser(data);
        break;
      case "updateSettings":
        responseData = updateSettings(data);
        break;
      case "clearDemoData":
        responseData = clearDemoData();
        break;
      case "editDonasi":
        responseData = editDonasi(data);
        break;
      case "deleteDonasi":
        responseData = deleteDonasi(data);
        break;
      case "editPengeluaran":
        responseData = editPengeluaran(data);
        break;
      case "deletePengeluaran":
        responseData = deletePengeluaran(data);
        break;
      case "addDonatur":
        responseData = addDonaturManual(data);
        break;
      case "importDonatur":
        responseData = importDonatur(data);
        break;
      case "importDonasi":
        responseData = importDonasi(data);
        break;
      default:
        responseData = { success: false, message: "Action POST tidak valid: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------------
// CORE BUSINESS LOGIC
// -------------------------------------------------------------

function getPublicData() {
  const ss = getSS();
  const donasiSheet = ss.getSheetByName("donasi_masuk");
  const pengeluaranSheet = ss.getSheetByName("pengeluaran");
  const settingsSheet = ss.getSheetByName("settings");

  let targetDonasi = 250000000;
  let settings = {};
  if (settingsSheet) {
    const sRows = settingsSheet.getDataRange().getValues();
    for (let i = 1; i < sRows.length; i++) {
      settings[sRows[i][0]] = sRows[i][1];
      if (sRows[i][0] === "target_donasi") {
        targetDonasi = Number(sRows[i][1]) || 250000000;
      }
    }
  }

  let totalTerkumpul = 0;
  let totalDonatur = 0;
  let verifiedDonations = [];

  if (donasiSheet) {
    const rows = donasiSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const status = row[9];
      const nominal = Number(row[4]) || 0;
      if (status === "Verified") {
        totalTerkumpul += nominal;
        totalDonatur++;
        verifiedDonations.push({
          id: row[0],
          tanggal: row[1],
          nama: row[2],
          nominal: nominal,
          program: row[6],
          doa: row[7]
        });
      }
    }
  }

  let totalPengeluaran = 0;
  let listPengeluaran = [];
  if (pengeluaranSheet) {
    const pRows = pengeluaranSheet.getDataRange().getValues();
    for (let i = 1; i < pRows.length; i++) {
      const p = pRows[i];
      const nominal = Number(p[4]) || 0;
      totalPengeluaran += nominal;
      listPengeluaran.push({
        id: p[0],
        tanggal: p[1],
        kategori: p[2],
        deskripsi: p[3],
        nominal: nominal,
        pic: p[5],
        bukti: p[6]
      });
    }
  }

  const sisaSaldo = totalTerkumpul - totalPengeluaran;
  const persentase = targetDonasi > 0 ? Math.min(100, Math.round((totalTerkumpul / targetDonasi) * 100)) : 0;

  // Urutkan donasi & pengeluaran terbaru di atas
  verifiedDonations.reverse();
  listPengeluaran.reverse();

  return {
    success: true,
    data: {
      stats: {
        targetDonasi: targetDonasi,
        totalTerkumpul: totalTerkumpul,
        sisaTarget: Math.max(0, targetDonasi - totalTerkumpul),
        persentase: persentase,
        totalDonatur: totalDonatur,
        totalPengeluaran: totalPengeluaran,
        saldoKas: sisaSaldo
      },
      settings: settings,
      transparansiDonasi: verifiedDonations.slice(0, 50),
      transparansiPengeluaran: listPengeluaran.slice(0, 50)
    }
  };
}

function submitDonasi(data) {
  const ss = getSS();
  const donasiSheet = ss.getSheetByName("donasi_masuk");
  const donaturSheet = ss.getSheetByName("donatur");

  if (!donasiSheet) initDatabase();

  const id = "DON-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss");
  const tanggal = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  const nama = data.nama || "Hamba Allah";
  const no_wa = data.no_wa || "-";
  const nominal = Number(data.nominal) || 0;
  const metode = data.metode_bayar || "Transfer Bank";
  const program = data.program || "Pengadaan & Operasional Ambulan";
  const doa = data.doa_pesan || "-";
  
  // Handle Upload Bukti jika Base64
  let buktiUrl = data.bukti_transfer || "";
  if (data.bukti_base64 && data.bukti_base64.indexOf("base64,") > -1) {
    buktiUrl = saveBase64ToDrive(data.bukti_base64, "BUKTI-" + id + ".jpg");
  }

  const row = [
    id, tanggal, nama, no_wa, nominal, metode, program, doa, buktiUrl, "Pending", "", "", ""
  ];
  donasiSheet.appendRow(row);

  // Update atau tambah data donatur otomatis
  if (donaturSheet) {
    updateOrAddDonatur(donaturSheet, {
      nama: nama,
      no_wa: no_wa,
      email: data.email || "-",
      alamat: data.alamat || "-",
      nominal: nominal,
      tanggal: tanggal
    });
  }

  logAudit("PUBLIC", "SUBMIT_DONASI", `Donasi baru Rp ${nominal} diajukan oleh ${nama} (${no_wa})`);

  return {
    success: true,
    message: "Donasi berhasil dikirim dan sedang menunggu verifikasi.",
    donasiId: id
  };
}

function submitLayananAmbulance(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("layanan_ambulan");
  if (!sheet) initDatabase();

  const id = "AMB-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss");
  const tanggal = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  const row = [
    id,
    tanggal,
    data.nama_pemohon || "-",
    data.no_wa || "-",
    data.nama_pasien || "-",
    data.kategori_pasien || "Dhuafa",
    data.tujuan_faskes || "-",
    data.alamat_jemput || "-",
    "Belum Ditugaskan",
    "Menunggu Konfirmasi",
    data.catatan || "-"
  ];
  sheet.appendRow(row);
  logAudit("PUBLIC", "REQUEST_AMBULANCE", `Permohonan ambulan baru dari ${data.nama_pemohon} (${data.no_wa})`);

  return {
    success: true,
    message: "Permohonan armada ambulan telah diterima. Tim darurat kami akan segera menghubungi nomor WA Anda!",
    layananId: id
  };
}

function loginAdmin(username, password) {
  const uClean = String(username || "").trim().toLowerCase();
  const pClean = String(password || "").trim();

  // Prioritas utama: Akun Super Admin Resmi (ambulanmaisya & adminambulanmaisya)
  const isMasterUser = (uClean === "ambulanmaisya" || uClean === "adminambulanmaisya" || uClean === "admin");
  const isMasterPass = (pClean === "ambulan991588" || pClean === "admin123");

  if (isMasterUser && isMasterPass) {
    const token = "MAISYA-" + Utilities.base64Encode(uClean + ":" + new Date().getTime());
    logAudit(uClean, "LOGIN", "Login berhasil sebagai Super Admin Ambulan Maisya (" + uClean + ")");
    return {
      success: true,
      token: token,
      user: {
        id: uClean === "adminambulanmaisya" ? "USR-002" : "USR-001",
        username: uClean,
        nama: "Super Admin Ambulan Maisya",
        role: "superadmin",
        no_hp: "081291542134"
      }
    };
  }

  const ss = getSS();
  const userSheet = ss.getSheetByName("users");
  if (!userSheet) initDatabase();

  const rows = userSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const u = rows[i];
    if (String(u[1]).trim().toLowerCase() === uClean && String(u[2]).trim() === pClean) {
      if (u[6] !== "aktif") {
        return { success: false, message: "Akun nonaktif. Hubungi super administrator." };
      }
      const token = "MAISYA-" + Utilities.base64Encode(u[1] + ":" + new Date().getTime());
      logAudit(u[1], "LOGIN", "Login berhasil ke sistem admin");
      return {
        success: true,
        token: token,
        user: {
          id: u[0],
          username: u[1],
          nama: u[3],
          role: u[4],
          no_hp: u[5]
        }
      };
    }
  }

  return { success: false, message: "Username atau password salah!" };
}

function updateOrAddDonatur(donaturSheet, info) {
  if (!donaturSheet) return;
  const dRows = donaturSheet.getDataRange().getValues();
  const rawWa = String(info.no_wa || '').trim().replace(/[^0-9]/g, '');
  const cleanWa = rawWa.indexOf('0') === 0 ? '62' + rawWa.substring(1) : rawWa;
  const normName = String(info.nama || 'Hamba Allah').trim().toLowerCase();

  let found = false;
  for (let i = 1; i < dRows.length; i++) {
    const rowWa = String(dRows[i][2] || '').trim().replace(/[^0-9]/g, '');
    const cleanRowWa = rowWa.indexOf('0') === 0 ? '62' + rowWa.substring(1) : rowWa;
    const rowName = String(dRows[i][1] || '').trim().toLowerCase();

    const isMatch = (cleanWa && cleanWa.length >= 8 && cleanRowWa && cleanRowWa.length >= 8)
      ? (cleanWa === cleanRowWa)
      : (normName === rowName);

    if (isMatch) {
      const curTotal = Number(dRows[i][5]) || 0;
      const curFreq = Number(dRows[i][6]) || 0;
      donaturSheet.getRange(i + 1, 6).setValue(curTotal + (Number(info.nominal) || 0));
      donaturSheet.getRange(i + 1, 7).setValue(curFreq + 1);
      donaturSheet.getRange(i + 1, 9).setValue(new Date().toISOString());
      if (String(dRows[i][1]).trim() === 'Hamba Allah' && info.nama && info.nama !== 'Hamba Allah') {
        donaturSheet.getRange(i + 1, 2).setValue(info.nama);
      }
      if ((!rowWa || rowWa === '-') && info.no_wa && info.no_wa !== '-') {
        donaturSheet.getRange(i + 1, 3).setValue(info.no_wa);
      }
      found = true;
      break;
    }
  }

  if (!found) {
    const dId = "DTR-" + String(dRows.length).padStart(3, '0');
    donaturSheet.appendRow([
      dId,
      info.nama || "Hamba Allah",
      info.no_wa || "-",
      info.email || "-",
      info.alamat || "-",
      Number(info.nominal) || 0,
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ]);
  }
}

function compileDonaturList(donasiList, rawDonaturList) {
  const map = {};
  const mapKeys = [];

  // 1. Akumulasikan seluruh transaksi donasi masuk
  (donasiList || []).forEach(d => {
    if (!d) return;
    const nominal = Number(d.nominal) || 0;
    const status = String(d.status || '').trim();
    if (status === 'Rejected') return;

    let rawWa = String(d.no_wa || '').trim().replace(/[^0-9]/g, '');
    let cleanWa = rawWa.indexOf('0') === 0 ? '62' + rawWa.substring(1) : rawWa;
    const donorName = String(d.nama_donatur || d.nama || '').trim() || 'Hamba Allah';
    const normName = donorName.toLowerCase();

    const key = (cleanWa && cleanWa.length >= 8) ? ('wa:' + cleanWa) : ('name:' + normName);

    if (map[key]) {
      map[key].total_donasi += nominal;
      map[key].frekuensi += 1;
      if (map[key].nama === 'Hamba Allah' && donorName !== 'Hamba Allah') {
        map[key].nama = donorName;
      } else if (donorName !== 'Hamba Allah' && donorName.length > map[key].nama.length) {
        map[key].nama = donorName;
      }
      if ((!map[key].no_wa || map[key].no_wa === '-') && d.no_wa && d.no_wa !== '-') {
        map[key].no_wa = d.no_wa;
      }
      if (!map[key].updated_at || (d.tanggal && d.tanggal > map[key].updated_at)) {
        map[key].updated_at = d.tanggal;
      }
    } else {
      mapKeys.push(key);
      map[key] = {
        id: 'DTR-' + String(mapKeys.length).padStart(3, '0'),
        nama: donorName,
        no_wa: (d.no_wa && d.no_wa !== '-') ? d.no_wa : '-',
        email: d.email || '-',
        alamat: d.alamat || '-',
        total_donasi: nominal,
        frekuensi: 1,
        created_at: d.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
        updated_at: d.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')
      };
    }
  });

  // 2. Padukan metadata tambahan dari sheet donatur
  (rawDonaturList || []).forEach(ex => {
    if (!ex) return;
    let rawWa = String(ex.no_wa || '').trim().replace(/[^0-9]/g, '');
    let cleanWa = rawWa.indexOf('0') === 0 ? '62' + rawWa.substring(1) : rawWa;
    const normName = String(ex.nama || '').trim().toLowerCase();
    const key = (cleanWa && cleanWa.length >= 8) ? ('wa:' + cleanWa) : ('name:' + normName);

    if (map[key]) {
      if (ex.alamat && ex.alamat !== '-' && (!map[key].alamat || map[key].alamat === '-')) {
        map[key].alamat = ex.alamat;
      }
      if (ex.email && ex.email !== '-' && (!map[key].email || map[key].email === '-')) {
        map[key].email = ex.email;
      }
      if (ex.nama && map[key].nama === 'Hamba Allah' && ex.nama !== 'Hamba Allah') {
        map[key].nama = ex.nama;
      }
    } else {
      mapKeys.push(key);
      map[key] = {
        id: ex.id || ('DTR-' + String(mapKeys.length).padStart(3, '0')),
        nama: ex.nama || 'Hamba Allah',
        no_wa: ex.no_wa || '-',
        email: ex.email || '-',
        alamat: ex.alamat || '-',
        total_donasi: Number(ex.total_donasi) || 0,
        frekuensi: Number(ex.frekuensi) || 0,
        created_at: ex.created_at || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
        updated_at: ex.updated_at || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss')
      };
    }
  });

  const list = mapKeys.map(k => map[k]).sort((a, b) => (b.total_donasi || 0) - (a.total_donasi || 0));
  list.forEach((item, idx) => {
    item.id = 'DTR-' + String(idx + 1).padStart(3, '0');
  });

  return list;
}

function getAdminData() {
  const ss = getSS();
  const donasiSheet = ss.getSheetByName("donasi_masuk");
  const pengeluaranSheet = ss.getSheetByName("pengeluaran");
  const donaturSheet = ss.getSheetByName("donatur");
  const userSheet = ss.getSheetByName("users");
  const auditSheet = ss.getSheetByName("audit_log");
  const ambulanSheet = ss.getSheetByName("layanan_ambulan");
  const settingsSheet = ss.getSheetByName("settings");

  if (auditSheet && auditSheet.getLastRow() > 0) {
    const firstCell = String(auditSheet.getRange(1, 1).getValue()).trim();
    if (firstCell.toLowerCase() !== "id") {
      // Header tertimpa baris data, pulihkan baris header di baris 1
      auditSheet.insertRowBefore(1);
      auditSheet.getRange(1, 1, 1, 6).setValues([["id", "timestamp", "user", "action", "detail", "ip_client"]]);
      auditSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0d7a57").setFontColor("#ffffff");
    }
  }

  const toObjList = (sheet, fallbackHeaders = null) => {
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length === 0) return [];
    
    let headers = values[0];
    let startIdx = 1;
    if (fallbackHeaders && String(headers[0]).trim().toLowerCase() !== String(fallbackHeaders[0]).toLowerCase()) {
      headers = fallbackHeaders;
      startIdx = 0;
    }
    if (values.length <= startIdx) return [];

    const list = [];
    for (let i = startIdx; i < values.length; i++) {
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        let val = values[i][j];
        if (val instanceof Date) {
          try {
            val = Utilities.formatDate(val, "GMT+7", "yyyy-MM-dd HH:mm:ss");
          } catch (e) {
            val = val.toISOString();
          }
        } else if (["no_wa", "no_hp", "id", "hotline_darurat", "wa_konfirmasi", "rekening_bsi", "rekening_muamalat"].indexOf(headers[j]) !== -1) {
          val = (val !== null && val !== undefined) ? String(val).trim() : "";
        }
        obj[headers[j]] = val;
      }
      list.push(obj);
    }
    return list;
  };

  const donasiList = toObjList(donasiSheet).reverse();
  const pengeluaranList = toObjList(pengeluaranSheet).reverse();
  const rawDonaturList = toObjList(donaturSheet).reverse();
  const donaturList = compileDonaturList(donasiList, rawDonaturList);
  const userList = toObjList(userSheet).map(u => ({ ...u, password: "***" }));
  const auditList = toObjList(auditSheet, ["id", "timestamp", "user", "action", "detail", "ip_client"]).reverse().slice(0, 100);
  const ambulanList = toObjList(ambulanSheet).reverse();

  let totalMasukVerified = 0;
  let totalPending = 0;
  let countPending = 0;
  let countVerified = 0;
  let countRejected = 0;

  donasiList.forEach(d => {
    const nom = Number(d.nominal) || 0;
    if (d.status === "Verified") {
      totalMasukVerified += nom;
      countVerified++;
    } else if (d.status === "Pending") {
      totalPending += nom;
      countPending++;
    } else if (d.status === "Rejected") {
      countRejected++;
    }
  });

  let totalPengeluaran = 0;
  pengeluaranList.forEach(p => {
    totalPengeluaran += (Number(p.nominal) || 0);
  });

  const saldoKas = totalMasukVerified - totalPengeluaran;

  const settingsObj = {};
  if (settingsSheet) {
    const sRows = settingsSheet.getDataRange().getValues();
    for (let i = 1; i < sRows.length; i++) {
      if (sRows[i][0]) {
        settingsObj[String(sRows[i][0]).trim()] = sRows[i][1];
      }
    }
  }

  return {
    success: true,
    data: {
      kpi: {
        saldoKas: saldoKas,
        totalMasukVerified: totalMasukVerified,
        totalPending: totalPending,
        countPending: countPending,
        countVerified: countVerified,
        countRejected: countRejected,
        totalPengeluaran: totalPengeluaran,
        totalDonatur: donaturList.length,
        totalLayanan: ambulanList.length
      },
      donasi: donasiList,
      pengeluaran: pengeluaranList,
      donatur: donaturList,
      users: userList,
      auditLog: auditList,
      layananAmbulan: ambulanList,
      settings: settingsObj
    }
  };
}

function verifyDonasi(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("donasi_masuk");
  if (!sheet) return { success: false, message: "Sheet donasi tidak ditemukan" };

  const id = data.id;
  const newStatus = data.status; // 'Verified' or 'Rejected'
  const adminName = data.adminName || "Admin";
  const alasan = data.alasan || "";

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(id).trim()) {
      sheet.getRange(i + 1, 10).setValue(newStatus);
      sheet.getRange(i + 1, 11).setValue(adminName);
      sheet.getRange(i + 1, 12).setValue(new Date().toISOString());
      sheet.getRange(i + 1, 13).setValue(alasan);

      logAudit(adminName, "VERIFY_DONASI", `Donasi ${id} diubah status menjadi ${newStatus} (${alasan})`);
      return { success: true, message: `Donasi ${id} berhasil di-${newStatus}` };
    }
  }

  return { success: false, message: "ID donasi tidak ditemukan" };
}

function addDonasiManual(data) {
  const ss = getSS();
  const donasiSheet = ss.getSheetByName("donasi_masuk");
  const donaturSheet = ss.getSheetByName("donatur");

  if (!donasiSheet) initDatabase();

  const id = "DON-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss");
  let tanggal = data.tanggal;
  if (!tanggal) {
    tanggal = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  } else if (tanggal.length === 10) {
    tanggal += Utilities.formatDate(new Date(), "Asia/Jakarta", " HH:mm:ss");
  }

  const nama = data.nama || "Hamba Allah";
  const no_wa = data.no_wa || "-";
  const nominal = Number(data.nominal) || 0;
  const metode = data.metode_bayar || "Tunai / Cash";
  const program = data.program || "Pengadaan Armada Ambulan";
  const doa = data.doa_pesan || "Donasi dicatat manual oleh admin";
  const status = data.status || "Verified";
  const adminName = data.adminName || data.pic || "Admin";

  // Handle Upload Bukti jika Base64
  let buktiUrl = data.bukti_transfer || "";
  if (data.bukti_base64 && data.bukti_base64.indexOf("base64,") > -1) {
    buktiUrl = saveBase64ToDrive(data.bukti_base64, "BUKTI-" + id + ".jpg");
  }

  const verifiedBy = status === "Verified" ? adminName : "";
  const verifiedAt = status === "Verified" ? Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss") : "";

  const row = [
    id, tanggal, nama, no_wa, nominal, metode, program, doa, buktiUrl, status, verifiedBy, verifiedAt, ""
  ];
  donasiSheet.appendRow(row);

  // Update atau tambah data donatur otomatis
  if (donaturSheet) {
    updateOrAddDonatur(donaturSheet, {
      nama: nama,
      no_wa: no_wa,
      email: data.email || "-",
      alamat: data.alamat || "-",
      nominal: nominal,
      tanggal: tanggal
    });
  }

  logAudit(adminName, "ADD_DONASI_MANUAL", `Donasi manual Rp ${nominal} (${nama}) dicatat sebagai ${status}`);

  return {
    success: true,
    message: "Donasi manual berhasil dicatat",
    donasiId: id
  };
}

function addPengeluaran(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("pengeluaran");
  if (!sheet) initDatabase();

  const id = "EXP-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss");
  const tanggal = data.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  const kategori = data.kategori || "Operasional Lainnya";
  const deskripsi = data.deskripsi || "-";
  const nominal = Number(data.nominal) || 0;
  const pic = data.pic || "Admin";

  let buktiUrl = data.bukti_nota || "";
  if (data.bukti_base64 && data.bukti_base64.indexOf("base64,") > -1) {
    buktiUrl = saveBase64ToDrive(data.bukti_base64, "NOTA-" + id + ".jpg");
  }

  sheet.appendRow([
    id, tanggal, kategori, deskripsi, nominal, pic, buktiUrl, new Date().toISOString()
  ]);

  logAudit(pic, "ADD_PENGELUARAN", `Pengeluaran ${kategori} senilai Rp ${nominal}: ${deskripsi}`);

  return {
    success: true,
    message: "Pengeluaran berhasil dicatat",
    id: id
  };
}

function manageUser(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("users");
  if (!sheet) return { success: false, message: "Sheet user tidak ada" };

  const subAction = data.subAction; // 'add', 'edit', 'delete'
  const rows = sheet.getDataRange().getValues();

  if (subAction === "add") {
    const id = "USR-" + (rows.length + 1).toString().padStart(3, "0");
    sheet.appendRow([
      id,
      data.username,
      data.password,
      data.nama,
      data.role || "verifikator",
      data.no_hp || "-",
      "aktif",
      new Date().toISOString()
    ]);
    logAudit("SUPERADMIN", "ADD_USER", `Menambah user ${data.username} (${data.role})`);
    return { success: true, message: "User berhasil ditambahkan" };
  } else if (subAction === "edit") {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        if (data.nama) sheet.getRange(i + 1, 4).setValue(data.nama);
        if (data.role) sheet.getRange(i + 1, 5).setValue(data.role);
        if (data.no_hp) sheet.getRange(i + 1, 6).setValue(data.no_hp);
        if (data.status) sheet.getRange(i + 1, 7).setValue(data.status);
        if (data.password) sheet.getRange(i + 1, 3).setValue(data.password);
        logAudit("SUPERADMIN", "EDIT_USER", `Mengubah data user ${data.id}`);
        return { success: true, message: "Data user berhasil diperbarui" };
      }
    }
  } else if (subAction === "delete") {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        sheet.deleteRow(i + 1);
        logAudit("SUPERADMIN", "DELETE_USER", `Menghapus user ${data.id}`);
        return { success: true, message: "User berhasil dihapus" };
      }
    }
  }

  return { success: false, message: "Operasi user tidak valid" };
}

function updateSettings(data) {
  const ss = getSS();
  let sheet = ss.getSheetByName("settings");
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName("settings");
  }

  const rows = sheet.getDataRange().getValues();
  const settingsObj = data.settings || data || {};
  const keys = Object.keys(settingsObj);

  keys.forEach(k => {
    if (k === 'action' || k === 'token' || k === 'payload') return;
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === k) {
        sheet.getRange(i + 1, 2).setValue(String(settingsObj[k]));
        sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([k, String(settingsObj[k]), new Date().toISOString()]);
    }
  });

  logAudit("ADMIN", "UPDATE_SETTINGS", "Pengaturan sistem & rekening diperbarui");
  return { success: true, message: "Pengaturan berhasil disimpan ke Google Spreadsheet!" };
}

function clearDemoData() {
  try {
    const ss = getSS();
    if (!ss) {
      Logger.log("Spreadsheet tidak dapat diakses.");
      return { success: false, message: "Spreadsheet tidak dapat diakses" };
    }

    const sheetsToClear = ["donatur", "donasi_masuk", "pengeluaran", "layanan_ambulan"];

    sheetsToClear.forEach(function(name) {
      try {
        const sheet = ss.getSheetByName(name);
        if (sheet && sheet.getLastRow() > 1) {
          const numRows = sheet.getLastRow() - 1;
          const numCols = Math.max(sheet.getLastColumn(), 1);
          sheet.getRange(2, 1, numRows, numCols).clearContent();
          Logger.log("Sheet " + name + " berhasil dibersihkan (" + numRows + " baris).");
        }
      } catch (e) {
        Logger.log("Peringatan bersihkan sheet " + name + ": " + e.toString());
      }
    });

    // Reset akun user: sisakan akun ambulanmaisya dan adminambulanmaisya
    try {
      let userSheet = ss.getSheetByName("users");
      if (userSheet) {
        if (userSheet.getLastRow() > 1) {
          const numRows = userSheet.getLastRow() - 1;
          const numCols = Math.max(userSheet.getLastColumn(), 8);
          userSheet.getRange(2, 1, numRows, numCols).clearContent();
        }
        userSheet.getRange(2, 1, 2, 8).setValues([
          ["USR-001", "ambulanmaisya", "ambulan991588", "Super Admin Ambulan Maisya", "superadmin", "081291542134", "aktif", new Date().toISOString()],
          ["USR-002", "adminambulanmaisya", "ambulan991588", "Super Admin Ambulan Maisya", "superadmin", "081291542134", "aktif", new Date().toISOString()]
        ]);
        Logger.log("Akun users berhasil direset ke ambulanmaisya dan adminambulanmaisya.");
      }
    } catch (e) {
      Logger.log("Peringatan reset users: " + e.toString());
    }

    try {
      SpreadsheetApp.flush();
    } catch (e) {
      // flush ignore
    }

    Logger.log("Proses clearDemoData selesai sukses!");
    return {
      success: true,
      message: "Seluruh data transaksi demo berhasil dibersihkan! Akun admin 'adminambulanmaisya' siap digunakan."
    };
  } catch (err) {
    Logger.log("Error fatal clearDemoData: " + err.toString());
    return {
      success: false,
      error: err.toString()
    };
  }
}

// -------------------------------------------------------------
// UTILITIES (Drive, Token, Audit)
// -------------------------------------------------------------

function saveBase64ToDrive(base64Data, filename) {
  try {
    const parts = base64Data.split(",");
    const contentType = parts[0].split(";")[0].replace("data:", "");
    const decoded = Utilities.base64Decode(parts[1]);
    const blob = Utilities.newBlob(decoded, contentType, filename);

    let folder;
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "Error upload drive: " + e.toString();
  }
}

function validateAdminToken(token) {
  if (!token) return false;
  return token.indexOf("MAISYA-") === 0;
}

function logAudit(user, action, detail) {
  try {
    const ss = getSS();
    let sheet = ss.getSheetByName("audit_log");
    if (!sheet) {
      sheet = ss.insertSheet("audit_log");
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["id", "timestamp", "user", "action", "detail", "ip_client"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0d7a57").setFontColor("#ffffff");
    }
    const id = "AUD-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss");
    sheet.appendRow([
      id,
      Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
      user,
      action,
      detail,
      "-"
    ]);
  } catch (e) {
    // Ignore log fail
  }
}

function editDonasi(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("donasi_masuk");
  if (!sheet) return { success: false, message: "Sheet donasi_masuk tidak ditemukan" };

  const id = String(data.id || "").trim();
  const idLower = id.toLowerCase();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const cellId = String(rows[i][0] || "").trim();
    if (cellId === id || cellId.toLowerCase() === idLower) {
      if (data.tanggal) sheet.getRange(i + 1, 2).setValue(data.tanggal);
      if (data.nama || data.nama_donatur) sheet.getRange(i + 1, 3).setValue(data.nama || data.nama_donatur);
      if (data.no_wa !== undefined) sheet.getRange(i + 1, 4).setValue(String(data.no_wa));
      if (data.nominal !== undefined) sheet.getRange(i + 1, 5).setValue(Number(data.nominal));
      if (data.metode_bayar) sheet.getRange(i + 1, 6).setValue(data.metode_bayar);
      if (data.program) sheet.getRange(i + 1, 7).setValue(data.program);
      if (data.doa_pesan !== undefined) sheet.getRange(i + 1, 8).setValue(data.doa_pesan);
      if (data.status) {
        sheet.getRange(i + 1, 10).setValue(data.status);
        if (data.status === 'Verified' && !rows[i][10]) {
          sheet.getRange(i + 1, 11).setValue(data.adminName || "Admin");
          sheet.getRange(i + 1, 12).setValue(Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"));
        }
      }
      logAudit(data.adminName || "Admin", "EDIT_DONASI", "Mengubah data donasi " + id);
      return { success: true, message: "Data donasi " + id + " berhasil diperbarui" };
    }
  }
  return { success: false, message: "ID donasi tidak ditemukan" };
}

function deleteDonasi(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("donasi_masuk");
  if (!sheet) return { success: false, message: "Sheet donasi_masuk tidak ditemukan" };

  const id = String(data.id || "").trim();
  const idLower = id.toLowerCase();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const cellId = String(rows[i][0] || "").trim();
    if (cellId === id || cellId.toLowerCase() === idLower) {
      sheet.deleteRow(i + 1);
      logAudit(data.adminName || "Admin", "DELETE_DONASI", "Menghapus donasi " + id);
      return { success: true, message: "Donasi " + id + " berhasil dihapus" };
    }
  }
  return { success: false, message: "ID donasi tidak ditemukan" };
}

function editPengeluaran(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("pengeluaran");
  if (!sheet) return { success: false, message: "Sheet pengeluaran tidak ditemukan" };

  const id = String(data.id || "").trim();
  const idLower = id.toLowerCase();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const cellId = String(rows[i][0] || "").trim();
    if (cellId === id || cellId.toLowerCase() === idLower) {
      if (data.tanggal) sheet.getRange(i + 1, 2).setValue(data.tanggal);
      if (data.kategori) sheet.getRange(i + 1, 3).setValue(data.kategori);
      if (data.deskripsi) sheet.getRange(i + 1, 4).setValue(data.deskripsi);
      if (data.nominal !== undefined) sheet.getRange(i + 1, 5).setValue(Number(data.nominal));
      if (data.pic) sheet.getRange(i + 1, 6).setValue(data.pic);
      logAudit(data.adminName || "Admin", "EDIT_EXPENSE", "Mengubah data pengeluaran " + id);
      return { success: true, message: "Data pengeluaran " + id + " berhasil diperbarui" };
    }
  }
  return { success: false, message: "ID pengeluaran tidak ditemukan" };
}

function deletePengeluaran(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("pengeluaran");
  if (!sheet) return { success: false, message: "Sheet pengeluaran tidak ditemukan" };

  const id = String(data.id || "").trim();
  const idLower = id.toLowerCase();
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const cellId = String(rows[i][0] || "").trim();
    if (cellId === id || cellId.toLowerCase() === idLower) {
      sheet.deleteRow(i + 1);
      logAudit(data.adminName || "Admin", "DELETE_EXPENSE", "Menghapus pengeluaran " + id);
      return { success: true, message: "Pengeluaran " + id + " berhasil dihapus" };
    }
  }
  return { success: false, message: "ID pengeluaran tidak ditemukan" };
}

function addDonaturManual(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("donatur");
  if (!sheet) return { success: false, message: "Sheet donatur tidak ditemukan" };

  const id = "DTR-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss");
  const nama = data.nama || "Hamba Allah";
  const no_wa = data.no_wa || "-";
  const email = data.email || "-";
  const alamat = data.alamat || "-";
  const total_donasi = Number(data.total_donasi || data.nominal || 0);

  sheet.appendRow([
    id, nama, no_wa, email, alamat, total_donasi, total_donasi > 0 ? 1 : 0,
    new Date().toISOString(), new Date().toISOString()
  ]);

  logAudit(data.adminName || "Admin", "ADD_DONATUR", "Menambah data donatur: " + nama + " (" + no_wa + ")");
  return { success: true, message: "Donatur " + nama + " berhasil ditambahkan!", id: id };
}

function importDonatur(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("donatur");
  if (!sheet) return { success: false, message: "Sheet donatur tidak ditemukan" };

  const list = data.donaturList || [];
  let count = 0;
  list.forEach(function(d) {
    if (!d.nama && !d.nama_donatur) return;
    const nama = d.nama || d.nama_donatur;
    const id = "DTR-" + (Date.now() + count);
    const no_wa = d.no_wa || "-";
    const email = d.email || "-";
    const alamat = d.alamat || "-";
    const total_donasi = Number(d.total_donasi || d.nominal || 0);
    sheet.appendRow([
      id, nama, no_wa, email, alamat, total_donasi, total_donasi > 0 ? 1 : 0,
      new Date().toISOString(), new Date().toISOString()
    ]);
    count++;
  });

  logAudit(data.adminName || "Admin", "IMPORT_DONATUR", "Mengimpor " + count + " data donatur");
  return { success: true, count: count, message: "Berhasil mengimpor " + count + " data donatur!" };
}

function importDonasi(data) {
  const ss = getSS();
  const sheet = ss.getSheetByName("donasi_masuk");
  if (!sheet) return { success: false, message: "Sheet donasi_masuk tidak ditemukan" };

  const list = data.donasiList || [];
  let count = 0;
  const adminName = data.adminName || "Admin";
  const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  list.forEach(function(d) {
    const nama = d.nama || d.nama_donatur || "Hamba Allah";
    const nominal = Number(d.nominal) || 0;
    if (nominal <= 0) return;

    const id = "DON-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss") + "-" + (count + 1);
    const tanggal = d.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    const no_wa = d.no_wa || "-";
    const metode = d.metode_bayar || d.metode || "Tunai / Cash";
    const program = d.program || "Pengadaan Armada Ambulan";
    const doa = d.doa_pesan || d.doa || "Impor dari file Excel";
    const status = d.status || "Verified";
    const verifiedBy = status === "Verified" ? adminName : "";
    const verifiedAt = status === "Verified" ? nowStr : "";

    sheet.appendRow([
      id, tanggal, nama, no_wa, nominal, metode, program, doa, "", status, verifiedBy, verifiedAt, ""
    ]);
    count++;
  });

  logAudit(adminName, "IMPORT_DONASI", "Mengimpor " + count + " transaksi donasi");
  return { success: true, count: count, message: "Berhasil mengimpor " + count + " transaksi donasi!" };
}

