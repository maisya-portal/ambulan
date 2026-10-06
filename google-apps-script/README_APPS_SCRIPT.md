# PANDUAN DEPLOYMENT GOOGLE APPS SCRIPT
## Pengelolaan Ambulan Ponpes Imam Syafi'i Brebes

- **Spreadsheet ID**: `1q5f7EI5H1SBmb50U4yaFyi7eTDEUgVqpoU4j4yesd8o`
- **Script ID**: `12z6YFl03wUrCn7HE8q9Qs-dAgAK6qQRxWV2WWmQJ6ck_bSMWrL6mkEH-`
- **Web App URL Aktif**: `https://script.google.com/macros/s/AKfycbzWpWylCScaz13HUfjbdVyMyfYI2ePlrucY0jgfg4DZgJtLc60NXwhycAnOSFE_2SGP/exec`

### Akun Administrator Resmi:
- **Username**: `adminambulanmaisya`
- **Password**: `ambulan991588`
- **Role**: `superadmin`

---

### Cara Membersihkan Data Demo di Google Spreadsheet:

Ada 2 cara yang sangat mudah untuk membersihkan seluruh data demo:

#### Cara 1: Dari Aplikasi Web (Paling Praktis)
1. Buka aplikasi web Ambulan Maisya.
2. Masuk ke **🔐 ADMIN** -> pilih menu **⚙️ Pengaturan**.
3. Klik tombol merah **🧹 Bersihkan Seluruh Data Demo**.
4. Sistem akan otomatis membersihkan baris data demo dan mereset tabel transaksi.

#### Cara 2: Dari Editor Google Apps Script
1. Buka project Apps Script:
   `https://script.google.com/d/12z6YFl03wUrCn7HE8q9Qs-dAgAK6qQRxWV2WWmQJ6ck_bSMWrL6mkEH-/edit`
2. Pada dropdown fungsi di toolbar atas (dekat tombol Run), pilih fungsi **`clearDemoData`**.
3. Klik tombol **Run (Jalankan)**.
4. Seluruh baris demo di sheet `donasi_masuk`, `pengeluaran`, `donatur`, dan `layanan_ambulan` akan terhapus bersih dan menyisakan header tabel yang siap digunakan untuk data riil.

---

### ⚠️ PENTING: Cara Mengembalikan Data Jika Tidak Sengaja Terhapus / Kosong:
Google Spreadsheet otomatis mencatat seluruh riwayat versi data setiap menit:
1. Buka Google Spreadsheet **DB_Maisya_Ambulan**.
2. Klik menu **File** -> **Riwayat versi (Version history)** -> **Lihat riwayat versi (See version history)** (atau tekan shortcut `Ctrl + Alt + Shift + H`).
3. Pilih tanggal & jam sebelum data terhapus di panel sebelah kanan.
4. Klik tombol **"Pulihkan versi ini" (Restore this version)** di bagian atas. Seluruh data transaksi akan langsung kembali utuh 100%!

---

### Cara Update Kode Apps Script:
1. Copy seluruh isi file terbaru `google-apps-script/Code.gs`.
2. Buka editor Google Apps Script Anda, ganti kode yang ada dengan kode baru ini, lalu tekan **Ctrl + S (Simpan)**.
3. Klik **Deploy** -> **Manage deployments** -> klik ikon pensil (Edit) -> pilih versi **New version** -> klik **Deploy**.
