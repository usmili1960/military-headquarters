/* global window, document, FileReader, alert, translations, currentLanguage, showNotification */
// User Dashboard JavaScript

console.log('🚀 USER DASHBOARD SCRIPT LOADED');

// API Base URL
const API_BASE = (() => {
  const hostname = window.location.hostname;
  if (hostname.includes('onrender.com') || hostname.includes('railway.app') || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
})();

// Helper function to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function getUserAuthHeaders() {
  const userToken = getCookie('userToken');
  return {
    'Content-Type': 'application/json',
    ...(userToken && { Authorization: `Bearer ${userToken}` }),
  };
}

// Get current user from cookie or redirect to login
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

// Notification elements
let notificationBellBtn = null;
let notificationDropdown = null;
let notificationBadge = null;
let notificationList = null;
let markAllReadBtn = null;

// Notification data
let notifications = [];
let unreadCount = 0;
let selectedDLFrontFile = null;
let selectedDLBackFile = null;
const USER_DASHBOARD_THEME_KEY = 'userDashboardTheme';
const NOTIFICATION_POLL_INTERVAL_MS = 30000;
const NOTIFICATION_RATE_LIMIT_BACKOFF_MS = 60000;
let notificationPollIntervalId = null;
let isNotificationLoadInFlight = false;
let notificationBackoffUntil = 0;

function applyDashboardTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', normalizedTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = normalizedTheme === 'dark'
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  }
}

function initializeThemeToggle() {
  const savedTheme = localStorage.getItem(USER_DASHBOARD_THEME_KEY) || 'light';
  applyDashboardTheme(savedTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (!themeToggleBtn) return;

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyDashboardTheme(nextTheme);
    localStorage.setItem(USER_DASHBOARD_THEME_KEY, nextTheme);
  });
}

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

