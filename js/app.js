/**
 * =========================================================================
 * CORE APP CONTROLLER & ROUTER - AMBULAN PONPES IMAM SYAFI'I BREBES
 * =========================================================================
 */

class AmbulanApp {
  constructor() {
    this.currentView = 'beranda';
    this.isAdminView = false;
    this.init();
  }

  async init() {
    this.registerServiceWorker();
    this.initNavigation();
    this.initModals();
    this.initLoginHandler();
    this.initClipboardButtons();

    // Check URL Hash or restore view
    const hash = window.location.hash.replace('#', '') || 'beranda';
    this.navigateTo(hash);

    // Initialize portals
    await window.publicPortal.init();
    if (window.adminPortal) {
      window.adminPortal.populateSettingsForm();
    }
    if (window.adminPortal.isLoggedIn()) {
      await window.adminPortal.init();
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        }).catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
      });
    }
  }

  initNavigation() {
    // Top Nav Public
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-view');
        if (target) this.navigateTo(target);
      });
    });

    // Bottom Nav Mobile
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-view');
        if (target) {
          if (target === 'admin-portal') {
            if (window.adminPortal.isLoggedIn()) {
              this.navigateTo('admin-dashboard');
            } else {
              this.openModal('modal-login-admin');
            }
          } else {
            this.navigateTo(target);
          }
        }
      });
    });

    // Mobile Drawer Toggle & Backdrop Admin
    const openAdminSidebar = () => {
      const sidebar = document.getElementById('admin-sidebar');
      const backdrop = document.getElementById('admin-sidebar-backdrop');
      if (sidebar) sidebar.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeAdminSidebar = () => {
      const sidebar = document.getElementById('admin-sidebar');
      const backdrop = document.getElementById('admin-sidebar-backdrop');
      if (sidebar) sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.style.overflow = '';
    };

    window.openAdminSidebar = openAdminSidebar;
    window.closeAdminSidebar = closeAdminSidebar;

    const btnOpenSidebar = document.getElementById('btn-open-admin-sidebar');
    if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', openAdminSidebar);

    const btnFabToggle = document.getElementById('admin-fab-toggle');
    if (btnFabToggle) btnFabToggle.addEventListener('click', openAdminSidebar);

    const btnBottomMenu = document.getElementById('admin-bottom-nav-menu');
    if (btnBottomMenu) btnBottomMenu.addEventListener('click', openAdminSidebar);

    const btnCloseSidebar = document.getElementById('btn-close-admin-sidebar');
    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeAdminSidebar);

    const sidebarBackdrop = document.getElementById('admin-sidebar-backdrop');
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeAdminSidebar);

    const btnMobilePublic = document.getElementById('btn-admin-mobile-public');
    if (btnMobilePublic) btnMobilePublic.addEventListener('click', () => {
      closeAdminSidebar();
      this.navigateTo('beranda');
    });

    const btnMobileLogout = document.getElementById('btn-admin-mobile-logout');
    if (btnMobileLogout) btnMobileLogout.addEventListener('click', () => {
      closeAdminSidebar();
      this.handleLogout();
    });

    // Admin Sidebar Navigation (tutup sidebar otomatis setelah klik di mobile)
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-view');
        if (target) {
          closeAdminSidebar();
          this.navigateTo(target);
        }
      });
    });

    // Admin Mobile Bottom Navigation
    document.querySelectorAll('.admin-bottom-nav-item').forEach(item => {
      if (item.id === 'admin-bottom-nav-menu') return;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-view');
        if (target) {
          closeAdminSidebar();
          this.navigateTo(target);
        }
      });
    });

    // Toggle Admin Mode / Public Mode
    const btnToPublic = document.getElementById('btn-admin-to-public');
    if (btnToPublic) {
      btnToPublic.addEventListener('click', () => {
        closeAdminSidebar();
        this.navigateTo('beranda');
      });
    }

    const btnLogout = document.getElementById('btn-admin-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        closeAdminSidebar();
        this.handleLogout();
      });
    }
  }

  navigateTo(viewName) {
    if (!viewName) return;

    // Check if view belongs to admin
    const isAdminTarget = viewName.startsWith('admin-');
    if (isAdminTarget && !window.adminPortal.isLoggedIn()) {
      this.showToast('Silakan login terlebih dahulu untuk mengakses menu admin', 'warning');
      this.openModal('modal-login-admin');
      return;
    }

    this.currentView = viewName;
    this.isAdminView = isAdminTarget;
    window.location.hash = viewName;

    // Sembunyikan semua views
    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });

    // Tampilkan view target
    const targetEl = document.getElementById(`view-${viewName}`);
    if (targetEl) {
      targetEl.style.display = 'block';
    }

    // Atur tampilan layout Admin vs Public
    const publicContainer = document.getElementById('public-container');
    const adminWrapper = document.getElementById('admin-wrapper');
    const bottomNav = document.getElementById('bottom-nav');
    const adminBottomNav = document.getElementById('admin-bottom-nav');

    if (isAdminTarget) {
      document.body.classList.add('admin-mode');
      if (publicContainer) publicContainer.style.display = 'none';
      if (adminWrapper) adminWrapper.style.display = 'flex';
      if (bottomNav) bottomNav.style.display = 'none';
      if (adminBottomNav && window.innerWidth <= 992) adminBottomNav.style.display = 'flex';

      // Update mobile title di sticky topbar
      const viewTitles = {
        'admin-dashboard': 'Dashboard',
        'admin-donatur': 'Data Donatur',
        'admin-donasi': 'Donasi Masuk',
        'admin-pengeluaran': 'Pengeluaran',
        'admin-saldo': 'Saldo Kas',
        'admin-laporan': 'Laporan',
        'admin-bukti': 'Bukti Transaksi',
        'admin-users': 'Admin / User',
        'admin-audit': 'Audit Log',
        'admin-pengaturan': 'Pengaturan'
      };
      const mobileTitle = document.getElementById('admin-mobile-view-name');
      if (mobileTitle && viewTitles[viewName]) {
        mobileTitle.innerText = viewTitles[viewName];
      }
    } else {
      document.body.classList.remove('admin-mode');
      if (publicContainer) publicContainer.style.display = 'block';
      if (adminWrapper) adminWrapper.style.display = 'none';
      if (bottomNav && window.innerWidth <= 992) bottomNav.style.display = 'flex';
      if (adminBottomNav) adminBottomNav.style.display = 'none';
    }

    // Update active state di menu
    this.updateActiveNavClasses(viewName);

    // Jika masuk ke pengaturan admin, otomatis isi formulir dengan konfigurasi aktif
    if (viewName === 'admin-pengaturan' && window.adminPortal) {
      window.adminPortal.populateSettingsForm();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateActiveNavClasses(viewName) {
    // Desktop top nav
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.getAttribute('data-view') === viewName);
    });

    // Mobile bottom nav (Public)
    document.querySelectorAll('.bottom-nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-view') === viewName);
    });

    // Admin bottom nav (Mobile)
    document.querySelectorAll('.admin-bottom-nav-item').forEach(b => {
      if (b.id === 'admin-bottom-nav-menu') return;
      b.classList.toggle('active', b.getAttribute('data-view') === viewName);
    });

    // Admin sidebar
    document.querySelectorAll('.admin-nav-item').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-view') === viewName);
    });
  }

  initModals() {
    // Close modal on click backdrop or close button
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show');
        }
      });
      const btnClose = modal.querySelector('.modal-close');
      if (btnClose) {
        btnClose.addEventListener('click', () => {
          modal.classList.remove('show');
        });
      }
    });
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('show');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('show');
  }

  initLoginHandler() {
    const formLogin = document.getElementById('form-login-admin');
    if (formLogin) {
      // Toggle Password Visibility
      const btnToggle = document.getElementById('btn-toggle-password');
      const inputPass = document.getElementById('login-password');
      const iconToggle = document.getElementById('icon-toggle-password');

      if (btnToggle && inputPass && iconToggle) {
        btnToggle.addEventListener('click', (e) => {
          e.preventDefault();
          const isPassword = inputPass.type === 'password';
          inputPass.type = isPassword ? 'text' : 'password';
          iconToggle.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
        });
      }

      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
          this.showToast('Harap masukkan username dan kata sandi', 'warning');
          return;
        }

        const btn = formLogin.querySelector('button[type="submit"]');
        const originalText = btn ? btn.innerHTML : 'Masuk ke Sistem Admin';
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memverifikasi...';
        }

        try {
          const res = await window.ambulanApi.loginAdmin(username, password);
          if (res && res.success) {
            sessionStorage.setItem('maisya_admin_token', res.token);
            sessionStorage.setItem('maisya_admin_user', JSON.stringify(res.user));

            this.showToast(`Ahlan wa Sahlan, ${res.user.nama}!`, 'success');
            this.closeModal('modal-login-admin');
            formLogin.reset();
            if (inputPass) inputPass.type = 'password';
            if (iconToggle) iconToggle.className = 'fa-regular fa-eye';

            await window.adminPortal.init();
            this.navigateTo('admin-dashboard');
          } else {
            this.showToast(res.message || 'Login gagal! Periksa username & kata sandi.', 'error');
          }
        } catch (err) {
          this.showToast('Error login: ' + err.toString(), 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        }
      });
    }
  }

  handleLogout() {
    document.body.classList.remove('admin-mode');
    sessionStorage.removeItem('maisya_admin_token');
    sessionStorage.removeItem('maisya_admin_user');
    this.showToast('Anda telah keluar dari akun admin.', 'info');
    this.navigateTo('beranda');
  }

  initClipboardButtons() {
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy');
        if (text) {
          navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Disalin!';
            this.showToast(`Nomor rekening ${text} berhasil disalin ke clipboard!`, 'success');
            setTimeout(() => {
              btn.innerHTML = originalText;
            }, 2000);
          }).catch(err => {
            console.error('Clipboard copy failed:', err);
          });
        }
      });
    });
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'circle-info';
    if (type === 'success') icon = 'circle-check';
    if (type === 'error') icon = 'circle-exclamation';
    if (type === 'warning') icon = 'triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid fa-${icon}" style="font-size: 1.25rem; margin-top: 2px;"></i>
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Bootstrapping App
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AmbulanApp();
});
