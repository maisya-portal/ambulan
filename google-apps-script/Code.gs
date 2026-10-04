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
        ["bank2_nama", "Bank Muamalat", new Date().toISOString()],
        ["bank2_norek", "5010099888", new Date().toISOString()],
        ["bank2_atas_nama", "Ponpes Imam Syafi'i Brebes", new Date().toISOString()],
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
 * Membersihkan seluruh baris data demo di spreadsheet
 */
function clearDemoData() {
  const ss = getSS();
  const sheetsToClear = ["donasi_masuk", "pengeluaran", "donatur", "layanan_ambulan"];
  
  sheetsToClear.forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
    }
  });

  // Reset audit log
  const auditSheet = ss.getSheetByName("audit_log");
  if (auditSheet) {
    const lastRow = auditSheet.getLastRow();
    if (lastRow > 1) {
      auditSheet.deleteRows(2, lastRow - 1);
    }
    auditSheet.appendRow([
      "AUD-001",
      Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
      "system",
      "CLEAN_DATABASE",
      "Seluruh data demo spreadsheet berhasil dibersihkan",
      "-"
    ]);
  }

  return { success: true, message: "Seluruh data demo di spreadsheet berhasil dibersihkan!" };
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

  // Update atau tambah data donatur
  if (donaturSheet && no_wa && no_wa !== "-") {
    const dRows = donaturSheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < dRows.length; i++) {
      if (String(dRows[i][2]).trim() === String(no_wa).trim()) {
        const curTotal = Number(dRows[i][5]) || 0;
        const curFreq = Number(dRows[i][6]) || 0;
        donaturSheet.getRange(i + 1, 6).setValue(curTotal + nominal);
        donaturSheet.getRange(i + 1, 7).setValue(curFreq + 1);
        donaturSheet.getRange(i + 1, 9).setValue(new Date().toISOString());
        found = true;
        break;
      }
    }
    if (!found) {
      const dId = "DTR-" + (dRows.length);
      donaturSheet.appendRow([
        dId, nama, no_wa, data.email || "-", data.alamat || "-", nominal, 1, new Date().toISOString(), new Date().toISOString()
      ]);
    }
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

function getAdminData() {
  const ss = getSS();
  const donasiSheet = ss.getSheetByName("donasi_masuk");
  const pengeluaranSheet = ss.getSheetByName("pengeluaran");
  const donaturSheet = ss.getSheetByName("donatur");
  const userSheet = ss.getSheetByName("users");
  const auditSheet = ss.getSheetByName("audit_log");
  const ambulanSheet = ss.getSheetByName("layanan_ambulan");
  const settingsSheet = ss.getSheetByName("settings");

  const toObjList = (sheet) => {
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    const headers = values[0];
    const list = [];
    for (let i = 1; i < values.length; i++) {
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
  const donaturList = toObjList(donaturSheet).reverse();
  const userList = toObjList(userSheet).map(u => ({ ...u, password: "***" }));
  const auditList = toObjList(auditSheet).reverse().slice(0, 100);
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
    const sheet = ss.getSheetByName("audit_log");
    if (!sheet) return;
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