// Load language from cookie or default to English
function loadSavedLanguage() {
  const savedLanguage = getCookie('selectedLanguage');
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
      // Save to cookie instead of localStorage
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      document.cookie = `selectedLanguage=${currentLanguage}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
      translatePage();
    });
  }
}

function populateSpouseInfo() {
  const spouse = currentUser?.spouse || {};

  const spouseFullName = document.getElementById('spouseFullName');
  const spouseMobile = document.getElementById('spouseMobile');
  const spouseDOB = document.getElementById('spouseDOB');
  const spouseOccupation = document.getElementById('spouseOccupation');
  const spouseAddress = document.getElementById('spouseAddress');
  const spouseEmail = document.getElementById('spouseEmail');
  const spousePassportDisplay = document.getElementById('spousePassportDisplay');
  const spouseDriverLicenseFrontDisplay = document.getElementById('spouseDriverLicenseFrontDisplay');
  const spouseDriverLicenseBackDisplay = document.getElementById('spouseDriverLicenseBackDisplay');
  const spouseDriverLicenseStatus = document.getElementById('spouseDriverLicenseStatus');

  const spouseDobValue = spouse.dob ? new Date(spouse.dob) : null;
  const spouseDobInputValue = spouseDobValue && !Number.isNaN(spouseDobValue.getTime())
    ? spouseDobValue.toISOString().slice(0, 10)
    : '';

  if (spouseFullName) spouseFullName.value = spouse.fullName || spouse.name || '';
  if (spouseMobile) spouseMobile.value = spouse.mobile || '';
  if (spouseDOB) spouseDOB.value = spouseDobInputValue;
  if (spouseOccupation) spouseOccupation.value = spouse.occupation || '';
  if (spouseAddress) spouseAddress.value = spouse.address || '';
  if (spouseEmail) spouseEmail.value = spouse.email || '';

  if (spousePassportDisplay) {
    const spousePassport =
      spouse.passportPicture
      || spouse.photoUrl
      || spouse.profilePicture
      || '';

    if (spousePassport) {
      spousePassportDisplay.innerHTML = `
        <img src="${spousePassport}" alt="Spouse Passport" class="passport-preview">
      `;
    } else {
      spousePassportDisplay.innerHTML = `
        <img src="/assets/default-avatar.png" alt="Spouse Passport" class="passport-preview">
        <p>No document uploaded</p>
      `;
    }
  }

  if (spouseDriverLicenseFrontDisplay) {
    if (currentUser?.driverLicenseFront) {
      spouseDriverLicenseFrontDisplay.innerHTML = `
        <img src="${currentUser.driverLicenseFront}" alt="Driver License Front" class="passport-preview">
      `;
    } else {
      spouseDriverLicenseFrontDisplay.innerHTML = '<p>No document uploaded</p>';
    }
  }

  if (spouseDriverLicenseBackDisplay) {
    if (currentUser?.driverLicenseBack) {
      spouseDriverLicenseBackDisplay.innerHTML = `
        <img src="${currentUser.driverLicenseBack}" alt="Driver License Back" class="passport-preview">
      `;
    } else {
      spouseDriverLicenseBackDisplay.innerHTML = '<p>No document uploaded</p>';
    }
  }

  if (spouseDriverLicenseStatus) {
    const status = (currentUser?.driverLicenseStatus || 'not uploaded').toString();
    spouseDriverLicenseStatus.textContent = `Status: ${status}`;
  }
}

// Load user profile data - Declare before usage
async function loadUserProfile() {
  if (!currentUser) {
    console.warn('⚠️ No current user data');
    return;
  }

  // Fetch fresh user data from server to get updated procedures
  try {
    console.log('🔄 Fetching fresh user data from server...');
    const response = await fetch(`${API_BASE}/api/user/${currentUser.militaryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const freshUserData = await response.json();
      console.log('✅ Fresh user data loaded from server:', freshUserData);
      
      // Merge fresh data with current user, keeping login session info
      currentUser = {
        ...currentUser,
        ...freshUserData,
      };

      // Update localStorage and cookie with fresh data
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      document.cookie = `currentUser=${encodeURIComponent(JSON.stringify(currentUser))}; path=/`;
      
      console.log('✅ User data updated with procedures:', currentUser.procedures?.length || 0);
    } else {
      console.warn('⚠️ Failed to fetch fresh user data, using cached data');
    }
  } catch (error) {
    console.error('❌ Error fetching fresh user data:', error);
    console.log('📝 Using cached user data as fallback');
  }

  console.log('📝 Loading profile for:', currentUser.fullName);

  document.getElementById('userName').textContent = currentUser.fullName || 'N/A';
  document.getElementById('userMilID').textContent = currentUser.militaryId || 'N/A';
  
  // Check if profilePicture element exists before setting src
  const profilePicture = document.getElementById('profilePicture');
  if (profilePicture) {
    profilePicture.src = currentUser.photoUrl || currentUser.passportPicture || currentUser.profilePicture || '../assets/default-avatar.png';
  }
  
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  if (statusText) {
    statusText.textContent = currentUser.status || 'Active';
  }
  if (statusIndicator) {
    statusIndicator.className = 'status-indicator';
    if (currentUser.status === 'inactive' || currentUser.status === 'suspended') {
      statusIndicator.classList.add('inactive');
    } else if (currentUser.status === 'pending') {
      statusIndicator.classList.add('pending');
    }
    // Default is active (green)
  }

  document.getElementById('detailFullName').textContent = currentUser.fullName || 'N/A';
  document.getElementById('detailEmail').textContent = currentUser.email || 'N/A';
  document.getElementById('detailMobile').textContent = currentUser.mobile || 'N/A';
  document.getElementById('detailDOB').textContent = currentUser.dob || 'N/A';
  document.getElementById('detailMilID').textContent = currentUser.militaryId || 'N/A';
  document.getElementById('detailRank').textContent = currentUser.rank || 'N/A';
  document.getElementById('detailStatus').textContent = currentUser.status || 'N/A';
  populateSpouseInfo();

  // Load procedures after fresh data is loaded
  loadProcedures();

  console.log('✅ Profile loaded successfully');
}

// Load procedures - Declare before usage
function formatProcedureDate(dateValue) {
  if (!dateValue) return 'N/A';

  if (typeof dateValue === 'string') {
    const dateOnlyMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]) - 1;
      const day = Number(dateOnlyMatch[3]);
      return new Date(year, month, day).toLocaleDateString();
    }
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return 'N/A';
  return parsedDate.toLocaleDateString();
}

