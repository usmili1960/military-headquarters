// User Dashboard JavaScript

// Get current user from localStorage or redirect to login
let currentUser = null;

window.addEventListener('load', () => {
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
      loadUserProfile();
      loadProcedures();
    } catch (error) {
      console.error('❌ Failed to parse user data:', error);
      alert('Error loading user data');
      window.location.href = './index.html';
    }
  } else {
    console.error('❌ No user data found in localStorage');
    alert('No user data found. Please login again.');
    window.location.href = './index.html';
  }
});

// Modal elements - Will be initialized after DOM loads
let spouseModal = null;
let logoutModal = null;
let closeSpouseModal = null;
let logoutBtn = null;
let confirmLogoutBtn = null;
let cancelLogoutBtn = null;
let goBackBtn = null;
let spouseForm = null;
let spouseNotificationBtn = null;
let notificationBtn = null;

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
  spouseNotificationBtn = document.getElementById('spouseNotificationBtn');
  notificationBtn = document.getElementById('notificationBtn');

  console.log('✅ DOM elements initialized');

  // Attach event listeners after elements are found
  attachEventListeners();
}

function attachEventListeners() {
  // Close Spouse Modal button
  if (closeSpouseModal) {
    closeSpouseModal.addEventListener('click', () => {
      spouseModal.classList.remove('show');
      spouseModal.style.display = 'none';
    });
  }

  if (goBackBtn) {
    goBackBtn.addEventListener('click', () => {
      spouseModal.classList.remove('show');
      spouseModal.style.display = 'none';
    });
  }

  // Spouse Form Submit
  if (spouseForm) {
    spouseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Spouse information saved successfully!');
      spouseModal.classList.remove('show');
      spouseModal.style.display = 'none';
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
          preview.innerHTML = `<img src="${event.target.result}" alt="Driver License Front">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const spouseDriverLicenseBack = document.getElementById('spouseDriverLicenseBack');
  if (spouseDriverLicenseBack) {
    spouseDriverLicenseBack.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = document.getElementById('driverLicenseBackPreview');
          preview.innerHTML = `<img src="${event.target.result}" alt="Driver License Back">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Notification handling
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      alert('You have no new notifications');
    });
  }

  if (spouseNotificationBtn) {
    spouseNotificationBtn.addEventListener('click', () => {
      alert('Spouse information notifications:\n- Passport upload pending (Admin)\n- Driver license upload completed');
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutModal.classList.add('show');
      logoutModal.style.display = 'flex';
      document.getElementById('logoutUsername').textContent = currentUser.fullName;
    });
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      // Clear localStorage
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('userMilitaryId');
      localStorage.removeItem('userToken');
      localStorage.removeItem('currentUser');

      console.log('✅ User logged out');
      alert('You have been logged out successfully');
      window.location.href = './index.html';
    });
  }

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => {
      logoutModal.classList.remove('show');
      logoutModal.style.display = 'none';
    });
  }

  // Modal background click handlers
  window.addEventListener('click', (e) => {
    if (spouseModal && e.target === spouseModal) {
      spouseModal.classList.remove('show');
      spouseModal.style.display = 'none';
    }
    if (logoutModal && e.target === logoutModal) {
      logoutModal.classList.remove('show');
      logoutModal.style.display = 'none';
    }
  });
}

// Load procedures
function loadProcedures() {
  // Only show procedures that were explicitly added by admin
  const procedures = currentUser.procedures && currentUser.procedures.length > 0
    ? currentUser.procedures
    : [];

  const tbody = document.getElementById('proceduresTableBody');
  tbody.innerHTML = '';

  if (procedures.length > 0) {
    procedures.forEach((proc) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${proc.name}</td>
                <td><span class="status-badge ${proc.status.toLowerCase()}">${proc.status}</span></td>
                <td>${proc.requirements}</td>
                <td>${proc.dateUpdated}</td>
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

// Load spouse data
function loadSpouseData() {
  const spouseData = {
    fullName: 'Jane Smith',
    mobile: '+1-555-0124',
    dob: '1992-08-20',
    occupation: 'School Teacher',
    address: '123 Military Ave, Washington DC 20301',
    email: 'jane.smith@email.com',
  };

  document.getElementById('spouseFullName').value = spouseData.fullName;
  document.getElementById('spouseMobile').value = spouseData.mobile;
  document.getElementById('spouseDOB').value = spouseData.dob;
  document.getElementById('spouseOccupation').value = spouseData.occupation;
  document.getElementById('spouseAddress').value = spouseData.address;
  document.getElementById('spouseEmail').value = spouseData.email;

  // Check if spouse info is complete
  const isComplete = spouseData.fullName && spouseData.mobile;
  const notificationDot = document.getElementById('spouseNotificationDot');
  if (isComplete) {
    notificationDot.classList.add('off');
  } else {
    notificationDot.classList.remove('off');
  }
}

// Initialize DOM elements and setup language switcher
document.addEventListener('DOMContentLoaded', () => {
  // Initialize language system
  loadSavedLanguage();
  setupLanguageSwitcher();
  translatePage();

  // Initialize all modal elements and attach event listeners
  initializeElements();
});

// Load user profile data
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

// User Menu Dropdown - Fixed Implementation
document.addEventListener('DOMContentLoaded', () => {
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
      const spouseModal = document.getElementById('spouseModal');
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
