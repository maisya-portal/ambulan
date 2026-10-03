# PANDUAN DEPLOYMENT GOOGLE APPS SCRIPT
## Pengelolaan Ambulan Ponpes Imam Syafi'i Brebes

- **Spreadsheet ID**: `1q5f7EI5H1SBmb50U4yaFyi7eTDEUgVqpoU4j4yesd8o`
- **Script ID**: `12z6YFl03wUrCn7HE8q9Qs-dAgAK6qQRxWV2WWmQJ6ck_bSMWrL6mkEH-`

### Langkah Cepat Deployment (1 Menit):
1. Buka project Google Apps Script Anda di browser:
   `https://script.google.com/d/12z6YFl03wUrCn7HE8q9Qs-dAgAK6qQRxWV2WWmQJ6ck_bSMWrL6mkEH-/edit`
   *(Atau buka Google Spreadsheet Anda -> klik menu **Extensions (Ekstensi)** -> **Apps Script**)*.
2. Buka file `Code.gs`, hapus kode lama, lalu **Copy & Paste seluruh isi file `google-apps-script/Code.gs`** ke dalamnya.
3. Jalankan fungsi `initDatabase()` sekali dengan menekan tombol **Run (Jalankan)** untuk membuat seluruh sheet (`donatur`, `donasi_masuk`, `pengeluaran`, `users`, `audit_log`, `settings`, `layanan_ambulan`) beserta data bawaan secara otomatis. Berikan izin otorisasi jika diminta Google.
4. Klik tombol biru **Deploy** di kanan atas -> pilih **New Deployment (Penerapan Baru)**.
5. Klik ikon gerigi (Select type) -> pilih **Web app**.
6. Konfigurasi:
   - **Description**: Web App Ambulan v1.0
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone (Siapa saja)` *(Penting agar donatur publik dapat mengirim donasi)*
7. Klik **Deploy** -> Salin **Web app URL** yang dihasilkan (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`).
8. Tempelkan URL tersebut ke dalam aplikasi web (di menu **🔐 ADMIN -> ⚙️ Pengaturan -> URL Google Apps Script**).

Selesai! Aplikasi PWA Ambulan sekarang langsung terhubung dua arah secara real-time dengan Google Spreadsheet Anda.