function loadProcedures() {
  const tbody = document.getElementById('proceduresTableBody');
  if (!tbody) {
    console.warn('⚠️ proceduresTableBody element not found');
    return;
  }

  tbody.innerHTML = '';

  if (currentUser && currentUser.procedures && currentUser.procedures.length > 0) {
    console.log('📋 Loading procedures:', currentUser.procedures.length);
    
    currentUser.procedures.forEach((proc) => {
      const row = document.createElement('tr');
      
      // Format date if available
      let dateFormatted = 'N/A';
      if (proc.dateUpdated || proc.assignedDate) {
        dateFormatted = formatProcedureDate(proc.dateUpdated || proc.assignedDate);
      }

      // Use description field from server and handle status
      const statusValue = (proc.status || 'pending').toString().toLowerCase();
      const statusLabel = statusValue === 'in-progress' ? 'In-Progress' : (statusValue.charAt(0).toUpperCase() + statusValue.slice(1));
      const statusBadge = `<span class="badge status-badge-${statusValue}">${statusLabel}</span>`;
      const dueDateFormatted = formatProcedureDate(proc.dueDate);
      row.innerHTML = `
        <td>${proc.name || 'N/A'}</td>
        <td>${statusBadge}</td>
        <td>${proc.description || proc.requirements || 'N/A'}</td>
        <td>${dateFormatted}</td>
        <td>${dueDateFormatted}</td>
        <td><span style="color: #999;">-</span></td>
      `;
      tbody.appendChild(row);
    });
  } else {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="no-procedures-msg">No Procedure yet</td>';
    tbody.appendChild(row);
  }

  console.log('✅ Procedures loaded:', currentUser?.procedures?.length || 0);
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

  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      populateSpouseInfo();
      if (spouseModal) {
        spouseModal.classList.add('show');
        spouseModal.style.display = 'flex';
      }
    });
  }

  // Profile Picture Upload
  const profilePictureUploadBtn = document.getElementById('profilePictureUploadBtn');
  const profilePictureInput = document.getElementById('profilePictureInput');
  const profilePicture = document.getElementById('profilePicture');

  if (profilePictureUploadBtn && profilePictureInput) {
    profilePictureUploadBtn.addEventListener('click', () => {
      profilePictureInput.click();
    });

    profilePictureInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showNotification('Please select a valid image file', 'error', 'Invalid File');
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showNotification('Profile picture must be less than 5MB', 'error', 'File Too Large');
          return;
        }

        try {
          // Show loading notification
          showNotification('Uploading profile picture...', 'info', 'Uploading');

          // Convert file to base64
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64Data = event.target.result;

            try {
              // Upload to server
              const response = await fetch(`${API_BASE}/api/user/upload-profile-picture`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  militaryId: currentUser.militaryId,
                  profilePicture: base64Data
                })
              });

              if (response.ok) {
                const result = await response.json();
                
                // Update profile picture display immediately
                if (profilePicture) {
                  profilePicture.src = base64Data;
                }

                // Update current user data
                if (currentUser) {
                  currentUser.profilePicture = base64Data;
                  currentUser.photoUrl = base64Data;
                }

                showNotification('Profile picture updated successfully!', 'success', 'Success');
              } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload profile picture');
              }

            } catch (error) {
              console.error('Profile picture upload error:', error);
              showNotification('Failed to upload profile picture. Please try again.', 'error', 'Upload Failed');
            }
          };

          reader.readAsDataURL(file);

        } catch (error) {
          console.error('Profile picture processing error:', error);
          showNotification('Failed to process profile picture. Please try again.', 'error', 'Processing Failed');
          
          // Reset file input
          profilePictureInput.value = '';
        }
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
      // Clear cookies
      document.cookie = 'userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'userMilitaryId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Clear localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('userMilitaryId');
      localStorage.removeItem('userToken');
      
      showNotification('You have been logged out successfully', 'success', 'Logged Out');
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

  // Driver's License Upload - Front Side
  const driverLicenseFront = document.getElementById('driverLicenseFront');
  const frontPlaceholder = document.getElementById('frontPlaceholder');
  if (frontPlaceholder) {
    frontPlaceholder.addEventListener('click', () => {
      if (driverLicenseFront) driverLicenseFront.click();
    });
  }
  if (driverLicenseFront) {
    driverLicenseFront.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = document.getElementById('driverLicenseFrontPreview');
          const placeholder = document.getElementById('frontPlaceholder');
          if (preview && placeholder) {
            preview.src = event.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Driver's License Upload - Back Side
  const driverLicenseBack = document.getElementById('driverLicenseBack');
  const backPlaceholder = document.getElementById('backPlaceholder');
  if (backPlaceholder) {
    backPlaceholder.addEventListener('click', () => {
      if (driverLicenseBack) driverLicenseBack.click();
    });
  }
  if (driverLicenseBack) {
    driverLicenseBack.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = document.getElementById('driverLicenseBackPreview');
          const placeholder = document.getElementById('backPlaceholder');
          if (preview && placeholder) {
            preview.src = event.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Driver's License Modal - Close Button
  const closeDLModal = document.getElementById('closeDLModal');
  if (closeDLModal) {
    closeDLModal.addEventListener('click', () => {
      const driverLicenseModal = document.getElementById('driverLicenseModal');
      if (driverLicenseModal) {
        driverLicenseModal.classList.remove('show');
      }
    });
  }

  // Driver's License Modal - Cancel Button
  const cancelDLBtn = document.getElementById('cancelDLBtn');
  if (cancelDLBtn) {
    cancelDLBtn.addEventListener('click', () => {
      const driverLicenseModal = document.getElementById('driverLicenseModal');
      if (driverLicenseModal) {
        driverLicenseModal.classList.remove('show');
      }
    });
  }

  // Driver's License Modal - Submit Button
  const submitDLBtn = document.getElementById('submitDLBtn');
  if (submitDLBtn) {
    submitDLBtn.onclick = uploadDriverLicense;
  }

  // Close DL modal on overlay click
  const driverLicenseModal = document.getElementById('driverLicenseModal');
  if (driverLicenseModal) {
    driverLicenseModal.addEventListener('click', (e) => {
      if (e.target === driverLicenseModal) {
        driverLicenseModal.classList.remove('show');
      }
    });
  }

}

// Initialize DOM elements after page loads
function initializeElements() {
  spouseModal = document.getElementById('spouseModal');
  logoutModal = document.getElementById('logoutModal');
  closeSpouseModal = document.getElementById('closeSpouseModal');
  // Support both legacy and menu logout button
  logoutBtn = document.getElementById('logoutBtn') || document.getElementById('userLogoutBtn');
  confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  goBackBtn = document.getElementById('goBackBtn');
  spouseForm = document.getElementById('spouseForm');

  console.log('✅ DOM elements initialized');

  // Attach event listeners after elements are found
  attachEventListeners();
}

// Initialize DOM elements and setup language switcher

// Notification System Functions
function initializeNotificationSystem() {
  console.log('🔔 Initializing notification system...');
  
  // Get notification elements
  notificationBellBtn = document.getElementById('notificationBellBtn');
  notificationDropdown = document.getElementById('notificationDropdown');
  notificationBadge = document.getElementById('notificationBadge');
  notificationList = document.getElementById('notificationList');
  markAllReadBtn = document.getElementById('markAllReadBtn');

  console.log('🔍 Notification elements found:', {
    bellBtn: !!notificationBellBtn,
    dropdown: !!notificationDropdown,
    badge: !!notificationBadge,
    list: !!notificationList,
    markAllBtn: !!markAllReadBtn
  });

  if (!notificationBellBtn || !notificationDropdown) {
    console.error('❌ Critical notification elements not found!');
    console.error('Bell button:', notificationBellBtn);
    console.error('Dropdown:', notificationDropdown);
    return;
  }

  // Setup event listeners
  setupNotificationEventListeners();

  // Load notifications immediately and start guarded polling
  loadNotifications({ force: true });
  startNotificationPolling();

  console.log('✅ Notification system initialized successfully');
}

function startNotificationPolling() {
  if (notificationPollIntervalId) {
    clearInterval(notificationPollIntervalId);
  }

  notificationPollIntervalId = setInterval(() => {
    if (document.hidden) return;
    loadNotifications();
  }, NOTIFICATION_POLL_INTERVAL_MS);
}

function setupNotificationEventListeners() {
  console.log('🔗 Setting up notification event listeners...');
  
  // Bell button click
  if (notificationBellBtn) {
    notificationBellBtn.addEventListener('click', (e) => {
      console.log('🔔 Bell clicked!');
      e.stopPropagation();
      toggleNotificationDropdown();
    });
    console.log('✅ Bell button listener added');
  } else {
    console.error('❌ Bell button not found for event listener');
  }

  // Mark all as read button
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', async () => {
      console.log('📝 Mark all as read clicked!');
      await markAllNotificationsAsRead();
    });
    console.log('✅ Mark all read button listener added');
  } else {
    console.warn('⚠️ Mark all read button not found');
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    // Check if click is inside any modal or upload areas
    const isInsideModal = e.target.closest('.modal');
    const isInsideUploadBox = e.target.closest('.upload-box');
    const isInsideNotificationArea = notificationDropdown && notificationDropdown.contains(e.target);
    const isNotificationButton = notificationBellBtn && notificationBellBtn.contains(e.target);
    
    // Only hide dropdown if click is outside notification area and not in modals/upload boxes
    if (notificationDropdown && 
        !isInsideNotificationArea && 
        !isNotificationButton && 
        !isInsideModal && 
        !isInsideUploadBox) {
      hideNotificationDropdown();
    }
  });
  console.log('✅ Outside click listener added');
}

