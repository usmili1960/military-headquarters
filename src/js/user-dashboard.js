/* global window, document, localStorage, FileReader, alert, translations, currentLanguage */
// User Dashboard JavaScript

// Get current user from localStorage or redirect to login
let currentUser = null;
// currentLanguage is defined in translations.js

// Modal elements - Will be initialized after DOM loads
let spouseModal = null;
let logoutModal = null;
let closeSpouseModal = null;
let logoutBtn = null;
let confirmLogoutBtn = null;
let cancelLogoutBtn = null;
let goBackBtn = null;
let spouseForm = null;

// Translate page based on current language
function translatePage() {
  if (typeof translations === 'undefined') {
    console.warn('⚠️ Translations not available');
    return;
  }
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
      element.textContent = translations[currentLanguage][key];
    }
  });
}

// Load language from localStorage or default to English
function loadSavedLanguage() {
  const savedLanguage = localStorage.getItem('selectedLanguage');
  if (savedLanguage) {
    currentLanguage = savedLanguage;
    document.documentElement.lang = currentLanguage;
  }
}

// Setup language switcher
function setupLanguageSwitcher() {
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = currentLanguage;
    languageSelect.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      localStorage.setItem('selectedLanguage', currentLanguage);
      translatePage();
    });
  }
}

// Load user profile data - Declare before usage
function loadUserProfile() {
  if (!currentUser) {
    console.warn('⚠️ No current user data');
    return;
  }

  console.log('📝 Loading profile for:', currentUser.fullName);

  document.getElementById('userName').textContent = currentUser.fullName || 'N/A';
  document.getElementById('userMilID').textContent = currentUser.militaryId || 'N/A';
  document.getElementById('profilePicture').src = currentUser.passportPicture || '../assets/default-avatar.png';
  document.getElementById('statusText').textContent = currentUser.status || 'N/A';

  document.getElementById('detailFullName').textContent = currentUser.fullName || 'N/A';
  document.getElementById('detailEmail').textContent = currentUser.email || 'N/A';
  document.getElementById('detailMobile').textContent = currentUser.mobile || 'N/A';
  document.getElementById('detailDOB').textContent = currentUser.dob || 'N/A';
  document.getElementById('detailMilID').textContent = currentUser.militaryId || 'N/A';
  document.getElementById('detailRank').textContent = currentUser.rank || 'N/A';
  document.getElementById('detailStatus').textContent = currentUser.status || 'N/A';

  console.log('✅ Profile loaded successfully');
}

