/* eslint-disable no-undef, no-use-before-define, no-restricted-globals */
/* global window, document, localStorage, alert */
/* global setupLanguageSwitcher, translatePage, loadSavedLanguage */
/* global showNotification, showConfirmation */

// Admin Dashboard JavaScript

// API Configuration - auto-detects production vs local environment
const API_BASE = (() => {
  const hostname = window.location.hostname;
  // If on production domain (onrender.com, etc), use current domain
  if (hostname.includes('onrender.com') || hostname.includes('railway.app') || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
    return window.location.origin;
  }
  // Local development - use localhost:3000
  return 'http://localhost:3000';
})();

console.log('🌐 API Base URL:', API_BASE);
console.log('🌐 Page Location:', `${window.location.hostname}:${window.location.port}`);

// Helper function to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Check if admin is logged in
window.addEventListener('load', async () => {
  const adminToken = getCookie('adminToken');
  
  if (!adminToken) {
    await showNotification('You must login through the Admin Login page to access this panel.\n\nRedirecting to Admin Login...', 'warning', 'Unauthorized Access');
    window.location.href = './admin-login.html';
    return;
  }

  // Verify token with backend
  try {
    const response = await fetch(`${API_BASE}/api/admin/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Invalid session');
    }

    const data = await response.json();
    console.log('✅ Admin verified:', data.admin.email);

  } catch (error) {
    console.error('❌ Session verification failed:', error);
    showNotification('⚠️ Your session has expired. Please login again.');
    document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = './admin-login.html';
    return;
  }

  // Initialize language system
  loadSavedLanguage();
  setupLanguageSwitcher();
  translatePage();

  // Load users from backend
  fetchAndLoadUsers();
  pollAdminNotifications(true);

  // Auto-refresh users list every 30 seconds (reduced from 5 to improve performance)
  setInterval(fetchAndLoadUsers, 30000);
  setInterval(() => pollAdminNotifications(false), 30000);
});

// Modal elements
const emailModal = document.getElementById('emailModal');
const userDetailModal = document.getElementById('userDetailModal');
const spouseEditModal = document.getElementById('spouseEditModal');
const userProceduresModal = document.getElementById('userProceduresModal');
const adminLogoutModal = document.getElementById('adminLogoutModal');

// Button elements
const composeEmailBtn = document.getElementById('composeEmailBtn');
const closeEmailModal = document.getElementById('closeEmailModal');
const cancelEmailBtn = document.getElementById('cancelEmailBtn');
const closeUserDetailModal = document.getElementById('closeUserDetailModal');
const closeSpouseEditModal = document.getElementById('closeSpouseEditModal');
const closeUserProceduresModal = document.getElementById('closeUserProceduresModal');
const adminMenuBtn = document.getElementById('adminMenuBtn');
const adminMenuDropdown = document.getElementById('adminMenuDropdown');
const spouseEditOption = document.getElementById('spouseEditOption');
const userProceduresOption = document.getElementById('userProceduresOption');
// Admin dropdown logout handled via event delegation
const confirmAdminLogoutBtn = document.getElementById('confirmAdminLogoutBtn');
const cancelAdminLogoutBtn = document.getElementById('cancelAdminLogoutBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

// Form elements
const emailForm = document.getElementById('emailForm');
const procedureForm = document.getElementById('procedureForm');
const spouseAdminForm = document.getElementById('spouseAdminForm');
const adminProcedureForm = document.getElementById('adminProcedureForm');

// Sample data
const mockUsers = [
  {
    id: 1,
    fullName: 'John Michael Smith',
    militaryId: 'NSS-123456',
    email: 'john.smith@military.gov',
    mobile: '+1-555-0123',
    dob: '1990-05-15',
    rank: 'General',
    passportPicture: '../assets/default-avatar.png',
    status: 'ACTIVE',
    accountCreated: '2024-01-15',
  },
  {
    id: 2,
    fullName: 'Sarah Elizabeth Johnson',
    militaryId: 'NSS-234567',
    email: 'sarah.johnson@military.gov',
    mobile: '+1-555-0124',
    dob: '1988-03-22',
    rank: 'Colonel',
    passportPicture: '../assets/default-avatar.png',
    status: 'ACTIVE',
    accountCreated: '2024-01-20',
  },
  {
    id: 3,
    fullName: 'David Robert Williams',
    militaryId: 'NSS-345678',
    email: 'david.williams@military.gov',
    mobile: '+1-555-0125',
    dob: '1995-07-10',
    rank: 'Private',
    passportPicture: '../assets/default-avatar.png',
    status: 'INACTIVE',
    accountCreated: '2024-02-01',
  },
  {
    id: 4,
    fullName: 'Test User',
    militaryId: 'NSS-987654',
    email: 'test.user@military.gov',
    mobile: '+1-555-0199',
    dob: '1992-11-20',
    rank: 'Sergeant',
    passportPicture: '../assets/default-avatar.png',
    status: 'ACTIVE',
    accountCreated: '2024-12-24',
  },
];

let currentSelectedUser = null;
let allFetchedUsers = [];
let currentSpouseUser = null;
let currentProcedureUser = null;
let lastAdminUnreadCount = null;
let activeViewerImageSrc = '';
let imageViewerScale = 1;

const IMAGE_VIEWER_MIN_SCALE = 1;
const IMAGE_VIEWER_MAX_SCALE = 5;
const IMAGE_VIEWER_SCALE_STEP = 0.25;

// Fetch users from backend
function fetchAndLoadUsers() {
  // Get admin token from cookie
  const adminToken = getCookie('adminToken');
  
  // First try to fetch from backend API
  fetch(`${API_BASE}/api/admin/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
    },
  })
    .then((response) => {
      console.log('📡 Backend response status:', response.status);
      if (!response.ok) {
        throw new Error(`Backend returned status: ${response.status}`);
      }
      return response.json();
    })
    .then((backendUsers) => {
      console.log('✅ Users fetched from backend:', backendUsers);
      console.log('📊 Total users from backend:', backendUsers.length);

      if (backendUsers && Array.isArray(backendUsers) && backendUsers.length > 0) {
        console.log('📋 Displaying', backendUsers.length, 'users from backend');
        allFetchedUsers = backendUsers;
        loadUsersTable(allFetchedUsers);
        populateUserDropdown(allFetchedUsers);
      } else if (backendUsers && Array.isArray(backendUsers)) {
        console.log('⚠️ Backend returned empty array, showing "No users found"');
        allFetchedUsers = [];
        loadUsersTable([]);
        populateUserDropdown([]);
      } else {
        console.log('⚠️ Backend returned invalid data');
        throw new Error('Invalid data format from backend');
      }
    })
    .catch((error) => {
      console.error('❌ Backend API error:', error.message);
      console.error('⚠️ Could not load users from backend');
      
      // Don't show mock users - show error message instead
      allFetchedUsers = [];
      loadUsersTable([]);
      
      // Show error notification
      const tbody = document.getElementById('usersTableBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;"><i class="fas fa-exclamation-triangle"></i> Error loading users. Please refresh the page.</td></tr>';
      }
    });
}

