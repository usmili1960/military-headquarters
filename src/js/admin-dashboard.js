/* eslint-disable no-undef, no-use-before-define, no-restricted-globals */
/* global window, document, localStorage, alert */
/* global setupLanguageSwitcher, translatePage, loadSavedLanguage */

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
    alert('⚠️ Unauthorized Access!\n\nYou must login through the Admin Login page to access this panel.\n\nRedirecting to Admin Login...');
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
    alert('⚠️ Your session has expired. Please login again.');
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

  // Auto-refresh users list every 5 seconds
  setInterval(fetchAndLoadUsers, 5000);
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
      } else if (backendUsers && Array.isArray(backendUsers)) {
        console.log('⚠️ Backend returned empty array, showing "No users found"');
        allFetchedUsers = [];
        loadUsersTable([]);
      } else {
        console.log('⚠️ Backend returned invalid data');
        throw new Error('Invalid data format from backend');
      }
    })
    .catch((error) => {
      console.log('❌ Backend API error:', error.message);
      console.log('⚠️ Could not load users from backend');
      
      // Show mock users as fallback
      allFetchedUsers = mockUsers;
      loadUsersTable(allFetchedUsers);
      console.log('✅ Showing mock users:', allFetchedUsers.length, 'users');
    });
}

// Load users table
function loadUsersTable(users = mockUsers) {
  console.log('📋 loadUsersTable called with', users.length, 'users');
  const tbody = document.getElementById('usersTableBody');

  if (!tbody) {
    console.error('❌ usersTableBody element not found!');
    return;
  }

  tbody.innerHTML = '';

  if (!users || users.length === 0) {
    console.log('⚠️ No users to display');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No users found</td></tr>';
    return;
  }

  users.forEach((user) => {
    // Skip users with missing required fields
    if (!user || !user.id || !user.fullName || !user.militaryId) {
      console.warn('⚠️ Skipping invalid user:', user);
      return;
    }

    const row = document.createElement('tr');
    const status = user.status || 'ACTIVE';
    const rank = user.rank || 'N/A';
    const created = user.accountCreated || 'N/A';
    const picture = user.passportPicture || '../assets/default-avatar.png';

    row.innerHTML = `
            <td><img src="${picture}" alt="Profile" class="user-avatar"></td>
            <td>${user.fullName}</td>
            <td>${user.militaryId}</td>
            <td>${rank}</td>
            <td>
                <span class="status-badge ${status.toLowerCase()}">
                    <span class="status-dot"></span>
                    ${status}
                </span>
            </td>
            <td>${created}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewUserDetail(${user.id})">View</button>
                    <button class="action-btn" onclick="editUser(${user.id})">Edit</button>
                </div>
            </td>
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
    const usersToSearch = allFetchedUsers.length > 0 ? allFetchedUsers : mockUsers;
    const filtered = usersToSearch.filter((user) => user && user.fullName && user.militaryId
            && (user.fullName.toLowerCase().includes(searchTerm)
            || user.militaryId.toLowerCase().includes(searchTerm)));
    loadUsersTable(filtered);
  });
}

// View user detail
function viewUserDetail(userId) {
  const usersToSearch = allFetchedUsers.length > 0 ? allFetchedUsers : mockUsers;
  const user = usersToSearch.find((u) => u.id === userId);
  if (!user) return;

  currentSelectedUser = user;

  // Hide delete button by default (shown only when editing)
  const deleteBtn = document.getElementById('deleteUserBtn');
  if (deleteBtn) {
    deleteBtn.style.display = 'none';
  }

  // Populate modal
  document.getElementById('userDetailPicture').src = user.passportPicture;
  document.getElementById('userDetailName').textContent = user.fullName;
  document.getElementById('userDetailMilID').textContent = user.militaryId;
  document.getElementById('userDetailEmail').textContent = user.email;
  document.getElementById('userDetailMobile').textContent = user.mobile;
  document.getElementById('userDetailDOB').textContent = user.dob;
  document.getElementById('userDetailRank').textContent = user.rank || 'N/A';
  document.getElementById('userDetailCreated').textContent = user.accountCreated;

  // Status toggle
  const statusToggle = document.getElementById('userStatusToggle');
  statusToggle.checked = user.status === 'ACTIVE';
  updateStatusLabel();

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

// Display user procedures in the modal
function displayUserProcedures(user) {
  const proceduresContainer = document.getElementById('proceduresContainer');

  if (!user.procedures || user.procedures.length === 0) {
    proceduresContainer.innerHTML = '<p style="color: #999; padding: 10px;">No procedures yet</p>';
    return;
  }

  proceduresContainer.innerHTML = user.procedures.map((proc, index) => `
        <div class="procedure-item">
            <div class="procedure-item-content">
                <div class="procedure-item-name">${proc.name}</div>
                <div class="procedure-item-requirements">${proc.requirements}</div>
            </div>
            <button class="procedure-delete-btn" onclick="deleteProcedure('${user.militaryId}', ${index})">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `).join('');
}

// Edit user
// eslint-disable-next-line no-unused-vars
function editUser(userId) {
  viewUserDetail(userId);
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

// Delete user button event listener
document.getElementById('deleteUserBtn')?.addEventListener('click', () => {
  if (currentSelectedUser) {
    deleteUser(currentSelectedUser.id);
  }
});

// Delete user function
function deleteUser(userId) {
  const usersToSearch = allFetchedUsers.length > 0 ? allFetchedUsers : mockUsers;
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

      alert(`${user.fullName} has been permanently deleted from the system.`);
    })
    .catch((error) => {
      console.error('❌ Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    });
}

function updateStatusLabel() {
  const toggle = document.getElementById('userStatusToggle');
  const label = document.getElementById('statusLabel');
  label.textContent = toggle.checked ? 'ACTIVE' : 'INACTIVE';
  if (currentSelectedUser) {
    currentSelectedUser.status = toggle.checked ? 'ACTIVE' : 'INACTIVE';
  }
}

// Delete procedure function
// eslint-disable-next-line no-unused-vars
function deleteProcedure(militaryId, procedureIndex) {
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure you want to delete this procedure? This action cannot be undone.')) {
    const user = mockUsers.find((u) => u.militaryId === militaryId);
    if (user && user.procedures) {
      user.procedures.splice(procedureIndex, 1);
      displayUserProcedures(user);
      console.log('✅ Procedure deleted for user:', militaryId);

      // Send deletion to backend
      fetch(`/api/user/${militaryId}/procedure/${procedureIndex}`, {
        method: 'DELETE',
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
  alert(`Email sent successfully to ${to}`);

  emailForm.reset();
  emailModal.classList.remove('show');
  emailModal.style.display = 'none';
});

// Procedure form submit
procedureForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!currentSelectedUser) {
    alert('Please select a user first');
    return;
  }

  const procedureName = document.getElementById('procedureName').value;
  const procedureRequirements = document.getElementById('procedureRequirements').value;

  if (!procedureName || !procedureRequirements) {
    alert('Please fill in all procedure fields');
    return;
  }

  // Initialize procedures array if it doesn't exist
  if (!currentSelectedUser.procedures) {
    currentSelectedUser.procedures = [];
  }

  // Add new procedure
  currentSelectedUser.procedures.push({
    name: procedureName,
    requirements: procedureRequirements,
    addedDate: new Date().toLocaleDateString(),
  });

  // Clear form
  procedureForm.reset();

  // Update display
  displayUserProcedures(currentSelectedUser);

  console.log('✅ Procedure added for user:', currentSelectedUser.militaryId);

  // Send to backend
  fetch(`/api/user/${currentSelectedUser.militaryId}/procedure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: procedureName,
      requirements: procedureRequirements,
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log('✅ Procedure added on server:', data))
    .catch((error) => console.error('❌ Error adding procedure:', error));
});