function toggleNotificationDropdown() {
  console.log('🔄 Toggling notification dropdown...');
  if (!notificationDropdown) {
    console.error('❌ Notification dropdown not found!');
    return;
  }
  
  if (notificationDropdown.classList.contains('show')) {
    console.log('📤 Hiding dropdown');
    hideNotificationDropdown();
  } else {
    console.log('📥 Showing dropdown');
    showNotificationDropdown();
  }
}

function showNotificationDropdown() {
  console.log('📂 Showing notification dropdown');
  if (notificationDropdown) {
    notificationDropdown.classList.add('show');
    loadNotifications({ force: true });
    console.log('✅ Dropdown shown');
  } else {
    console.error('❌ Cannot show dropdown - element not found');
  }
}

function hideNotificationDropdown() {
  console.log('📪 Hiding notification dropdown');
  if (notificationDropdown) {
    notificationDropdown.classList.remove('show');
    console.log('✅ Dropdown hidden');
  } else {
    console.error('❌ Cannot hide dropdown - element not found');
  }
}

async function loadNotifications(options = {}) {
  if (!currentUser) return;
  const force = options.force === true;
  const now = Date.now();

  if (!force && now < notificationBackoffUntil) return;
  if (isNotificationLoadInFlight) return;

  isNotificationLoadInFlight = true;

  try {
    const response = await fetch(`${API_BASE}/api/notifications/${currentUser.militaryId}`, {
      method: 'GET',
      headers: getUserAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      notifications = data.notifications || [];
      unreadCount = typeof data.unreadCount === 'number'
        ? data.unreadCount
        : notifications.filter((n) => !(n.isRead === true || n.read === true)).length;
      updateNotificationUI();
    } else {
      if (response.status === 429) {
        notificationBackoffUntil = Date.now() + NOTIFICATION_RATE_LIMIT_BACKOFF_MS;
        console.warn('Notification polling paused due to 429');
      } else if (response.status === 401 || response.status === 403) {
        console.error('Failed to load notifications: unauthorized');
      } else {
        console.error('Failed to load notifications');
      }
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  } finally {
    isNotificationLoadInFlight = false;
  }
}

function updateNotificationUI() {
  // Count unread notifications (fallback-safe for both isRead/read fields)
  unreadCount = notifications.filter((n) => !(n.isRead === true || n.read === true)).length;
  
  // Update badge
  updateNotificationBadge();
  
  // Update notification list
  renderNotificationList();
}

function updateNotificationBadge() {
  if (notificationBadge) {
    notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount.toString();
    notificationBadge.classList.add('show');
    notificationBadge.classList.toggle('zero', unreadCount === 0);
  }
}

function renderNotificationList() {
  if (!notificationList) return;

  if (notifications.length === 0) {
    notificationList.innerHTML = '<div class="no-notifications" data-i18n="no-notifications">No new notifications</div>';
    return;
  }

  const notificationHTML = notifications.map(notification => `
    <div class="notification-item ${!notification.isRead ? 'unread' : ''}" data-id="${notification._id}">
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${formatNotificationTime(notification.createdAt)}</div>
      </div>
    </div>
  `).join('');

  notificationList.innerHTML = notificationHTML;

  // Add click listeners to notification items
  document.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', function() {
      const notificationId = this.getAttribute('data-id');
      markNotificationAsRead(notificationId);
    });
  });
}