async function pollAdminNotifications(isInitialLoad = false) {
  const adminToken = getCookie('adminToken');
  if (!adminToken) return;

  try {
    const response = await fetch(`${API_BASE}/api/admin/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) return;

    const data = await response.json();
    const unreadCount = Number.isFinite(data.unreadCount) ? data.unreadCount : 0;

    if (isInitialLoad || lastAdminUnreadCount === null) {
      lastAdminUnreadCount = unreadCount;
      return;
    }

    if (unreadCount > lastAdminUnreadCount) {
      const newCount = unreadCount - lastAdminUnreadCount;
      showNotification(
        `You have ${newCount} new notification${newCount > 1 ? 's' : ''}.`,
        'info',
        'Admin Alert'
      );
    }

    lastAdminUnreadCount = unreadCount;
  } catch (error) {
    console.error('❌ Failed to poll admin notifications:', error);
  }
}

// Populate user dropdown for procedure assignment
function populateUserDropdown(users = []) {
  const targetUserSelect = document.getElementById('targetUserId');
  if (!targetUserSelect) {
    console.error('❌ targetUserId select element not found!');
    return;
  }

  // Clear existing options except the first one
  targetUserSelect.innerHTML = '<option value="">Select a user...</option>';

  if (!users || users.length === 0) {
    targetUserSelect.innerHTML += '<option value="" disabled>No users available</option>';
    return;
  }

  // Sort users alphabetically by full name
  const sortedUsers = [...users].sort((a, b) => {
    const nameA = (a.fullName || '').toLowerCase();
    const nameB = (b.fullName || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Add user options
  sortedUsers.forEach(user => {
    if (user && user.militaryId && user.fullName) {
      const option = document.createElement('option');
      option.value = user.militaryId;
      option.textContent = `${user.fullName} (${user.militaryId})`;
      targetUserSelect.appendChild(option);
    }
  });

  console.log('✅ User dropdown populated with', sortedUsers.length, 'users');
}

// Load users table
function loadUsersTable(users = []) {
  console.log('📋 loadUsersTable called with', users.length, 'users');
  const tbody = document.getElementById('usersTableBody');

  if (!tbody) {
    console.error('❌ usersTableBody element not found!');
    return;
  }

  tbody.innerHTML = '';

  if (!users || users.length === 0) {
    console.log('⚠️ No users to display');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No users found</td></tr>';
    return;
  }

  users.forEach((user) => {
    // Skip users with missing required fields
    if (!user || (!user.id && !user._id) || !user.fullName || !user.militaryId) {
      console.warn('⚠️ Skipping invalid user:', user);
      return;
    }

    const row = document.createElement('tr');
    const status = user.status || 'ACTIVE';
    const rank = user.rank || 'N/A';
    const created = user.accountCreated || 'N/A';
    const picture = user.photoUrl || user.passportPicture || '../assets/default-avatar.png';
    const approved = user.approved !== undefined ? user.approved : false;

    // Log approval status for debugging
    console.log(`User ${user.militaryId}: approved field = ${user.approved}, evaluated as: ${approved}`);

    // Approval status badge
    const approvalBadge = approved 
      ? '<span class="status-badge active"><span class="status-dot"></span>APPROVED</span>'
      : '<span class="status-badge inactive"><span class="status-dot"></span>PENDING</span>';

    // Action buttons - different for pending vs approved users
    const actionButtons = approved
      ? `<div class="action-buttons">
          <button class="action-btn" type="button" data-action="view" data-military-id="${user.militaryId}">View</button>
          <button class="action-btn" type="button" data-action="edit" data-military-id="${user.militaryId}">Edit</button>
        </div>`
      : `<div class="action-buttons">
          <button class="action-btn" type="button" data-action="approve" data-military-id="${user.militaryId}" style="background: #28a745; color: white;">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="action-btn" type="button" data-action="reject" data-military-id="${user.militaryId}" style="background: #dc3545; color: white;">
            <i class="fas fa-times"></i> Reject
          </button>
        </div>`;

    row.innerHTML = `
            <td><img src="${picture}" alt="Profile" class="user-avatar" style="cursor: pointer;" onclick="openImageViewer('${picture}')"></td>
            <td>${user.fullName}</td>
            <td>${user.militaryId}</td>
            <td>${rank}</td>
            <td>
                <span class="status-badge ${status.toLowerCase()}">
                    <span class="status-dot"></span>
                    ${status}
                </span>
            </td>
            <td>${approvalBadge}</td>
            <td>${created}</td>
            <td>${actionButtons}</td>
        `;
    tbody.appendChild(row);
  });

  console.log('✅ Table populated with', users.length, 'users');
}

// Search users
const userSearchInput = document.getElementById('userSearch');
if (userSearchInput) {
  userSearchInput.addEventListener('input', (e) => {
    const searchTerm = (e.target.value || '').toLowerCase();
    const usersToSearch = allFetchedUsers || [];
    const filtered = usersToSearch.filter((user) => user && user.fullName && user.militaryId
            && (user.fullName.toLowerCase().includes(searchTerm)
            || user.militaryId.toLowerCase().includes(searchTerm)));
    loadUsersTable(filtered);
  });
}

// Handle action button clicks with event delegation (avoids inline onclick issues)
const usersTableBody = document.getElementById('usersTableBody');
if (usersTableBody) {
  usersTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button.action-btn');
    if (!button) return;

    const action = button.dataset.action;
    const militaryId = button.dataset.militaryId;
    if (!action || !militaryId) return;

    if (action === 'view') {
      viewUserDetail(militaryId);
      return;
    }

    if (action === 'edit') {
      editUser(militaryId);
      return;
    }

    if (action === 'approve') {
      approveUser(militaryId);
      return;
    }

    if (action === 'reject') {
      rejectUser(militaryId);
    }
  });
}

// View user detail
async function viewUserDetail(militaryId) {
  const usersToSearch = allFetchedUsers || [];
  let user = usersToSearch.find((u) => u.militaryId === militaryId);

  // Always try to load freshest user record for image/status updates
  try {
    const adminToken = getCookie('adminToken');
    const response = await fetch(`${API_BASE}/api/admin/user/${militaryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
      },
    });
    if (response.ok) {
      const latestUser = await response.json();
      if (latestUser && latestUser.militaryId) {
        user = latestUser;
        const existingIndex = allFetchedUsers.findIndex((u) => u.militaryId === militaryId);
        if (existingIndex >= 0) {
          allFetchedUsers[existingIndex] = latestUser;
        } else {
          allFetchedUsers.unshift(latestUser);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch latest user detail, using cached data:', error.message);
  }

  if (!user) return;

  currentSelectedUser = user;

  // Hide delete button by default (shown only when editing)
  const deleteBtn = document.getElementById('deleteUserBtn');
  if (deleteBtn) {
    deleteBtn.style.display = 'none';
  }

  // Populate modal
  document.getElementById('userDetailPicture').src = user.photoUrl || user.passportPicture || '../assets/default-avatar.png';
  document.getElementById('userDetailName').textContent = user.fullName;
  document.getElementById('userDetailMilID').textContent = user.militaryId;
  document.getElementById('userDetailEmail').textContent = user.email;
  document.getElementById('userDetailMobile').textContent = user.mobile;
  document.getElementById('userDetailDOB').textContent = user.dob;
  document.getElementById('userDetailRank').textContent = user.rank || 'N/A';
  document.getElementById('userDetailCreated').textContent = user.accountCreated;
  renderVerificationImageSection(user);

  // Status buttons
  const activateBtn = document.getElementById('activateUserBtn');
  const deactivateBtn = document.getElementById('deactivateUserBtn');
  
  if (activateBtn && deactivateBtn) {
    const isActive = user.status === 'ACTIVE' || user.status === 'active';
    
    // Update button states
    if (isActive) {
      activateBtn.classList.add('active');
      deactivateBtn.classList.remove('active');
    } else {
      deactivateBtn.classList.add('active');
      activateBtn.classList.remove('active');
    }
  }

  // Show photo approval section if photo is pending
  const photoApprovalSection = document.getElementById('photoApprovalSection');
  if (user.photoStatus === 'pending') {
    photoApprovalSection.style.display = 'block';
    const statusLabel = document.getElementById('photoStatusLabel');
    statusLabel.textContent = 'Pending Approval';
  } else if (user.photoStatus === 'approved') {
    photoApprovalSection.style.display = 'none';
  } else {
    // Default: show for new users
    photoApprovalSection.style.display = 'block';
  }

  // Load and display user procedures
  displayUserProcedures(user);

  // Show modal
  userDetailModal.classList.add('show');
  userDetailModal.style.display = 'flex';
}

function normalizeStatusLabel(value, fallback = 'N/A') {
  if (!value) return fallback;
  const normalized = value.toString().replace(/-/g, ' ').trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function renderVerificationImage(previewId, imageUrl, altText) {
  const preview = document.getElementById(previewId);
  if (!preview) return;

  if (imageUrl) {
    preview.innerHTML = `<img src="${imageUrl}" alt="${altText}" onclick="openImageViewer('${imageUrl}')">`;
  } else {
    preview.textContent = 'No image uploaded';
  }
}

function renderVerificationImageSection(user) {
  const profileImage = user.photoUrl || user.passportPicture || user.profilePicture || '';
  const driverFront = user.driverLicenseFront || '';
  const driverBack = user.driverLicenseBack || '';
  const facePhoto = user.faceVerificationPhotoUrl || '';

  renderVerificationImage('userProfileImagePreview', profileImage, 'Profile Picture');
  renderVerificationImage('userDriverFrontPreview', driverFront, 'Driver License Front');
  renderVerificationImage('userDriverBackPreview', driverBack, 'Driver License Back');
  renderVerificationImage('userFaceVerificationPreview', facePhoto, 'Live Face Verification');

  const driverStatusText = document.getElementById('userDriverLicenseStatus');
  if (driverStatusText) {
    driverStatusText.textContent = `Driver license status: ${normalizeStatusLabel(user.driverLicenseStatus, 'Not uploaded')}`;
  }

  const faceStatusText = document.getElementById('userFaceVerificationStatus');
  if (faceStatusText) {
    faceStatusText.textContent = `Face verification status: ${normalizeStatusLabel(user.faceVerificationStatus, 'Not uploaded')}`;
  }
}

function formatDateForDisplay(dateValue) {
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

function formatDateForInput(dateValue) {
  if (!dateValue) return '';

  if (typeof dateValue === 'string') {
    const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    }
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return '';

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Display user procedures in the modal
function displayUserProcedures(user) {
  const proceduresContainer = document.getElementById('proceduresContainer');

  if (!user.procedures || user.procedures.length === 0) {
    proceduresContainer.innerHTML = '<p style="color: #999; padding: 10px;">No procedures yet</p>';
    return;
  }

  const formatStatus = (value) => {
    const statusValue = (value || 'pending').toString().toLowerCase();
    if (statusValue === 'in-progress') return 'In-Progress';
    return statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
  };

  proceduresContainer.innerHTML = user.procedures.map((proc, index) => `
        <div class="procedure-item">
            <div class="procedure-item-content">
                <div class="procedure-item-name">${proc.name}</div>
                <div class="procedure-item-requirements">${proc.description || proc.requirements || ''}</div>
                <div style="color: #666; font-size: 12px; margin-top: 6px;">
                    Status: ${formatStatus(proc.status)} · Updated: ${formatDateForDisplay(proc.dateUpdated || proc.assignedDate)} · Due: ${formatDateForDisplay(proc.dueDate)}
                </div>
            </div>
            <div class="procedure-actions">
              <button class="procedure-edit-btn" onclick="editProcedure('${user.militaryId}', ${index})">
                  <i class="fas fa-edit"></i> Edit
              </button>
              <button class="procedure-delete-btn" onclick="deleteProcedure('${user.militaryId}', ${index})">
                  <i class="fas fa-trash"></i> Delete
              </button>
            </div>
        </div>
    `).join('');
}

// Edit user
// eslint-disable-next-line no-unused-vars
function editUser(militaryId) {
  viewUserDetail(militaryId);
  // Show delete button when editing
  const deleteBtn = document.getElementById('deleteUserBtn');
  if (deleteBtn) {
    deleteBtn.style.display = 'block';
  }
  // Focus on edit section
  setTimeout(() => {
    document.querySelector('.status-control').scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

// Edit procedure (prefill form)
// eslint-disable-next-line no-unused-vars
function editProcedure(militaryId, procedureIndex) {
  const user = (allFetchedUsers || []).find((u) => u.militaryId === militaryId);
  if (!user || !user.procedures || !user.procedures[procedureIndex]) return;

  const proc = user.procedures[procedureIndex];
  document.getElementById('targetUserId').value = militaryId;
  document.getElementById('procedureName').value = proc.name || '';
  document.getElementById('procedureRequirements').value = proc.description || proc.requirements || '';
  document.getElementById('procedureStatus').value = (proc.status || 'pending').toLowerCase();
  document.getElementById('procedureDueDate').value = formatDateForInput(proc.dueDate);
  document.getElementById('procedureDateUpdated').value = formatDateForInput(proc.dateUpdated || proc.assignedDate);
  document.getElementById('procedureIndex').value = procedureIndex;
  document.getElementById('procedureSubmitBtn').textContent = 'Update Procedure';

  setTimeout(() => {
    document.getElementById('procedureName')?.scrollIntoView({ behavior: 'smooth' });
  }, 150);
}

// Delete user button event listener
document.getElementById('deleteUserBtn')?.addEventListener('click', () => {
  if (currentSelectedUser) {
    deleteUser(currentSelectedUser.id);
  }
});

// Delete user function
function deleteUser(userId) {
  const usersToSearch = allFetchedUsers || [];
  const user = usersToSearch.find((u) => u.id === userId);
  if (!user) return;

  const confirmed = confirm(`Are you absolutely sure you want to delete ${user.fullName} (${user.militaryId})? This action is PERMANENT and cannot be undone.`);

  if (!confirmed) return;

  const doubleConfirm = confirm(`This will permanently delete all data for ${user.fullName}. This action is IRREVERSIBLE.`);
  if (!doubleConfirm) return;

  // Get admin token from cookie
  const adminToken = getCookie('adminToken');

  // Call backend API to delete user
  fetch(`${API_BASE}/api/admin/user/${user.militaryId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('✅ User deleted successfully:', data);

      // Close modal
      if (userDetailModal) {
        userDetailModal.classList.remove('show');
        userDetailModal.style.display = 'none';
      }

      // Refresh user list from backend
      fetchAndLoadUsers();

      showNotification(`${user.fullName} has been permanently deleted from the system.`);
    })
    .catch((error) => {
      console.error('❌ Error deleting user:', error);
      showNotification('Failed to delete user. Please try again.');
    });
}

function updateUserStatus(newStatus) {
  if (!currentSelectedUser) return;

  const adminToken = getCookie('adminToken');
  const militaryId = currentSelectedUser.militaryId;

  fetch(`${API_BASE}/api/admin/user/${militaryId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
    },
    body: JSON.stringify({ status: newStatus }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log('✅ User status updated:', newStatus);
        currentSelectedUser.status = newStatus;
        
        // Update button states
        const activateBtn = document.getElementById('activateUserBtn');
        const deactivateBtn = document.getElementById('deactivateUserBtn');
        
        if (newStatus === 'ACTIVE') {
          activateBtn.classList.add('active');
          deactivateBtn.classList.remove('active');
        } else {
          deactivateBtn.classList.add('active');
          activateBtn.classList.remove('active');
        }
        
        showNotification(`User status updated to ${newStatus}`, 'success');
        fetchAndLoadUsers(); // Refresh the user list
      } else {
        showNotification('Failed to update user status', 'error');
      }
    })
    .catch((error) => {
      console.error('❌ Error updating status:', error);
      showNotification('Failed to update user status', 'error');
    });
}

// Delete procedure function
// eslint-disable-next-line no-unused-vars
function deleteProcedure(militaryId, procedureIndex) {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure you want to delete this procedure? This action cannot be undone.')) {
    const user = (allFetchedUsers || []).find((u) => u.militaryId === militaryId);
    if (user && user.procedures) {
      user.procedures.splice(procedureIndex, 1);
      displayUserProcedures(user);
      console.log('✅ Procedure deleted for user:', militaryId);

      // Send deletion to backend
      const adminToken = getCookie('adminToken');
      fetch(`${API_BASE}/api/user/${militaryId}/procedure/${procedureIndex}`, {
        method: 'DELETE',
        headers: {
          ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
        },
      })
        .then((response) => response.json())
        .then((data) => console.log('✅ Procedure deleted on server:', data))
        .catch((error) => console.error('❌ Error deleting procedure:', error));
    }
  }
}

// Photo approval functions
document.getElementById('approvePhotoBtn')?.addEventListener('click', () => {
  if (currentSelectedUser) {
    currentSelectedUser.photoStatus = 'approved';
    document.getElementById('photoApprovalSection').style.display = 'none';
    console.log('✅ Photo approved for:', currentSelectedUser.fullName);

    // Send approval to backend
    fetch(`/api/user/${currentSelectedUser.militaryId}/photo/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log('✅ Photo approved on server:', data))
      .catch((error) => console.error('❌ Error approving photo:', error));
  }
});

document.getElementById('rejectPhotoBtn')?.addEventListener('click', () => {
  if (currentSelectedUser) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      currentSelectedUser.photoStatus = 'rejected';
      document.getElementById('photoApprovalSection').style.display = 'none';
      console.log('✅ Photo rejected for:', currentSelectedUser.fullName, 'Reason:', reason);

      // Send rejection to backend
      fetch(`/api/user/${currentSelectedUser.militaryId}/photo/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          reason,
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log('✅ Photo rejected on server:', data))
        .catch((error) => console.error('❌ Error rejecting photo:', error));
    }
  }
});

// Close user detail modal
closeUserDetailModal.addEventListener('click', () => {
  userDetailModal.classList.remove('show');
  userDetailModal.style.display = 'none';
});

document.getElementById('closeUserDetailBtn').addEventListener('click', () => {
  userDetailModal.classList.remove('show');
  userDetailModal.style.display = 'none';
});

// Status buttons event listeners
const activateUserBtn = document.getElementById('activateUserBtn');
const deactivateUserBtn = document.getElementById('deactivateUserBtn');

if (activateUserBtn) {
  activateUserBtn.addEventListener('click', () => {
    updateUserStatus('ACTIVE');
  });
}

if (deactivateUserBtn) {
  deactivateUserBtn.addEventListener('click', () => {
    updateUserStatus('INACTIVE');
  });
}

// Compose email
composeEmailBtn.addEventListener('click', () => {
  emailForm.reset();
  emailModal.classList.add('show');
  emailModal.style.display = 'flex';
});

closeEmailModal.addEventListener('click', () => {
  emailModal.classList.remove('show');
  emailModal.style.display = 'none';
});

cancelEmailBtn.addEventListener('click', () => {
  emailModal.classList.remove('show');
  emailModal.style.display = 'none';
});

// Email form submit
emailForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const to = document.getElementById('emailTo').value;
  const subject = document.getElementById('emailSubject').value;
  // Email body available for future API integration

  console.log('Email sent to:', to, 'Subject:', subject);
  // eslint-disable-next-line no-alert
  showNotification(`Email sent successfully to ${to}`);

  emailForm.reset();
  emailModal.classList.remove('show');
  emailModal.style.display = 'none';
});

// Procedure form submit
procedureForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const targetUserId = document.getElementById('targetUserId').value;
  const procedureName = document.getElementById('procedureName').value;
  const procedureRequirements = document.getElementById('procedureRequirements').value;
  const procedureStatus = document.getElementById('procedureStatus').value || 'pending';
  const procedureDueDate = document.getElementById('procedureDueDate').value || '';
  const procedureDateUpdated = document.getElementById('procedureDateUpdated').value || '';
  const procedureIndex = document.getElementById('procedureIndex').value;

  if (!targetUserId) {
    showNotification('Please select a user to assign the procedure to');
    return;
  }

  if (!procedureName || !procedureRequirements) {
    showNotification('Please fill in all procedure fields');
    return;
  }

  // Find the selected user
  const selectedUser = allFetchedUsers.find(user => user.militaryId === targetUserId);
  if (!selectedUser) {
    showNotification('Selected user not found');
    return;
  }

  // Initialize procedures array if it doesn't exist
  if (!selectedUser.procedures) {
    selectedUser.procedures = [];
  }

  const isEditing = procedureIndex !== '' && procedureIndex !== null && procedureIndex !== undefined;

  if (isEditing) {
    const idx = parseInt(procedureIndex, 10);
    if (!Number.isNaN(idx) && selectedUser.procedures[idx]) {
      selectedUser.procedures[idx] = {
        ...selectedUser.procedures[idx],
        name: procedureName,
        description: procedureRequirements,
        status: procedureStatus,
        dueDate: procedureDueDate || null,
        dateUpdated: procedureDateUpdated || null,
      };
    }
  } else {
    // Add new procedure
    selectedUser.procedures.push({
      name: procedureName,
      description: procedureRequirements,
      assignedDate: new Date(),
      status: procedureStatus,
      dueDate: procedureDueDate || null,
      dateUpdated: procedureDateUpdated || new Date(),
    });
  }

  // Clear form
  procedureForm.reset();
  document.getElementById('procedureIndex').value = '';
  document.getElementById('procedureSubmitBtn').textContent = 'Add Procedure';

  // Update display if this user is currently being viewed
  if (currentSelectedUser && currentSelectedUser.militaryId === selectedUser.militaryId) {
    displayUserProcedures(selectedUser);
  }

  console.log(`✅ Procedure ${isEditing ? 'updated' : 'added'} for user:`, selectedUser.militaryId);
  showNotification(`Procedure "${procedureName}" ${isEditing ? 'updated' : 'added'} successfully for ${selectedUser.fullName}`);

  // Send to backend
  const adminToken = getCookie('adminToken');
  const url = isEditing
    ? `${API_BASE}/api/user/${selectedUser.militaryId}/procedure/${procedureIndex}`
    : `${API_BASE}/api/user/${selectedUser.militaryId}/procedure`;
  const method = isEditing ? 'PUT' : 'POST';

  fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
    },
    body: JSON.stringify({
      name: procedureName,
      requirements: procedureRequirements,
      status: procedureStatus,
      dueDate: procedureDueDate || null,
      dateUpdated: procedureDateUpdated || null,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(`✅ Procedure ${isEditing ? 'updated' : 'added'} on server:`, data);
      // Refresh the users list to get updated data
      fetchAndLoadUsers();
    })
    .catch((error) => {
      console.error(`❌ Error ${isEditing ? 'updating' : 'adding'} procedure:`, error);
      showNotification(`Failed to ${isEditing ? 'update' : 'add'} procedure on server. Please try again.`);
    });
});

