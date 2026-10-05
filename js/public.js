/**
 * =========================================================================
 * PUBLIC PORTAL CONTROLLER - AMBULAN PONPES IMAM SYAFI'I BREBES
 * =========================================================================
 * Menangani interaksi Beranda, Program, Form Donasi, Pembayaran, Progress,
 * Transparansi, dan Permohonan Ambulan Darurat.
 * =========================================================================
 */

class PublicPortal {
  constructor() {
    this.currentDonation = {
      nominal: 100000,
      program: 'Pengadaan Armada',
      nama: '',
      isAnonim: false,
      no_wa: '',
      doa_pesan: '',
      metode_bayar: 'QRIS',
      bukti_base64: ''
    };
    this.initEventListeners();
  }

  async init() {
    await this.refreshPublicData();
  }

  async refreshPublicData() {
    try {
      const data = await window.ambulanApi.getPublicData();
      if (!data) return;

      this.renderStatsAndProgress(data.stats);
      this.renderTransparansi(data.transparansiDonasi, data.transparansiPengeluaran);
      this.renderSettings(data.settings);
    } catch (err) {
      console.error('Gagal memuat data publik:', err);
    }
  }

  renderStatsAndProgress(stats) {
    if (!stats) return;

    // Format Mata Uang Rupiah
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');

    // Hero & Progress Views
    const elTerkumpulHero = document.getElementById('stat-terkumpul-hero');
    const elTerkumpul = document.getElementById('progress-terkumpul');
    const elTarget = document.getElementById('progress-target');
    const elSisa = document.getElementById('progress-sisa');
    const elDonatur = document.getElementById('progress-donatur');
    const elBar = document.getElementById('progress-bar-fill');
    const elPersen = document.getElementById('progress-persen');
    const elSaldoKas = document.getElementById('transparansi-saldo-kas');
    const elTotalKeluar = document.getElementById('transparansi-total-pengeluaran');

    if (elTerkumpulHero) elTerkumpulHero.innerText = formatRp(stats.totalTerkumpul);
    if (elTerkumpul) elTerkumpul.innerText = formatRp(stats.totalTerkumpul);
    if (elTarget) elTarget.innerText = formatRp(stats.targetDonasi);
    if (elSisa) elSisa.innerText = formatRp(stats.sisaTarget);
    if (elDonatur) elDonatur.innerText = (stats.totalDonatur || 0) + " Donatur";
    if (elPersen) elPersen.innerText = stats.persentase + "%";
    if (elBar) elBar.style.width = Math.min(100, stats.persentase) + "%";

    if (elSaldoKas) elSaldoKas.innerText = formatRp(stats.saldoKas);
    if (elTotalKeluar) elTotalKeluar.innerText = formatRp(stats.totalPengeluaran);
  }

  renderTransparansi(donations, expenses) {
    const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString('id-ID');

    // Tabel Donasi Terverifikasi
    const tbodyDonasi = document.getElementById('table-body-donasi');
    if (tbodyDonasi) {
      if (!donations || donations.length === 0) {
        tbodyDonasi.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 2rem; color: #64748b;">Belum ada catatan donasi terverifikasi</td></tr>`;
      } else {
        tbodyDonasi.innerHTML = donations.map((d, idx) => `
          <tr>
            <td style="font-weight: 600; color: #64748b;">#${idx + 1}</td>
            <td style="white-space: nowrap; font-size: 0.85rem;">${d.tanggal}</td>
            <td style="font-weight: 700; color: #0d7a57;">${d.nama}</td>
            <td style="font-weight: 800; color: #1e293b;">${formatRp(d.nominal)}</td>
            <td><span class="badge badge-primary">${d.program}</span><div style="font-size: 0.8rem; font-style: italic; color: #64748b; margin-top: 4px;">"${d.doa || '-'}"</div></td>
          </tr>
        `).join('');
      }
    }

    // Tabel Pengeluaran Operasional
    const tbodyKeluar = document.getElementById('table-body-pengeluaran');
    if (tbodyKeluar) {
      if (!expenses || expenses.length === 0) {
        tbodyKeluar.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 2rem; color: #64748b;">Belum ada catatan pengeluaran operasional</td></tr>`;
      } else {
        tbodyKeluar.innerHTML = expenses.map((p, idx) => `
          <tr>
            <td style="font-weight: 600; color: #64748b;">#${idx + 1}</td>
            <td style="white-space: nowrap; font-size: 0.85rem;">${p.tanggal}</td>
            <td><span class="badge badge-warning">${p.kategori}</span></td>
            <td>
              <div style="font-weight: 600;">${p.deskripsi}</div>
              <small style="color: #64748b;">PIC: ${p.pic || 'Driver/Admin'}</small>
            </td>
            <td style="font-weight: 800; color: #ef4444;">${formatRp(p.nominal)}</td>
          </tr>
        `).join('');
      }
    }
  }

