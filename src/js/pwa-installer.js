/**
 * PWA Installer
 * Handles PWA installation prompt and service worker registration
 */

let deferredPrompt = null;
let isInstalled = false;

// Check if app is already installed
function checkIfInstalled() {
  // Check if running in standalone mode (PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled = true;
    console.log('✅ App is running as PWA');
    hideInstallButton();
    return true;
  }

  // Check if running in standalone mode (iOS)
  if (window.navigator.standalone === true) {
    isInstalled = true;
    console.log('✅ App is running as PWA (iOS)');
    hideInstallButton();
    return true;
  }

  return false;
}

// Register service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Service Worker update found');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✅ New Service Worker installed, refresh to update');
            showUpdateNotification();
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('⚠️ Service Workers not supported');
    return null;
  }
}

// Show update notification
function showUpdateNotification() {
  if (confirm('A new version is available! Refresh to update?')) {
    window.location.reload();
  }
}

// Setup install prompt
function setupInstallPrompt() {
  // Check if already installed
  if (checkIfInstalled()) {
    return;
  }

  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');
    
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    
    // Save the event for later use
    deferredPrompt = e;
    
    // Show install button
    showInstallButton();
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    isInstalled = true;
    deferredPrompt = null;
    hideInstallButton();
    
    // Show success message
    showToast('App installed successfully!', 'success');
  });
}

// Show install button
function showInstallButton() {
  const installBtn = document.getElementById('pwaInstallBtn');
  if (installBtn) {
    installBtn.style.display = 'block';
    installBtn.addEventListener('click', promptInstall);
  }

  // Show install banner (if exists)
  const installBanner = document.getElementById('pwaInstallBanner');
  if (installBanner) {
    installBanner.style.display = 'flex';
    
    // Setup close button
    const closeBannerBtn = document.getElementById('closePwaInstallBanner');
    if (closeBannerBtn) {
      closeBannerBtn.addEventListener('click', () => {
        installBanner.style.display = 'none';
        sessionStorage.setItem('pwa_banner_dismissed', 'true');
      });
    }
    
    // Don't show if dismissed in this session
    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
      installBanner.style.display = 'none';
    }
  }
}

// Hide install button
function hideInstallButton() {
  const installBtn = document.getElementById('pwaInstallBtn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }

  const installBanner = document.getElementById('pwaInstallBanner');
  if (installBanner) {
    installBanner.style.display = 'none';
  }
}

// Prompt to install
async function promptInstall() {
  if (!deferredPrompt) {
    console.warn('⚠️ Install prompt not available');
    showToast('Install not available on this browser', 'warning');
    return;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user's response
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`👤 User response: ${outcome}`);

  if (outcome === 'accepted') {
    showToast('Installing app...', 'info');
  } else {
    showToast('Installation cancelled', 'info');
  }

  // Clear the prompt
  deferredPrompt = null;
  hideInstallButton();
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `pwa-toast pwa-toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Show with animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Check for updates
async function checkForUpdates() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('🔄 Checked for updates');
    }
  }
}

// Enable offline mode indicator
function setupOfflineIndicator() {
  function updateOnlineStatus() {
    const indicator = document.getElementById('offlineIndicator');
    
    if (!navigator.onLine) {
      if (indicator) {
        indicator.style.display = 'block';
      } else {
        // Create indicator if it doesn't exist
        const newIndicator = document.createElement('div');
        newIndicator.id = 'offlineIndicator';
        newIndicator.className = 'offline-indicator';
        newIndicator.textContent = '⚠️ You are offline';
        document.body.appendChild(newIndicator);
      }
      console.log('📵 Offline mode');
    } else {
      if (indicator) {
        indicator.style.display = 'none';
      }
      console.log('🌐 Online mode');
    }
  }

  // Check initial status
  updateOnlineStatus();

  // Listen for online/offline events
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// Initialize PWA features
async function initPWA() {
  console.log('📱 Initializing PWA features...');

  // Register service worker
  await registerServiceWorker();

  // Setup install prompt
  setupInstallPrompt();

  // Setup offline indicator
  setupOfflineIndicator();

  // Check for updates every hour
  setInterval(checkForUpdates, 60 * 60 * 1000);

  console.log('✅ PWA initialized');
}

// Export functions
window.pwaInstaller = {
  init: initPWA,
  install: promptInstall,
  checkUpdates: checkForUpdates,
  isInstalled: () => isInstalled,
};

// Auto-initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPWA);
} else {
  initPWA();
}
