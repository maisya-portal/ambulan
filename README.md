# 🚑 Aplikasi Pengelolaan & Donasi Ambulan Medis Ponpes Imam Syafi'i Brebes

Aplikasi berbasis **Progressive Web App (PWA)** untuk pengelolaan operasional armada ambulan dan penggalangan donasi sosial kemanusiaan Pondok Pesantren Imam Syafi'i Brebes. Dirancang untuk dapat di-host langsung di **GitHub Pages** dan terintegrasi dengan basis data **Google Spreadsheet** melalui **Google Apps Script Web App**.

---

## 🌟 Fitur Utama

### 🏠 PORTAL PUBLIK
- **🚑 Program Ambulance**: Informasi spesifikasi armada medis (Toyota HiAce/APV Medik lengkap dengan tabung Oksigen 6m3, Roll-in Stretcher otomatis, kotak darurat medis, sirine patwal), sasaran penerima manfaat (1.200+ santri penghafal Al-Qur'an & warga dhuafa 100% bebas biaya).
- **❤️ Donasi Sekarang**: Formulir donasi interaktif dengan pemilihan nominal cepat (Rp 25.000 s/d Rp 1.000.000 atau nominal kustom), opsi anonim *(Hamba Allah)*, pilihan akad alokasi *(Pengadaan Armada / Operasional Medis / BBM)*, serta nomor WhatsApp untuk pengiriman kwitansi digital.
- **💳 Pembayaran**: Scan QRIS dinamis/statis, transfer rekening Bank BSI (`7123456789`) dan Bank Muamalat (`5010099888`) a.n. *YAYASAN IMAM SYAFII BREBES* dengan tombol salin rekening satu klik, dan upload konfirmasi bukti transfer.
- **📊 Progress Donasi**: Visualisasi capaian dana donasi secara real-time terhadap target Rp 250.000.000, persentase terhimpun, sisa kebutuhan, breakdown alokasi kebutuhan dana, dan tahapan milestone.
- **📋 Transparansi**: Laporan kas terbuka yang menampilkan feed mutasi donasi masuk terverifikasi dan daftar pengeluaran operasional ambulan secara akuntabel.
- **📞 Kontak & Siaga 24 Jam**: Hotline darurat santri & dhuafa (`0812-3456-7890`), tombol langsung WhatsApp driver ambulan, peta rute Google Maps, serta formulir pemesanan armada darurat.

---

### 🔐 PORTAL ADMIN
- **Dashboard**: KPI Cards (Saldo Kas Tersedia, Total Donasi Terverifikasi, Antrean Pending, Total Pengeluaran, Total Donatur) dan antrean cepat aksi verifikasi.
- **Data Donatur**: Basis data dermawan/donatur, riwayat frekuensi donasi, total kontribusi, dan tombol direct chat WhatsApp.
- **Donasi Masuk**: Manajemen transaksi donasi dengan filter status *(Semua, Menunggu Verifikasi, Terverifikasi, Ditolak)*, pencarian instan, dan aksi cepat.
- **Verifikasi Pembayaran**: Modal peninjauan bukti transfer dengan pratinjau foto, validasi ke kas masuk, dan tombol otomatis **Kirim Kwitansi WhatsApp** resmi ke donatur.
- **Pengeluaran**: Pencatatan biaya operasional armada (BBM, Servis Mesin/Ganti Oli, Isi Ulang Tabung Oksigen, Obat P3K, Insentif Sopir) beserta arsip nota.
- **Saldo Kas**: Buku kas arus kas masuk dan keluar *(Cash Flow Ledger)* beserta saldo berjalan terkini.
- **Laporan & Cetak**: Format cetak Kwitansi Donasi Resmi ber-Kop Surat *Yayasan Imam Syafi'i Brebes*, Cetak Laporan Keuangan format A4, dan export data donasi/pengeluaran ke format CSV/Excel.
- **Bukti Transaksi**: Galeri arsip foto seluruh bukti pembayaran dan nota pengeluaran dengan modal lightbox zoom preview.
- **Admin/User**: Manajemen akun petugas (Super Administrator, Petugas Verifikator, Driver Ambulan).
- **Audit Log**: Jejak audit sistem otomatis untuk setiap tindakan keuangan dan login pengelola.
- **Pengaturan**: Konfigurasi target dana, info rekening, nomor kontak siaga, dan URL Google Apps Script Web App.

---

## 🗄️ Konfigurasi Database & Backend

- **Google Spreadsheet ID**: `1q5f7EI5H1SBmb50U4yaFyi7eTDEUgVqpoU4j4yesd8o`
- **Google Apps Script ID**: `12z6YFl03wUrCn7HE8q9Qs-dAgAK6qQRxWV2WWmQJ6ck_bSMWrL6mkEH-`
- Kode backend lengkap tersedia di folder [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
- Panduan deployment 1 menit tersedia di [`google-apps-script/README_APPS_SCRIPT.md`](google-apps-script/README_APPS_SCRIPT.md).

---

## 🚀 Panduan Hosting di GitHub Pages

1. Push seluruh kode ini ke repositori `https://github.com/maisya-portal/ambulan.git` di branch `main`.
2. Di halaman GitHub repositori, klik menu **Settings** -> **Pages**.
3. Pada bagian **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: Pilih `main` / `root` (`/`)
4. Klik **Save**. Dalam 1-2 menit, aplikasi Anda aktif di URL:
   `https://maisya-portal.github.io/ambulan/`

---

## 📱 Progressive Web App (PWA)

Aplikasi ini memenuhi standar PWA modern:
- Dapat diinstal langsung di layar utama smartphone Android / iOS (Add to Home Screen).
- Memiliki Service Worker (`sw.js`) untuk caching aset statis dan akses offline.
- Tampilan responsif mobile-first dengan navigasi bawah *(bottom navigation bar)* khusus perangkat genggam.