// Admin menu
if (adminMenuBtn && adminMenuDropdown) {
  adminMenuBtn.addEventListener('click', () => {
    adminMenuDropdown.classList.toggle('hidden-display');
  });
}

// Spouse edit option
if (spouseEditOption && adminMenuDropdown) {
  spouseEditOption.addEventListener('click', () => {
    adminMenuDropdown.classList.add('hidden-display');
    openSpouseEditModal();
  });
}

// Users procedures option
if (userProceduresOption && adminMenuDropdown) {
  userProceduresOption.addEventListener('click', () => {
    adminMenuDropdown.classList.add('hidden-display');
    openUserProceduresModal();
  });
}

// Spouse edit modal
function renderSpouseUsersList(users = []) {
  const usersList = document.getElementById('spouseUsersList');
  if (!usersList) return;

  usersList.innerHTML = '';

  if (!users.length) {
    usersList.innerHTML = '<div class="table-empty-state">No users found</div>';
    return;
  }

  users.forEach((user) => {
    const item = document.createElement('div');
    const picture = user.photoUrl || user.passportPicture || '../assets/default-avatar.png';
    item.className = 'spouse-user-item';
    item.innerHTML = `
            <img src="${picture}" alt="Profile" class="spouse-user-avatar">
            <div>
                <div class="procedure-user-name">${user.fullName || 'N/A'}</div>
                <div style="color: #666; font-size: 12px;">${user.militaryId || ''}</div>
            </div>
        `;
    item.addEventListener('click', () => {
      openSpouseEditForm(user);
    });
    usersList.appendChild(item);
  });
}