  renderSettings(settings) {
    if (!settings) return;

    // Helper: Parse bank name, norek, atas-nama from structured or legacy
    const b1Nama = settings.bank1_nama || 'Bank Syariah Indonesia (BSI)';
    const b1Norek = settings.bank1_norek || (settings.rekening_bsi ? (settings.rekening_bsi.match(/\d[\d\s-]{4,}\d/) || [settings.rekening_bsi])[0].replace(/[^\d]/g, '') : '7123456789');
    let b1AtasNama = settings.bank1_atas_nama || (settings.rekening_bsi && settings.rekening_bsi.includes('a.n.') ? settings.rekening_bsi.split('a.n.')[1].trim() : 'YAYASAN IMAM SYAFII BREBES');
    if (b1AtasNama && !b1AtasNama.toLowerCase().startsWith('a.n.')) {
      b1AtasNama = 'a.n. ' + b1AtasNama;
    }

    const b2Nama = settings.bank2_nama || 'Bank Muamalat';
    const b2Norek = settings.bank2_norek || (settings.rekening_muamalat ? (settings.rekening_muamalat.match(/\d[\d\s-]{4,}\d/) || [settings.rekening_muamalat])[0].replace(/[^\d]/g, '') : '5010099888');
    let b2AtasNama = settings.bank2_atas_nama || (settings.rekening_muamalat && settings.rekening_muamalat.includes('a.n.') ? settings.rekening_muamalat.split('a.n.')[1].trim() : "Ponpes Imam Syafi'i Brebes");
    if (b2AtasNama && !b2AtasNama.toLowerCase().startsWith('a.n.')) {
      b2AtasNama = 'a.n. ' + b2AtasNama;
    }

    const isB1Aktif = (settings.bank1_aktif === undefined || settings.bank1_aktif === null || String(settings.bank1_aktif) === 'true' || settings.bank1_aktif === true);
    const isB2Aktif = (settings.bank2_aktif === undefined || settings.bank2_aktif === null || String(settings.bank2_aktif) === 'true' || settings.bank2_aktif === true);

    // Bank 1 UI elements
    const elB1Nama = document.getElementById('text-bank1-nama');
    const elB1An = document.getElementById('text-bank1-atas-nama');
    const elB1Norek = document.getElementById('text-bank1-norek');
    const btnCopyB1 = document.getElementById('btn-copy-bank1');
    const cardB1 = document.getElementById('card-bank1') || (elB1Nama ? elB1Nama.closest('.bank-card') : null);

    if (elB1Nama) elB1Nama.innerText = b1Nama;
    if (elB1An) elB1An.innerText = b1AtasNama;
    if (elB1Norek) elB1Norek.innerText = b1Norek;
    if (btnCopyB1) btnCopyB1.setAttribute('data-copy', b1Norek);
    if (cardB1) cardB1.style.display = isB1Aktif ? '' : 'none';

    // Bank 2 UI elements
    const elB2Nama = document.getElementById('text-bank2-nama');
    const elB2An = document.getElementById('text-bank2-atas-nama');
    const elB2Norek = document.getElementById('text-bank2-norek');
    const btnCopyB2 = document.getElementById('btn-copy-bank2');
    const cardB2 = document.getElementById('card-bank2') || (elB2Nama ? elB2Nama.closest('.bank-card') : null);

    if (elB2Nama) elB2Nama.innerText = b2Nama;
    if (elB2An) elB2An.innerText = b2AtasNama;
    if (elB2Norek) elB2Norek.innerText = b2Norek;
    if (btnCopyB2) btnCopyB2.setAttribute('data-copy', b2Norek);
    if (cardB2) cardB2.style.display = isB2Aktif ? '' : 'none';

    // Header Rekening Bank
    const headingBank = document.getElementById('heading-transfer-bank');
    if (headingBank) {
      headingBank.style.display = (!isB1Aktif && !isB2Aktif) ? 'none' : '';
    }

    // Dynamic Select Metode Pembayaran di Konfirmasi Donasi
    const selMetode = document.getElementById('select-metode-bayar');
    if (selMetode) {
      const prevVal = selMetode.value;
      selMetode.innerHTML = '';
      if (isB1Aktif) {
        const opt1 = document.createElement('option');
        opt1.value = `Transfer ${b1Nama}`;
        opt1.innerText = `Transfer ${b1Nama}`;
        selMetode.appendChild(opt1);
      }
      if (isB2Aktif) {
        const opt2 = document.createElement('option');
        opt2.value = `Transfer ${b2Nama}`;
        opt2.innerText = `Transfer ${b2Nama}`;
        selMetode.appendChild(opt2);
      }
      const optQris = document.createElement('option');
      optQris.value = 'QRIS';
      optQris.innerText = 'QRIS (GoPay/OVO/Dana/BCA/dll)';
      selMetode.appendChild(optQris);

      const optTunai = document.createElement('option');
      optTunai.value = 'Tunai Langsung';
      optTunai.innerText = 'Tunai Langsung di Kantor Pesantren';
      selMetode.appendChild(optTunai);

      const hasMatch = Array.from(selMetode.options).some(o => o.value === prevVal);
      if (hasMatch) selMetode.value = prevVal;
    }

    // Legacy fallback IDs
    const elBsi = document.getElementById('text-rek-bsi');
    if (elBsi && elBsi !== elB1Norek) elBsi.innerText = b1Norek;
    const elMuamalat = document.getElementById('text-rek-muamalat');
    if (elMuamalat && elMuamalat !== elB2Norek) elMuamalat.innerText = b2Norek;

    // Hotline & WhatsApp
    const hotline = settings.hotline_darurat || '0812-9154-2134 (Ustadz Tegar)';
    const cleanDigits = hotline.replace(/[^\d]/g, '');
    let wa = (settings.wa_konfirmasi || '').replace(/[^\d]/g, '');
    if (!wa) {
      wa = cleanDigits.startsWith('0') ? '62' + cleanDigits.slice(1) : cleanDigits || '6281291542134';
    } else if (wa.startsWith('0')) {
      wa = '62' + wa.slice(1);
    }

    // Ticker Header
    const tickerLink = document.getElementById('ticker-hotline-link');
    const tickerText = document.getElementById('ticker-hotline-text');
    if (tickerLink) tickerLink.href = `tel:${cleanDigits || '081291542134'}`;
    if (tickerText) tickerText.innerText = hotline;

    // Kontak view
    const elHotline = document.getElementById('text-hotline');
    if (elHotline) elHotline.innerText = hotline;

    const btnHotlineCall = document.getElementById('btn-hotline-call');
    if (btnHotlineCall) btnHotlineCall.href = `tel:${cleanDigits || '081291542134'}`;

    const btnHotlineWa = document.getElementById('btn-hotline-wa');
    if (btnHotlineWa) {
      btnHotlineWa.href = `https://wa.me/${wa}?text=${encodeURIComponent("Assalamu'alaikum, saya butuh informasi/layanan ambulan darurat Ponpes Imam Syafi'i.")}`;
    }

    // Driver contact
    const elDriver = document.getElementById('text-kontak-driver');
    if (elDriver && settings.kontak_driver) elDriver.innerText = settings.kontak_driver;

    // Modal Panggil Ambulan
    const modalCall = document.getElementById('modal-ambulan-call');
    if (modalCall) modalCall.href = `tel:${cleanDigits || '081291542134'}`;

    const modalWa = document.getElementById('modal-ambulan-wa');
    if (modalWa) {
      modalWa.href = `https://wa.me/${wa}?text=${encodeURIComponent("Assalamu'alaikum, kami membutuhkan bantuan armada ambulan medis segera!")}`;
    }

    // Alamat Posko
    const elAlamat = document.getElementById('text-alamat-ponpes');
    if (elAlamat && settings.alamat_ponpes) elAlamat.innerText = settings.alamat_ponpes;
  }