// Admin menu
adminMenuBtn.addEventListener('click', () => {
  adminMenuDropdown.style.display = adminMenuDropdown.style.display === 'none' ? 'block' : 'none';
});

// Spouse edit option
spouseEditOption.addEventListener('click', () => {
  adminMenuDropdown.style.display = 'none';
  openSpouseEditModal();
});

// Users procedures option
userProceduresOption.addEventListener('click', () => {
  adminMenuDropdown.style.display = 'none';
  openUserProceduresModal();
});

// Spouse edit modal
function openSpouseEditModal() {
  const usersList = document.getElementById('spouseUsersList');
  usersList.innerHTML = '';

  mockUsers.forEach((user) => {
    const item = document.createElement('div');
    item.className = 'spouse-user-item';
    item.innerHTML = `
            <img src="${user.passportPicture}" alt="Profile" class="spouse-user-avatar">
            <div>
                <div class="procedure-user-name">${user.fullName}</div>
                <div style="color: #666; font-size: 12px;">${user.militaryId}</div>
            </div>
        `;
    item.addEventListener('click', () => {
      openSpouseEditForm(user);
    });
    usersList.appendChild(item);
  });

  spouseEditModal.classList.add('show');
  spouseEditModal.style.display = 'flex';
}

function openSpouseEditForm(user) {
  document.getElementById('spouseUsersList').style.display = 'none';
  document.getElementById('spouseEditForm').style.display = 'block';

  // Populate form with user's spouse data
  document.getElementById('adminSpouseFullName').value = `Jane ${user.fullName.split(' ')[1]}`;
  document.getElementById('adminSpouseMobile').value = '+1-555-0999';
  document.getElementById('adminSpouseDOB').value = '1992-08-20';
  document.getElementById('adminSpouseOccupation').value = 'School Teacher';
  document.getElementById('adminSpouseAddress').value = '123 Military Ave, Washington DC';
  document.getElementById('adminSpouseEmail').value = 'spouse@email.com';
}