function openSpouseEditModal() {
  currentSpouseUser = null;
  const spouseSearch = document.getElementById('spouseSearch');
  const spouseUsersList = document.getElementById('spouseUsersList');
  const spouseEditForm = document.getElementById('spouseEditForm');

  if (spouseSearch) spouseSearch.value = '';
  if (spouseUsersList) spouseUsersList.classList.remove('hidden-display');
  if (spouseEditForm) spouseEditForm.classList.add('hidden-display');

  renderSpouseUsersList(allFetchedUsers || []);

  spouseEditModal.classList.add('show');
  spouseEditModal.style.display = 'flex';
}

function openSpouseEditForm(user) {
  currentSpouseUser = user;
  const spouseUsersList = document.getElementById('spouseUsersList');
  const spouseEditForm = document.getElementById('spouseEditForm');
  if (spouseUsersList) spouseUsersList.classList.add('hidden-display');
  if (spouseEditForm) spouseEditForm.classList.remove('hidden-display');

  // Populate form with user's spouse data
  const spouse = user.spouse || {};
  const spouseDobValue = spouse.dob ? new Date(spouse.dob) : null;
  const spouseDobInputValue = spouseDobValue && !Number.isNaN(spouseDobValue.getTime())
    ? spouseDobValue.toISOString().slice(0, 10)
    : '';
  document.getElementById('adminSpouseFullName').value = spouse.fullName || spouse.name || '';
  document.getElementById('adminSpouseMobile').value = spouse.mobile || '';
  document.getElementById('adminSpouseDOB').value = spouseDobInputValue;
  document.getElementById('adminSpouseOccupation').value = spouse.occupation || '';
  document.getElementById('adminSpouseAddress').value = spouse.address || '';
  document.getElementById('adminSpouseEmail').value = spouse.email || '';

  const passportPreview = document.getElementById('adminSpousePassportPreview');
  if (passportPreview) {
    const spousePassport =
      spouse.passportPicture
      || spouse.photoUrl
      || '';
    passportPreview.innerHTML = spousePassport
      ? `<img src="${spousePassport}" alt="Spouse Passport" class="passport-preview">`
      : '<p>No document uploaded</p>';
  }
}