// Load procedures - Declare before usage
function loadProcedures() {
  const tbody = document.getElementById('proceduresList');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (currentUser && currentUser.procedures && currentUser.procedures.length > 0) {
    currentUser.procedures.forEach((proc) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${proc.name || 'N/A'}</td>
        <td>${proc.requirements || 'N/A'}</td>
        <td>${proc.addedDate || 'N/A'}</td>
        <td><span class="badge status-badge-pending">Pending Review</span></td>
      `;
      tbody.appendChild(row);
    });
  } else {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4">No procedures assigned yet. Check back later.</td>';
    tbody.appendChild(row);
  }

  console.log('✅ Procedures loaded');
}

// Attach event listeners - Declare before usage
function attachEventListeners() {
  // Close Spouse Modal button
  if (closeSpouseModal) {
    closeSpouseModal.addEventListener('click', () => {
      if (spouseModal) {
        spouseModal.classList.remove('show');
        spouseModal.style.display = 'none';
      }
    });
  }

  if (goBackBtn) {
    goBackBtn.addEventListener('click', () => {
      if (spouseModal) {
        spouseModal.classList.remove('show');
        spouseModal.style.display = 'none';
      }
    });
  }

  // Spouse Form Submit
  if (spouseForm) {
    spouseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Spouse information saved successfully!');
      if (spouseModal) {
        spouseModal.classList.remove('show');
        spouseModal.style.display = 'none';
      }
    });
  }

  // Spouse driver's license upload
  const spouseDriverLicenseFront = document.getElementById('spouseDriverLicenseFront');
  if (spouseDriverLicenseFront) {
    spouseDriverLicenseFront.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = document.getElementById('driverLicenseFrontPreview');
          if (preview) {
            preview.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Spouse driver's license back upload
  const spouseDriverLicenseBack = document.getElementById('spouseDriverLicenseBack');
  if (spouseDriverLicenseBack) {
    spouseDriverLicenseBack.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = document.getElementById('driverLicenseBackPreview');
          if (preview) {
            preview.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Logout modal button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (logoutModal) {
        logoutModal.classList.add('show');
        logoutModal.style.display = 'flex';
      }
    });
  }

  // Confirm logout button
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userMilitaryId');
      alert('You have been logged out successfully');
      window.location.href = './index.html';
    });
  }

  // Cancel logout button
  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => {
      if (logoutModal) {
        logoutModal.classList.remove('show');
        logoutModal.style.display = 'none';
      }
    });
  }

  // Close modal on overlay click
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target === logoutModal) {
        logoutModal.classList.remove('show');
        logoutModal.style.display = 'none';
      }
    });
  }
}

// Initialize DOM elements after page loads
function initializeElements() {
  spouseModal = document.getElementById('spouseModal');
  logoutModal = document.getElementById('logoutModal');
  closeSpouseModal = document.getElementById('closeSpouseModal');
  logoutBtn = document.getElementById('logoutBtn');
  confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  goBackBtn = document.getElementById('goBackBtn');
  spouseForm = document.getElementById('spouseForm');

  console.log('✅ DOM elements initialized');

  // Attach event listeners after elements are found
  attachEventListeners();
}

// Initialize DOM elements and setup language switcher
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  if (localStorage.getItem('userLoggedIn') !== 'true') {
    alert('Please login first');
    window.location.href = './index.html';
    return;
  }

  // Get user data from localStorage
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      currentUser = JSON.parse(userStr);
      console.log('✅ Loaded user from localStorage:', currentUser);
    } catch (error) {
      console.error('❌ Failed to parse user data:', error);
      alert('Error loading user data');
      window.location.href = './index.html';
      return;
    }
  } else {
    console.error('❌ No user data found in localStorage');
    alert('No user data found. Please login again.');
    window.location.href = './index.html';
    return;
  }

  // Initialize language system
  loadSavedLanguage();
  setupLanguageSwitcher();
  translatePage();

  // Initialize all modal elements and attach event listeners
  initializeElements();

  // Load user profile and procedures after DOM is ready
  loadUserProfile();
  loadProcedures();

  // User Menu Dropdown
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userMenuDropdown = document.getElementById('userMenuDropdown');
  const viewSpdBtn = document.getElementById('viewSpdBtn');
  const userLogoutBtn = document.getElementById('userLogoutBtn');

  if (!userMenuBtn || !userMenuDropdown) {
    console.warn('⚠️ User menu elements not found');
    return;
  }

  // Toggle user menu dropdown on button click
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = userMenuDropdown.classList.contains('hidden-display');
    console.log('🔄 Dropdown toggle attempt - currently hidden:', isHidden);
    userMenuDropdown.classList.toggle('hidden-display');
    console.log('✅ User menu toggled');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    // Check if click is outside the user menu
    if (userMenuBtn && userMenuDropdown) {
      const clickedInsideMenu = userMenuBtn.contains(e.target);
      const clickedInsideDropdown = userMenuDropdown.contains(e.target);

      if (!clickedInsideMenu && !clickedInsideDropdown) {
        userMenuDropdown.classList.add('hidden-display');
        console.log('📍 Clicked outside menu - closing dropdown');
      }
    }
  });

  // View/Edit SPD Information button
  if (viewSpdBtn) {
    viewSpdBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('📋 SPD Information clicked');
      userMenuDropdown.classList.add('hidden-display');
      // Open the spouse modal instead
      if (spouseModal) {
        spouseModal.classList.add('show');
        spouseModal.style.display = 'flex';
        console.log('✅ Spouse modal opened');
      }
    });
  }

  // User Logout button from dropdown
  if (userLogoutBtn) {
    userLogoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('🚪 User logout from menu clicked');
      userMenuDropdown.classList.add('hidden-display');

      // Clear all user data from localStorage
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('userMilitaryId');
      localStorage.removeItem('userToken');
      localStorage.removeItem('currentUser');

      console.log('✅ User logged out, localStorage cleared');

      // Redirect to login
      window.location.href = './index.html';
    });
  }
});