  initEventListeners() {
    // Quick Pick Nominal
    const nominalButtons = document.querySelectorAll('.nominal-btn');
    const inputCustomNominal = document.getElementById('input-custom-nominal');

    nominalButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        nominalButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = Number(btn.getAttribute('data-value'));
        this.currentDonation.nominal = val;
        if (inputCustomNominal) inputCustomNominal.value = val.toLocaleString('id-ID');
        this.updatePaymentPreview();
      });
    });

    if (inputCustomNominal) {
      inputCustomNominal.addEventListener('input', (e) => {
        nominalButtons.forEach(b => b.classList.remove('active'));
        const clean = e.target.value.replace(/[^0-9]/g, '');
        const val = Number(clean) || 0;
        this.currentDonation.nominal = val;
        e.target.value = val ? val.toLocaleString('id-ID') : '';
        this.updatePaymentPreview();
      });
    }

    // Anonim Checkbox
    const checkAnonim = document.getElementById('check-hamba-allah');
    const inputNama = document.getElementById('input-donor-nama');
    if (checkAnonim && inputNama) {
      checkAnonim.addEventListener('change', (e) => {
        this.currentDonation.isAnonim = e.target.checked;
        if (e.target.checked) {
          inputNama.value = "Hamba Allah";
          inputNama.disabled = true;
        } else {
          inputNama.value = "";
          inputNama.disabled = false;
        }
      });
    }

    // Tombol Lanjut ke Pembayaran dari Form Donasi
    const btnLanjutBayar = document.getElementById('btn-lanjut-bayar');
    if (btnLanjutBayar) {
      btnLanjutBayar.addEventListener('click', () => {
        this.captureDonationFormData();
        if (this.currentDonation.nominal < 10000) {
          window.app.showToast('Nominal donasi minimal Rp 10.000', 'warning');
          return;
        }
        window.app.navigateTo('pembayaran');
        this.updatePaymentPreview();
        window.app.showToast('Silakan pilih metode transfer dan upload bukti', 'info');
      });
    }

    // Upload Bukti Transfer File Handler
    const inputBukti = document.getElementById('input-bukti-file');
    const previewContainer = document.getElementById('preview-bukti-container');
    const previewImg = document.getElementById('img-preview-bukti');

    if (inputBukti) {
      inputBukti.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            window.app.showToast('Ukuran foto maksimal 5MB', 'error');
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            this.currentDonation.bukti_base64 = event.target.result;
            if (previewImg && previewContainer) {
              previewImg.src = event.target.result;
              previewContainer.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Submit Konfirmasi Donasi
    const formKonfirmasi = document.getElementById('form-konfirmasi-donasi');
    if (formKonfirmasi) {
      formKonfirmasi.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleDonationSubmit();
      });
    }

    // Form Permohonan Ambulan Darurat
    const formAmbulan = document.getElementById('form-permohonan-ambulan');
    if (formAmbulan) {
      formAmbulan.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleAmbulanceRequest();
      });
    }
  }

  captureDonationFormData() {
    const inputNama = document.getElementById('input-donor-nama');
    const inputWa = document.getElementById('input-donor-wa');
    const inputDoa = document.getElementById('input-donor-doa');
    const selectProgram = document.getElementById('select-donor-program');

    if (inputNama) this.currentDonation.nama = inputNama.value.trim() || 'Hamba Allah';
    if (inputWa) this.currentDonation.no_wa = inputWa.value.trim();
    if (inputDoa) this.currentDonation.doa_pesan = inputDoa.value.trim();
    if (selectProgram) this.currentDonation.program = selectProgram.value;
  }

  updatePaymentPreview() {
    const elNominalDisplay = document.getElementById('payment-display-nominal');
    const elNamaDisplay = document.getElementById('payment-display-nama');
    const elProgramDisplay = document.getElementById('payment-display-program');

    if (elNominalDisplay) {
      elNominalDisplay.innerText = "Rp " + (this.currentDonation.nominal || 0).toLocaleString('id-ID');
    }
    if (elNamaDisplay) {
      elNamaDisplay.innerText = this.currentDonation.nama || (this.currentDonation.isAnonim ? 'Hamba Allah' : '-');
    }
    if (elProgramDisplay) {
      elProgramDisplay.innerText = this.currentDonation.program || 'Pengadaan Armada';
    }
  }

  async handleDonationSubmit() {
    this.captureDonationFormData();

    if (!this.currentDonation.nominal || this.currentDonation.nominal <= 0) {
      window.app.showToast('Harap masukkan nominal donasi yang sah', 'warning');
      return;
    }

    const selectMetode = document.getElementById('select-metode-bayar');
    if (selectMetode) this.currentDonation.metode_bayar = selectMetode.value;

    const btnSubmit = document.getElementById('btn-submit-konfirmasi');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'Mengirim data...';
    }

    try {
      const res = await window.ambulanApi.submitDonasi(this.currentDonation);
      if (res && res.success) {
        window.app.showToast('Alhamdulillah! Donasi Anda berhasil dikirim dan dicatat.', 'success');
        
        // Buka modal kwitansi konfirmasi
        this.showDonationSuccessModal(res.donasiId || 'DON-' + Date.now(), this.currentDonation);
        
        // Reset form
        this.resetDonationForm();
        
        // Refresh tabel
        await this.refreshPublicData();
      } else {
        window.app.showToast('Gagal mengirim donasi: ' + (res.message || 'Error'), 'error');
      }
    } catch (err) {
      window.app.showToast('Terjadi kesalahan saat memproses donasi: ' + err.toString(), 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerText = 'Kirim Konfirmasi Donasi';
      }
    }
  }

  showDonationSuccessModal(donasiId, donasiData) {
    const modal = document.getElementById('modal-kwitansi-sukses');
    if (!modal) return;

    const elId = document.getElementById('kwitansi-id');
    const elNama = document.getElementById('kwitansi-nama');
    const elNominal = document.getElementById('kwitansi-nominal');
    const elMetode = document.getElementById('kwitansi-metode');
    const elTanggal = document.getElementById('kwitansi-tanggal');

    if (elId) elId.innerText = donasiId;
    if (elNama) elNama.innerText = donasiData.nama || 'Hamba Allah';
    if (elNominal) elNominal.innerText = "Rp " + Number(donasiData.nominal).toLocaleString('id-ID');
    if (elMetode) elMetode.innerText = donasiData.metode_bayar;
    if (elTanggal) elTanggal.innerText = new Date().toLocaleString('id-ID');

    modal.classList.add('show');
  }

  resetDonationForm() {
    const inputCustom = document.getElementById('input-custom-nominal');
    const inputNama = document.getElementById('input-donor-nama');
    const inputWa = document.getElementById('input-donor-wa');
    const inputDoa = document.getElementById('input-donor-doa');
    const previewContainer = document.getElementById('preview-bukti-container');

    if (inputCustom) inputCustom.value = '';
    if (inputNama) inputNama.value = '';
    if (inputWa) inputWa.value = '';
    if (inputDoa) inputDoa.value = '';
    if (previewContainer) previewContainer.style.display = 'none';

    this.currentDonation.bukti_base64 = '';
  }

  async handleAmbulanceRequest() {
    const form = document.getElementById('form-permohonan-ambulan');
    const data = {
      nama_pemohon: document.getElementById('amb-pemohon').value.trim(),
      no_wa: document.getElementById('amb-wa').value.trim(),
      nama_pasien: document.getElementById('amb-pasien').value.trim(),
      kategori_pasien: document.getElementById('amb-kategori').value,
      alamat_jemput: document.getElementById('amb-alamat').value.trim(),
      tujuan_faskes: document.getElementById('amb-tujuan').value.trim(),
      catatan: document.getElementById('amb-catatan').value.trim()
    };

    if (!data.nama_pemohon || !data.no_wa || !data.alamat_jemput) {
      window.app.showToast('Harap lengkapi nama, nomor WA, dan alamat jemput!', 'warning');
      return;
    }

    try {
      const res = await window.ambulanApi.requestAmbulance(data);
      if (res && res.success) {
        window.app.showToast(res.message, 'success');
        form.reset();
        window.app.closeModal('modal-panggil-ambulan');

        // Buka WhatsApp Otomatis ke Hotline Ambulan dengan format darurat (Ustadz Tegar)
        const hotlineNum = "6281291542134";
        const pesanWA = encodeURIComponent(
          `*PERMOHONAN AMBULAN DARURAT MAISYA*\n` +
          `-----------------------------------\n` +
          `Nama Pemohon : ${data.nama_pemohon}\n` +
          `No. WA : ${data.no_wa}\n` +
          `Nama Pasien : ${data.nama_pasien} (${data.kategori_pasien})\n` +
          `Alamat Jemput : ${data.alamat_jemput}\n` +
          `Faskes Tujuan : ${data.tujuan_faskes}\n` +
          `Kondisi/Keluhan : ${data.catatan}\n` +
          `-----------------------------------\n` +
          `Mohon armada segera diinstruksikan. Jazakumullahu khairan.`
        );
        window.open(`https://wa.me/${hotlineNum}?text=${pesanWA}`, '_blank');
      }
    } catch (e) {
      window.app.showToast('Gagal mengirim permohonan ambulan: ' + e.toString(), 'error');
    }
  }
}

window.publicPortal = new PublicPortal();