document.getElementById('adminSpousePassport')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  const passportPreview = document.getElementById('adminSpousePassportPreview');
  if (!passportPreview) return;
  if (!file) {
    passportPreview.innerHTML = '<p>No document uploaded</p>';
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    passportPreview.innerHTML = `<img src="${event.target.result}" alt="Spouse Passport" class="passport-preview">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('spouseSearch')?.addEventListener('input', (e) => {
  const term = (e.target.value || '').trim().toLowerCase();
  const filteredUsers = (allFetchedUsers || []).filter((user) => {
    const fullName = (user.fullName || '').toLowerCase();
    const militaryId = (user.militaryId || '').toLowerCase();
    return fullName.includes(term) || militaryId.includes(term);
  });
  renderSpouseUsersList(filteredUsers);
});

document.getElementById('spouseSearch')?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();

  const rawTerm = (e.target.value || '').trim();
  if (!rawTerm) return;

  const normalizedTerm = rawTerm.toUpperCase();
  const exactUser = (allFetchedUsers || []).find(
    (user) => (user.militaryId || '').toUpperCase() === normalizedTerm
  );

  if (exactUser) {
    openSpouseEditForm(exactUser);
  } else {
    showNotification(`No exact match found for ${rawTerm}`, 'warning');
  }
});

document.getElementById('backToSpouseListBtn')?.addEventListener('click', () => {
  document.getElementById('spouseUsersList')?.classList.remove('hidden-display');
  document.getElementById('spouseEditForm')?.classList.add('hidden-display');
});

spouseAdminForm?.addEventListener('submit', async (e) => {
  try {
    e.preventDefault();
    if (!currentSpouseUser || !currentSpouseUser.militaryId) {
      showNotification('Select a user first.');
      return;
    }

    const adminToken = getCookie('adminToken');
    const passportFile = document.getElementById('adminSpousePassport')?.files?.[0];
    let spousePassportPicture = currentSpouseUser?.spouse?.passportPicture
      || currentSpouseUser?.spouse?.photoUrl
      || '';

    if (passportFile) {
      spousePassportPicture = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('Failed to read passport image'));
        reader.readAsDataURL(passportFile);
      });
    }

    const spousePayload = {
      fullName: document.getElementById('adminSpouseFullName').value.trim(),
      name: document.getElementById('adminSpouseFullName').value.trim(),
      mobile: document.getElementById('adminSpouseMobile').value.trim(),
      dob: document.getElementById('adminSpouseDOB').value || null,
      occupation: document.getElementById('adminSpouseOccupation').value.trim(),
      address: document.getElementById('adminSpouseAddress').value.trim(),
      email: document.getElementById('adminSpouseEmail').value.trim(),
      passportPicture: spousePassportPicture || null,
      photoUrl: spousePassportPicture || null,
    };

    const response = await fetch(`${API_BASE}/api/admin/spouse/${currentSpouseUser.militaryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
      },
      body: JSON.stringify(spousePayload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update spouse information');
    }

    currentSpouseUser.spouse = data.spouse || spousePayload;
    showNotification('Spouse information updated successfully', 'success');
    document.getElementById('spouseUsersList')?.classList.remove('hidden-display');
    document.getElementById('spouseEditForm')?.classList.add('hidden-display');
    fetchAndLoadUsers();
  } catch (error) {
    console.error('❌ Spouse update failed:', error);
    showNotification(error.message || 'Failed to update spouse information', 'error');
  }
});