function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  return date.toLocaleDateString();
}

async function markNotificationAsRead(notificationId) {
  try {
    const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getUserAuthHeaders(),
    });

    if (response.ok) {
      // Update local notification state
      const notification = notifications.find(n => n._id === notificationId);
      if (notification) {
        notification.isRead = true;
        notification.read = true;
        updateNotificationUI();
      }
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function markAllNotificationsAsRead() {
  if (!currentUser) return;

  try {
    const response = await fetch(`${API_BASE}/api/notifications/${currentUser.militaryId}/mark-all-read`, {
      method: 'PUT',
      headers: getUserAuthHeaders(),
    });

    if (response.ok) {
      // Update local notifications state
      notifications.forEach((n) => {
        n.isRead = true;
        n.read = true;
      });
      updateNotificationUI();
      showNotification('All notifications marked as read', 'success', 'Success');
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    showNotification('Failed to mark notifications as read', 'error', 'Error');
  }
}

// Make functions globally accessible
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 USER DASHBOARD SCRIPT STARTED');
  initializeThemeToggle();
  
  // Load currentUser from cookie
  let userCookie = getCookie('currentUser');
  if (userCookie) {
    try {
      currentUser = JSON.parse(decodeURIComponent(userCookie));
      console.log('✅ Loaded user from cookie:', currentUser.fullName);
    } catch (e) {
      console.error('Failed to parse currentUser cookie:', e);
      currentUser = null;
    }
  }

  // Fallback: Try loading from localStorage if cookie is empty
  if (!currentUser) {
    const localStorageUser = localStorage.getItem('currentUser');
    if (localStorageUser) {
      try {
        currentUser = JSON.parse(localStorageUser);
        console.log('✅ Loaded user from localStorage (fallback):', currentUser.fullName);
      } catch (e) {
        console.error('Failed to parse localStorage user:', e);
        currentUser = null;
      }
    }
  }

  // Load user profile if user is present
  if (currentUser) {
    loadUserProfile();
    
    // Initialize language system
    loadSavedLanguage();
    setupLanguageSwitcher();
    translatePage();

    // Initialize DOM elements first
    initializeElements();
    
    // Then initialize notification system
    initializeNotificationSystem();
  } else {
    // Optionally redirect to login or show error
    console.warn('❌ No user found in cookie or localStorage. Redirecting to login.');
    console.log('Available cookies:', document.cookie);
    console.log('localStorage keys:', Object.keys(localStorage));
    setTimeout(() => {
      window.location.href = './index.html';
    }, 500);
    return;
  }

  console.log('✅ Dashboard loaded successfully for:', currentUser.fullName);

  // User Profile Button - Open Verification Process
  const userProfileBtn = document.getElementById('userProfileBtn');
  console.log('userProfileBtn found:', userProfileBtn);

  if (userProfileBtn) {
    console.log('✅ Adding click event listener to profile button');
    userProfileBtn.addEventListener('click', (e) => {
      console.log('🖱️ Profile button clicked!');
      e.preventDefault();
      e.stopPropagation();
      startVerificationProcess();
    });
    console.log('✅ Event listener attached successfully');
  } else {
    console.log('❌ Profile button not found');
  }

  // Initialize verification modals
  initializeVerificationFlow();

  // ...existing code for SPD, logout, etc...
});

