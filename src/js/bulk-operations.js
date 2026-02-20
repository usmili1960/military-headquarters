/**
 * Bulk Operations JavaScript
 * Handles bulk actions on users in admin dashboard
 */

let selectedUsers = new Set();
let bulkOperationsEnabled = false;

// Initialize bulk operations
function initBulkOperations() {
  console.log('⚡ Initializing Bulk Operations...');
  setupBulkSelectionHandlers();
  setupBulkActionButtons();
}

// Setup bulk selection handlers
function setupBulkSelectionHandlers() {
  // Select all checkbox
  const selectAllCheckbox = document.getElementById('selectAllUsers');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.user-select-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        updateSelectedUsers(cb.value, e.target.checked);
      });
      updateBulkActionsBar();
    });
  }

  // Individual user checkboxes (will be set up when users are loaded)
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('user-select-checkbox')) {
      updateSelectedUsers(e.target.value, e.target.checked);
      updateBulkActionsBar();
    }
  });
}

// Setup bulk action buttons
function setupBulkActionButtons() {
  // Approve
  const approveBtn = document.getElementById('bulkApproveBtn');
  if (approveBtn) {
    approveBtn.addEventListener('click', () => bulkApproveUsers());
  }

  // Reject
  const rejectBtn = document.getElementById('bulkRejectBtn');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => bulkRejectUsers());
  }

  // Delete
  const deleteBtn = document.getElementById('bulkDeleteBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => bulkDeleteUsers());
  }

  // Update Status
  const statusBtn = document.getElementById('bulkStatusBtn');
  if (statusBtn) {
    statusBtn.addEventListener('click', () => showBulkStatusModal());
  }

  // Cancel
  const cancelBtn = document.getElementById('bulkCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => cancelBulkSelection());
  }
}

// Update selected users set
function updateSelectedUsers(userId, isSelected) {
  if (isSelected) {
    selectedUsers.add(userId);
  } else {
    selectedUsers.delete(userId);
  }
}

// Update bulk actions bar visibility and count
function updateBulkActionsBar() {
  const bar = document.getElementById('bulkActionsBar');
  const countElement = document.getElementById('bulkSelectedCount');
  
  if (!bar || !countElement) return;

  if (selectedUsers.size > 0) {
    bar.classList.add('active');
    countElement.textContent = `${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''} selected`;
  } else {
    bar.classList.remove('active');
  }
}

// Cancel bulk selection
function cancelBulkSelection() {
  selectedUsers.clear();
  document.querySelectorAll('.user-select-checkbox').forEach(cb => cb.checked = false);
  const selectAll = document.getElementById('selectAllUsers');
  if (selectAll) selectAll.checked = false;
  updateBulkActionsBar();
}

// Bulk approve users
async function bulkApproveUsers() {
  if (selectedUsers.size === 0) return;

  if (!confirm(`Are you sure you want to approve ${selectedUsers.size} user(s)?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/bulk/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userIds: Array.from(selectedUsers),
      }),
    });

    if (!response.ok) throw new Error('Bulk approve failed');

    const data = await response.json();
    alert(data.message);
    
    // Reload users
    cancelBulkSelection();
    if (typeof loadUsers === 'function') {
      loadUsers();
    }
  } catch (error) {
    console.error('Error bulk approving users:', error);
    showNotification('Failed to bulk approve users');
  }
}

// Bulk reject users
async function bulkRejectUsers() {
  if (selectedUsers.size === 0) return;

  if (!confirm(`Are you sure you want to reject ${selectedUsers.size} user(s)?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/bulk/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userIds: Array.from(selectedUsers),
      }),
    });

    if (!response.ok) throw new Error('Bulk reject failed');

    const data = await response.json();
    alert(data.message);
    
    // Reload users
    cancelBulkSelection();
    if (typeof loadUsers === 'function') {
      loadUsers();
    }
  } catch (error) {
    console.error('Error bulk rejecting users:', error);
    showNotification('Failed to bulk reject users');
  }
}

// Bulk delete users
async function bulkDeleteUsers() {
  if (selectedUsers.size === 0) return;

  if (!confirm(`⚠️ WARNING: Are you sure you want to permanently delete ${selectedUsers.size} user(s)? This action cannot be undone!`)) {
    return;
  }

  // Double confirmation for delete
  if (!confirm('Type "DELETE" in the next prompt to confirm')) {
    return;
  }

  const confirmation = prompt('Type DELETE to confirm:');
  if (confirmation !== 'DELETE') {
    showNotification('Deletion cancelled');
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/bulk/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userIds: Array.from(selectedUsers),
      }),
    });

    if (!response.ok) throw new Error('Bulk delete failed');

    const data = await response.json();
    alert(data.message);
    
    // Reload users
    cancelBulkSelection();
    if (typeof loadUsers === 'function') {
      loadUsers();
    }
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    showNotification('Failed to bulk delete users');
  }
}

// Show bulk status update modal
function showBulkStatusModal() {
  if (selectedUsers.size === 0) return;

  const status = prompt(`Update status for ${selectedUsers.size} user(s).\nEnter: Active, Inactive, or Suspended`);
  
  if (!status) return;

  const validStatuses = ['Active', 'Inactive', 'Suspended'];
  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  
  if (!validStatuses.includes(capitalizedStatus)) {
    showNotification('Invalid status. Must be Active, Inactive, or Suspended');
    return;
  }

  bulkUpdateStatus(capitalizedStatus);
}

// Bulk update status
async function bulkUpdateStatus(status) {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/bulk/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userIds: Array.from(selectedUsers),
        status,
      }),
    });

    if (!response.ok) throw new Error('Bulk status update failed');

    const data = await response.json();
    alert(data.message);
    
    // Reload users
    cancelBulkSelection();
    if (typeof loadUsers === 'function') {
      loadUsers();
    }
  } catch (error) {
    console.error('Error bulk updating status:', error);
    showNotification('Failed to bulk update status');
  }
}

// Export functions for bulk operations
window.bulkOperations = {
  init: initBulkOperations,
  approve: bulkApproveUsers,
  reject: bulkRejectUsers,
  delete: bulkDeleteUsers,
  updateStatus: bulkUpdateStatus,
  cancel: cancelBulkSelection,
};

// Auto-initialize if document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBulkOperations);
} else {
  initBulkOperations();
}