closeSpouseEditModal?.addEventListener('click', () => {
  spouseEditModal.classList.remove('show');
  spouseEditModal.style.display = 'none';
  document.getElementById('spouseUsersList')?.classList.remove('hidden-display');
  document.getElementById('spouseEditForm')?.classList.add('hidden-display');
});

// User procedures modal
function renderProcedureUsersList(users = []) {
  const usersList = document.getElementById('procedureUsersList');
  if (!usersList) return;

  usersList.innerHTML = '';

  if (!users.length) {
    usersList.innerHTML = '<div class="table-empty-state">No users found</div>';
    return;
  }

  users.forEach((user) => {
    const item = document.createElement('div');
    item.className = 'procedure-user-item';
    item.innerHTML = `
            <div class="procedure-user-name">${user.fullName || 'N/A'}</div>
            <div style="color: #666; font-size: 12px;">${user.militaryId || ''}</div>
        `;
    item.addEventListener('click', () => {
      openProcedureForm(user);
    });
    usersList.appendChild(item);
  });
}

function openUserProceduresModal() {
  currentProcedureUser = null;
  const procedureUserSearch = document.getElementById('procedureUserSearch');
  const procedureUsersList = document.getElementById('procedureUsersList');
  const procedureFormContainer = document.getElementById('procedureFormContainer');

  if (procedureUserSearch) procedureUserSearch.value = '';
  if (procedureUsersList) procedureUsersList.classList.remove('hidden-display');
  if (procedureFormContainer) procedureFormContainer.classList.add('hidden-display');

  renderProcedureUsersList(allFetchedUsers || []);

  userProceduresModal.classList.add('show');
  userProceduresModal.style.display = 'flex';
}