// Start Verification Process
function startVerificationProcess() {
  const verificationModal = document.getElementById('dlVerificationModal');
  if (verificationModal) {
    verificationModal.classList.add('show');
    verificationModal.style.display = 'flex';
  }
}

// Initialize Verification Flow
function initializeVerificationFlow() {
  // Verification modal handlers
  const proceedBtn = document.getElementById('proceedVerificationBtn');
  const cancelVerificationBtn = document.getElementById('cancelVerificationBtn');
  const closeVerificationModal = document.getElementById('closeVerificationModal');

  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      closeModal('dlVerificationModal');
      openDriverLicenseModal();
    });
  }

  if (cancelVerificationBtn || closeVerificationModal) {
    [cancelVerificationBtn, closeVerificationModal].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => closeModal('dlVerificationModal'));
      }
    });
  }

  // Driver's License modal handlers
  const submitDLBtn = document.getElementById('submitDLBtn');
  const cancelDLBtn = document.getElementById('cancelDLBtn');
  const closeDLModal = document.getElementById('closeDLModal');

  if (submitDLBtn) {
    submitDLBtn.onclick = uploadDriverLicense;
  }

  if (cancelDLBtn || closeDLModal) {
    [cancelDLBtn, closeDLModal].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => closeModal('driverLicenseModal'));
      }
    });
  }

  // Face verification modal handlers
  initializeFaceVerification();
  
  // Initialize image preview functionality
  initializeImagePreviews();
}

// Open Driver's License Modal
function openDriverLicenseModal() {
  console.log('📄 Opening driver license modal...');
  const driverLicenseModal = document.getElementById('driverLicenseModal');
  if (driverLicenseModal) {
    driverLicenseModal.classList.add('show');
    driverLicenseModal.style.display = 'flex';
    
    console.log('📄 Modal opened, waiting for DOM update...');
    
    // Wait for modal to be fully rendered before attaching handlers
    setTimeout(() => {
      console.log('🔄 Initializing upload handlers...');
      initializeImagePreviews();
    }, 200);
    
    console.log('✅ Driver license modal opened');
  } else {
    console.error('❌ Driver license modal not found');
  }
}

// Close Modal Helper
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
}