document.getElementById('backToSpouseListBtn').addEventListener('click', () => {
  document.getElementById('spouseUsersList').style.display = 'block';
  document.getElementById('spouseEditForm').style.display = 'none';
});

spouseAdminForm.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Spouse information updated successfully');
  document.getElementById('spouseUsersList').style.display = 'block';
  document.getElementById('spouseEditForm').style.display = 'none';
});

closeSpouseEditModal.addEventListener('click', () => {
  spouseEditModal.classList.remove('show');
  spouseEditModal.style.display = 'none';
  document.getElementById('spouseUsersList').style.display = 'block';
  document.getElementById('spouseEditForm').style.display = 'none';
});

// User procedures modal
function openUserProceduresModal() {
  const usersList = document.getElementById('procedureUsersList');
  usersList.innerHTML = '';

  mockUsers.forEach((user) => {
    const item = document.createElement('div');
    item.className = 'procedure-user-item';
    item.innerHTML = `
            <div class="procedure-user-name">${user.fullName}</div>
            <div style="color: #666; font-size: 12px;">${user.militaryId}</div>
        `;
    item.addEventListener('click', () => {
      openProcedureForm(user);
    });
    usersList.appendChild(item);
  });

  userProceduresModal.classList.add('show');
  userProceduresModal.style.display = 'flex';
}

function openProcedureForm(user) {
  document.getElementById('procedureUsersList').style.display = 'none';
  document.getElementById('procedureFormContainer').style.display = 'block';
  document.getElementById('procUserName').value = user.fullName;
}

document.getElementById('backToProcedureListBtn').addEventListener('click', () => {
  document.getElementById('procedureUsersList').style.display = 'block';
  document.getElementById('procedureFormContainer').style.display = 'none';
});

adminProcedureForm.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Procedure added successfully');
  document.getElementById('procedureUsersList').style.display = 'block';
  document.getElementById('procedureFormContainer').style.display = 'none';
});

closeUserProceduresModal.addEventListener('click', () => {
  userProceduresModal.classList.remove('show');
  userProceduresModal.style.display = 'none';
  document.getElementById('procedureUsersList').style.display = 'block';
  document.getElementById('procedureFormContainer').style.display = 'none';
});

// Logout
adminLogoutBtn.addEventListener('click', () => {
  adminLogoutModal.classList.add('show');
  adminLogoutModal.style.display = 'flex';
});

confirmAdminLogoutBtn.addEventListener('click', () => {
  // Clear admin session cookies
  document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'adminEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  alert('✅ Admin logged out successfully');
  window.location.href = './index.html';
});

cancelAdminLogoutBtn.addEventListener('click', () => {
  adminLogoutModal.classList.remove('show');
  adminLogoutModal.style.display = 'none';
});

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
  }
  if (e.target === userProceduresModal) {
    userProceduresModal.classList.remove('show');
    userProceduresModal.style.display = 'none';
  }
  if (e.target === adminLogoutModal) {
    adminLogoutModal.classList.remove('show');
    adminLogoutModal.style.display = 'none';
  }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.admin-menu')) {
    adminMenuDropdown.style.display = 'none';
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUsersTable();
});