function openProcedureForm(user) {
  currentProcedureUser = user;
  document.getElementById('procedureUsersList')?.classList.add('hidden-display');
  document.getElementById('procedureFormContainer')?.classList.remove('hidden-display');
  document.getElementById('procUserName').value = user.fullName;
  document.getElementById('adminProcedureForm')?.reset();
  document.getElementById('procUserName').value = user.fullName;
  document.getElementById('procDateUpdated').value = formatDateForInput(new Date());
}

document.getElementById('procedureUserSearch')?.addEventListener('input', (e) => {
  const term = (e.target.value || '').trim().toLowerCase();
  const filteredUsers = (allFetchedUsers || []).filter((user) => {
    const fullName = (user.fullName || '').toLowerCase();
    const militaryId = (user.militaryId || '').toLowerCase();
    return fullName.includes(term) || militaryId.includes(term);
  });
  renderProcedureUsersList(filteredUsers);
});

document.getElementById('procedureUserSearch')?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();

  const rawTerm = (e.target.value || '').trim();
  if (!rawTerm) return;

  const normalizedTerm = rawTerm.toUpperCase();
  const exactUser = (allFetchedUsers || []).find(
    (user) => (user.militaryId || '').toUpperCase() === normalizedTerm
  );

  if (exactUser) {
    openProcedureForm(exactUser);
  } else {
    showNotification(`No exact match found for ${rawTerm}`, 'warning');
  }
});

document.getElementById('backToProcedureListBtn')?.addEventListener('click', () => {
  document.getElementById('procedureUsersList')?.classList.remove('hidden-display');
  document.getElementById('procedureFormContainer')?.classList.add('hidden-display');
});

adminProcedureForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentProcedureUser || !currentProcedureUser.militaryId) {
    showNotification('Select a user first.');
    return;
  }

  const adminToken = getCookie('adminToken');
  const rawStatus = document.getElementById('procStatus').value;
  const statusMap = {
    Pending: 'pending',
    'In Progress': 'in-progress',
    Completed: 'completed',
  };

  const payload = {
    name: document.getElementById('procProcedureName').value.trim(),
    requirements: document.getElementById('procRequirements').value.trim(),
    status: statusMap[rawStatus] || 'pending',
    dueDate: document.getElementById('procDueDate').value || null,
    dateUpdated: document.getElementById('procDateUpdated').value || null,
  };

  try {
    const response = await fetch(`${API_BASE}/api/user/${currentProcedureUser.militaryId}/procedure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to add procedure');
    }

    showNotification('Procedure added successfully', 'success');
    document.getElementById('procedureUsersList')?.classList.remove('hidden-display');
    document.getElementById('procedureFormContainer')?.classList.add('hidden-display');
    fetchAndLoadUsers();
  } catch (error) {
    console.error('❌ Procedure add failed:', error);
    showNotification(error.message || 'Failed to add procedure', 'error');
  }
});

closeUserProceduresModal?.addEventListener('click', () => {
  userProceduresModal.classList.remove('show');
  userProceduresModal.style.display = 'none';
  document.getElementById('procedureUsersList')?.classList.remove('hidden-display');
  document.getElementById('procedureFormContainer')?.classList.add('hidden-display');
});

// Logout
if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', () => {
    adminLogoutModal.classList.add('show');
    adminLogoutModal.style.display = 'flex';
  });
}

if (confirmAdminLogoutBtn) {
  confirmAdminLogoutBtn.addEventListener('click', async () => {
    // Clear admin session cookies
    document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'adminEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    await showNotification('Admin logged out successfully', 'success', 'Logged Out');
    window.location.href = './index.html';
  });
}

if (cancelAdminLogoutBtn) {
  cancelAdminLogoutBtn.addEventListener('click', () => {
    adminLogoutModal.classList.remove('show');
    adminLogoutModal.style.display = 'none';
  });
}

// Close modals on outside click
window.addEventListener('click', (e) => {
  if (e.target === emailModal) {
    emailModal.classList.remove('show');
    emailModal.style.display = 'none';
  }
  if (e.target === userDetailModal) {
    userDetailModal.classList.remove('show');
    userDetailModal.style.display = 'none';
  }
  if (e.target === spouseEditModal) {
    spouseEditModal.classList.remove('show');
    spouseEditModal.style.display = 'none';
    document.getElementById('spouseUsersList')?.classList.remove('hidden-display');
    document.getElementById('spouseEditForm')?.classList.add('hidden-display');
  }
  if (e.target === userProceduresModal) {
    userProceduresModal.classList.remove('show');
    userProceduresModal.style.display = 'none';
    document.getElementById('procedureUsersList')?.classList.remove('hidden-display');
    document.getElementById('procedureFormContainer')?.classList.add('hidden-display');
  }
  if (e.target === adminLogoutModal) {
    adminLogoutModal.classList.remove('show');
    adminLogoutModal.style.display = 'none';
  }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (adminMenuDropdown && !e.target.closest('.admin-menu')) {
    adminMenuDropdown.classList.add('hidden-display');
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUsersTable();
});

// ========================================
// IMAGE VIEWER FUNCTIONALITY
// ========================================

// Function to open image viewer - queries elements each time to avoid initialization issues
// eslint-disable-next-line no-unused-vars
function openImageViewer(imageSrc) {
  const imageViewerModal = document.getElementById('imageViewerModal');
  const fullSizeImage = document.getElementById('fullSizeImage');
  
  if (!imageSrc || imageSrc.includes('default-avatar')) {
    showNotification('No profile picture available');
    return;
  }
  
  activeViewerImageSrc = imageSrc;
  if (fullSizeImage) fullSizeImage.src = imageSrc;
  resetImageViewerZoom();
  
  if (imageViewerModal) {
    imageViewerModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

function applyImageViewerScale() {
  const fullSizeImage = document.getElementById('fullSizeImage');
  if (fullSizeImage) {
    fullSizeImage.style.transform = `scale(${imageViewerScale})`;
  }
}

function setImageViewerScale(nextScale) {
  imageViewerScale = Math.min(IMAGE_VIEWER_MAX_SCALE, Math.max(IMAGE_VIEWER_MIN_SCALE, nextScale));
  applyImageViewerScale();
}

// eslint-disable-next-line no-unused-vars
function zoomInImageViewer(event) {
  if (event) event.stopPropagation();
  setImageViewerScale(imageViewerScale + IMAGE_VIEWER_SCALE_STEP);
}

// eslint-disable-next-line no-unused-vars
function zoomOutImageViewer(event) {
  if (event) event.stopPropagation();
  setImageViewerScale(imageViewerScale - IMAGE_VIEWER_SCALE_STEP);
}

// eslint-disable-next-line no-unused-vars
function resetImageViewerZoom(event) {
  if (event) event.stopPropagation();
  setImageViewerScale(1);
}

// eslint-disable-next-line no-unused-vars
async function downloadActiveViewerImage(event) {
  if (event) event.stopPropagation();

  if (!activeViewerImageSrc) {
    showNotification('No image available to download.');
    return;
  }

  const fileNameFromUrl = activeViewerImageSrc.split('/').pop()?.split('?')[0];
  const safeFileName = fileNameFromUrl || `verification-image-${Date.now()}.jpg`;

  try {
    const response = await fetch(activeViewerImageSrc, { mode: 'cors' });
    if (!response.ok) throw new Error('Image fetch failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = safeFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.warn('Direct download fallback used:', error);
    window.open(activeViewerImageSrc, '_blank', 'noopener,noreferrer');
    showNotification('Download opened in a new tab. Save the image from there if auto-download is blocked.');
  }
}

// Close image viewer
document.addEventListener('DOMContentLoaded', () => {
  const imageViewerModal = document.getElementById('imageViewerModal');
  const closeImageViewer = document.getElementById('closeImageViewer');
  const fullSizeImage = document.getElementById('fullSizeImage');
  const zoomInImageBtn = document.getElementById('zoomInImageBtn');
  const zoomOutImageBtn = document.getElementById('zoomOutImageBtn');
  const resetZoomImageBtn = document.getElementById('resetZoomImageBtn');
  const downloadImageBtn = document.getElementById('downloadImageBtn');
  
  if (closeImageViewer) {
    closeImageViewer.addEventListener('click', () => {
      imageViewerModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      resetImageViewerZoom();
    });
  }

  // Close on background click
  if (imageViewerModal) {
    imageViewerModal.addEventListener('click', (e) => {
      if (e.target === imageViewerModal) {
        imageViewerModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetImageViewerZoom();
      }
    });
  }

  if (zoomInImageBtn) {
    zoomInImageBtn.addEventListener('click', (e) => {
      zoomInImageViewer(e);
    });
  }

  if (zoomOutImageBtn) {
    zoomOutImageBtn.addEventListener('click', (e) => {
      zoomOutImageViewer(e);
    });
  }

  if (resetZoomImageBtn) {
    resetZoomImageBtn.addEventListener('click', (e) => {
      resetImageViewerZoom();
    });
  }

  if (downloadImageBtn) {
    downloadImageBtn.addEventListener('click', (e) => {
      downloadActiveViewerImage(e);
    });
  }

  if (fullSizeImage) {
    fullSizeImage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      setImageViewerScale(imageViewerScale + (direction * IMAGE_VIEWER_SCALE_STEP));
    }, { passive: false });
  }

  // Make user detail picture clickable
  const userDetailPicture = document.getElementById('userDetailPicture');
  if (userDetailPicture) {
    userDetailPicture.style.cursor = 'pointer';
    userDetailPicture.addEventListener('click', () => {
      openImageViewer(userDetailPicture.src);
    });
  }
});

// Close on ESC key
document.addEventListener('keydown', (e) => {
  const imageViewerModal = document.getElementById('imageViewerModal');
  if (e.key === 'Escape' && imageViewerModal && imageViewerModal.style.display === 'block') {
    imageViewerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetImageViewerZoom();
  }
});

// Approve user account
async function approveUser(militaryId) {
  if (!confirm(`Are you sure you want to APPROVE this user account?\n\nMilitary ID: ${militaryId}\n\nThe user will be able to log in and access their dashboard.`)) {
    return;
  }

  const adminToken = getCookie('adminToken');
  if (!adminToken) {
    showNotification('Authentication required. Please log in again.');
    window.location.href = './admin-login.html';
    return;
  }

  try {
    console.log(`🔄 Approving user: ${militaryId}`);

    const response = await fetch(`${API_BASE}/api/admin/user/${militaryId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ User approved successfully:', data);
      showNotification(`✅ User approved successfully!\n\n${data.user.fullName} can now log in to their account.`);
      
      // Refresh the users list
      fetchAndLoadUsers();
    } else {
      console.error('❌ Approval failed:', data);
      showNotification(`Failed to approve user: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Error approving user:', error);
    showNotification(`Error: ${error.message}`);
  }
}

// Reject user account (delete)
async function rejectUser(militaryId) {
  const usersToSearch = allFetchedUsers || [];
  const user = usersToSearch.find((u) => u.militaryId === militaryId);
  
  if (!user) {
    showNotification('User not found');
    return;
  }

  if (!confirm(`Are you sure you want to REJECT and DELETE this user account?\n\nUser: ${user.fullName}\nMilitary ID: ${militaryId}\n\n⚠️ THIS ACTION CANNOT BE UNDONE!\n\nThe user will be permanently removed from the system.`)) {
    return;
  }

  const adminToken = getCookie('adminToken');
  if (!adminToken) {
    showNotification('Authentication required. Please log in again.');
    window.location.href = './admin-login.html';
    return;
  }

  try {
    console.log(`🗑️ Rejecting and deleting user: ${militaryId}`);

    const response = await fetch(`${API_BASE}/api/admin/user/${militaryId}/reject`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ User rejected and deleted:', data);
      showNotification(`✅ User rejected and removed from system.\n\n${data.deletedUser.fullName} has been permanently deleted.`);
      
      // Refresh the users list
      fetchAndLoadUsers();
    } else {
      console.error('❌ Rejection failed:', data);
      showNotification(`Failed to reject user: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Error rejecting user:', error);
    showNotification(`Error: ${error.message}`);
  }
}