// Upload Driver's License Function
async function uploadDriverLicense() {
  const frontInput = document.getElementById('driverLicenseFront');
  const backInput = document.getElementById('driverLicenseBack');
  const frontFile = selectedDLFrontFile || (frontInput && frontInput.files[0]);
  const backFile = selectedDLBackFile || (backInput && backInput.files[0]);

  if (!frontFile || !backFile) {
    showNotification('Please upload both front and back of your driver\'s license', 'warning');
    return;
  }

  showLoader('Uploading documents...');

  try {
    const userToken = getCookie('userToken');
    const militaryId = currentUser.militaryId;
    const frontBase64 = await fileToBase64(frontFile);
    const backBase64 = await fileToBase64(backFile);

    const response = await fetch(`${API_BASE}/api/user/${militaryId}/driver-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userToken && { Authorization: `Bearer ${userToken}` }),
      },
      body: JSON.stringify({
        driverLicenseFront: frontBase64,
        driverLicenseBack: backBase64,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      hideLoader();
      showNotification('Documents uploaded successfully! Now proceeding to face verification.', 'success');
      currentUser.driverLicenseFront = frontBase64;
      currentUser.driverLicenseBack = backBase64;
      currentUser.driverLicenseStatus = 'pending';
      populateSpouseInfo();
      
      // Close driver license modal and open face verification
      closeModal('driverLicenseModal');
      openFaceVerificationModal();
    } else {
      hideLoader();
      showNotification(data.error || 'Failed to upload documents', 'error');
    }
  } catch (error) {
    hideLoader();
    console.error('❌ Upload error:', error);
    showNotification('Failed to upload documents. Please try again.', 'error');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read selected file'));
    reader.readAsDataURL(file);
  });
}

// Face Verification Functions
let faceStream = null;
let faceCanvas = null;
let faceContext = null;

// Initialize Face Verification
function initializeFaceVerification() {
  const capturePhotoBtn = document.getElementById('capturePhotoBtn');
  const retakePhotoBtn = document.getElementById('retakePhotoBtn');
  const submitFaceBtn = document.getElementById('submitFaceBtn');
  const cancelFaceBtn = document.getElementById('cancelFaceBtn');
  const closeFaceModal = document.getElementById('closeFaceModal');

  if (capturePhotoBtn) {
    capturePhotoBtn.addEventListener('click', capturePhoto);
  }

  if (retakePhotoBtn) {
    retakePhotoBtn.addEventListener('click', retakePhoto);
  }

  if (submitFaceBtn) {
    submitFaceBtn.addEventListener('click', submitFaceVerification);
  }

  if (cancelFaceBtn || closeFaceModal) {
    [cancelFaceBtn, closeFaceModal].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          stopCamera();
          closeModal('faceVerificationModal');
        });
      }
    });
  }
}

// Open Face Verification Modal
function openFaceVerificationModal() {
  const faceModal = document.getElementById('faceVerificationModal');
  if (faceModal) {
    faceModal.classList.add('show');
    faceModal.style.display = 'flex';
    initializeCamera();
  }
}

// Initialize Camera
async function initializeCamera() {
  try {
    const video = document.getElementById('faceCamera');
    faceCanvas = document.getElementById('faceCanvas');
    faceContext = faceCanvas.getContext('2d');

    // Request camera access
    faceStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });

    video.srcObject = faceStream;
    
    // Set canvas dimensions to match video
    video.addEventListener('loadedmetadata', () => {
      faceCanvas.width = video.videoWidth;
      faceCanvas.height = video.videoHeight;
    });

  } catch (error) {
    console.error('❌ Camera access denied:', error);
    showNotification('Camera access is required for face verification. Please allow camera access and try again.', 'error');
  }
}

// Stop Camera
function stopCamera() {
  if (faceStream) {
    faceStream.getTracks().forEach(track => track.stop());
    faceStream = null;
  }
}

// Capture Photo
function capturePhoto() {
  const video = document.getElementById('faceCamera');
  const capturedPhoto = document.getElementById('capturedPhoto');
  const capturedPhotoContainer = document.getElementById('capturedPhotoContainer');
  const captureBtn = document.getElementById('capturePhotoBtn');
  const retakeBtn = document.getElementById('retakePhotoBtn');
  const submitBtn = document.getElementById('submitFaceBtn');

  if (video && faceCanvas && faceContext) {
    // Draw video frame to canvas
    faceContext.drawImage(video, 0, 0, faceCanvas.width, faceCanvas.height);
    
    // Convert canvas to image data
    const imageDataUrl = faceCanvas.toDataURL('image/jpeg', 0.8);
    
    // Display captured photo
    capturedPhoto.src = imageDataUrl;
    capturedPhotoContainer.style.display = 'block';
    
    // Hide video and update buttons
    video.style.display = 'none';
    captureBtn.style.display = 'none';
    retakeBtn.style.display = 'inline-block';
    submitBtn.style.display = 'inline-block';
    
    // Stop camera stream
    stopCamera();
  }
}

// Retake Photo
function retakePhoto() {
  const video = document.getElementById('faceCamera');
  const capturedPhotoContainer = document.getElementById('capturedPhotoContainer');
  const captureBtn = document.getElementById('capturePhotoBtn');
  const retakeBtn = document.getElementById('retakePhotoBtn');
  const submitBtn = document.getElementById('submitFaceBtn');

  // Show video and hide captured photo
  video.style.display = 'block';
  capturedPhotoContainer.style.display = 'none';
  
  // Update buttons
  captureBtn.style.display = 'inline-block';
  retakeBtn.style.display = 'none';
  submitBtn.style.display = 'none';
  
  // Restart camera
  initializeCamera();
}

// Submit Face Verification
async function submitFaceVerification() {
  showLoader('Processing face verification...');
  
  try {
    const imageDataUrl = document.getElementById('capturedPhoto').src;
    const userToken = getCookie('userToken');
    const militaryId = currentUser.militaryId;
    
    // Convert data URL to blob without fetch to avoid CSP issues
    const blob = dataUrlToBlob(imageDataUrl);
    
    const formData = new FormData();
    formData.append('facePhoto', blob, 'face-verification.jpg');
    
    const uploadResponse = await fetch(`${API_BASE}/api/user/${militaryId}/face-verification`, {
      method: 'POST',
      headers: {
        ...(userToken && { Authorization: `Bearer ${userToken}` }),
      },
      body: formData,
    });

    const data = await uploadResponse.json();

    if (uploadResponse.ok && data.success) {
      hideLoader();
      showNotification('Identity verification completed successfully! Your documents will be reviewed by an admin.', 'success');
      
      // Close modal and reset forms
      closeModal('faceVerificationModal');
      resetAllForms();
    } else {
      hideLoader();
      showNotification(data.error || 'Face verification failed. Please try again.', 'error');
    }
  } catch (error) {
    hideLoader();
    console.error('❌ Face verification error:', error);
    showNotification('Face verification failed. Please try again.', 'error');
  }
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(data);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

// Initialize Image Preview Functionality
function initializeImagePreviews() {
  const frontInput = document.getElementById('driverLicenseFront');
  const backInput = document.getElementById('driverLicenseBack');

  if (frontInput) {
    frontInput.onchange = (event) => {
      selectedDLFrontFile = event.target.files[0] || null;
      previewImage(event, 'frontPlaceholder', 'driverLicenseFrontPreview');
    };
  }

  if (backInput) {
    backInput.onchange = (event) => {
      selectedDLBackFile = event.target.files[0] || null;
      previewImage(event, 'backPlaceholder', 'driverLicenseBackPreview');
    };
  }
}

// Preview Selected Image
function previewImage(event, placeholderId, previewId) {
  const file = event.target.files[0];
  const placeholder = document.getElementById(placeholderId);
  const preview = document.getElementById(previewId);
  const uploadBox = placeholder ? placeholder.closest('.upload-box') : null;

  if (file && placeholder && preview && uploadBox) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file.', 'error');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Image size should be less than 10MB.', 'error');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      // Hide placeholder
      placeholder.style.display = 'none';
      
      // Show and setup preview image
      preview.src = e.target.result;
      preview.style.display = 'block';
      preview.style.position = 'absolute';
      preview.style.top = '0';
      preview.style.left = '0';
      preview.style.width = '100%';
      preview.style.height = '100%';
      preview.style.objectFit = 'cover';
      preview.style.borderRadius = '8px';
      preview.style.zIndex = '2';
      
      // Update upload box styling
      uploadBox.classList.add('has-image');
      uploadBox.style.padding = '0';
    };
    
    reader.onerror = function() {
      console.error('❌ FileReader error');
      showNotification('Error reading the image file.', 'error');
    };
    
    reader.readAsDataURL(file);
  }
}
function resetAllForms() {
  // Reset driver license form
  const dlFront = document.getElementById('driverLicenseFront');
  const dlBack = document.getElementById('driverLicenseBack');
  const frontPreview = document.getElementById('driverLicenseFrontPreview');
  const backPreview = document.getElementById('driverLicenseBackPreview');
  const frontPlaceholder = document.getElementById('frontPlaceholder');
  const backPlaceholder = document.getElementById('backPlaceholder');
  
  if (dlFront) dlFront.value = '';
  if (dlBack) dlBack.value = '';
  selectedDLFrontFile = null;
  selectedDLBackFile = null;
  
  if (frontPreview) {
    frontPreview.style.display = 'none';
    frontPreview.src = '';
    frontPreview.style.border = '';
  }
  
  if (backPreview) {
    backPreview.style.display = 'none';
    backPreview.src = '';
    backPreview.style.border = '';
  }
  
  if (frontPlaceholder) frontPlaceholder.style.display = 'flex';
  if (backPlaceholder) backPlaceholder.style.display = 'flex';
  
  // Re-initialize upload box click handlers
  initializeImagePreviews();
  
  // Reset face verification
  const video = document.getElementById('faceCamera');
  const capturedPhotoContainer = document.getElementById('capturedPhotoContainer');
  const captureBtn = document.getElementById('capturePhotoBtn');
  const retakeBtn = document.getElementById('retakePhotoBtn');
  const submitBtn = document.getElementById('submitFaceBtn');
  
  if (video) video.style.display = 'block';
  if (capturedPhotoContainer) capturedPhotoContainer.style.display = 'none';
  if (captureBtn) captureBtn.style.display = 'inline-block';
  if (retakeBtn) retakeBtn.style.display = 'none';
  if (submitBtn) submitBtn.style.display = 'none';
  
  stopCamera();
}
