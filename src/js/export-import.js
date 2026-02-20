/**
 * Export/Import Data JavaScript
 * Handles data export and import functionality
 */

// Export users as JSON
async function exportUsersJSON() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/export/users?format=json', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    downloadFile(blob, `users_${Date.now()}.json`, 'application/json');
    
    showNotification('Users exported successfully!');
  } catch (error) {
    console.error('Error exporting users as JSON:', error);
    showNotification('Failed to export users');
  }
}

// Export users as CSV
async function exportUsersCSV() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/export/users?format=csv', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    downloadFile(blob, `users_${Date.now()}.csv`, 'text/csv');
    
    showNotification('Users exported successfully!');
  } catch (error) {
    console.error('Error exporting users as CSV:', error);
    showNotification('Failed to export users');
  }
}

// Export activity logs as JSON
async function exportActivityLogsJSON() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/export/activity-logs?format=json', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    downloadFile(blob, `activity_logs_${Date.now()}.json`, 'application/json');
    
    showNotification('Activity logs exported successfully!');
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    showNotification('Failed to export activity logs');
  }
}

// Export activity logs as CSV
async function exportActivityLogsCSV() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/export/activity-logs?format=csv', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    downloadFile(blob, `activity_logs_${Date.now()}.csv`, 'text/csv');
    
    showNotification('Activity logs exported successfully!');
  } catch (error) {
    console.error('Error exporting activity logs as CSV:', error);
    showNotification('Failed to export activity logs');
  }
}

// Import users from JSON file
async function importUsersFromFile() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      let users = data.users || data;
      
      if (!Array.isArray(users)) {
        showNotification('Invalid file format. Expected an array of users.');
        return;
      }

      if (users.length === 0) {
        showNotification('No users found in the file.');
        return;
      }

      // Confirm import
      if (!confirm(`Import ${users.length} users from ${file.name}?`)) {
        return;
      }

      // Send to server
      await importUsers(users);
    } catch (error) {
      console.error('Error reading file:', error);
      showNotification('Failed to read file. Make sure it\'s a valid JSON file.');
    }
  };

  fileInput.click();
}

// Import users to server
async function importUsers(users) {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/import/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ users }),
    });

    if (!response.ok) throw new Error('Import failed');

    const data = await response.json();
    
    // Show detailed results
    let message = `Import complete!\n\n`;
    message += `✅ Successfully imported: ${data.results.success}\n`;
    message += `❌ Failed: ${data.results.failed}\n`;
    
    if (data.results.errors.length > 0) {
      message += `\nErrors:\n`;
      data.results.errors.slice(0, 5).forEach(error => {
        message += `- ${error}\n`;
      });
      if (data.results.errors.length > 5) {
        message += `... and ${data.results.errors.length - 5} more errors`;
      }
    }
    
    alert(message);
    
    // Reload users if loadUsers function exists
    if (typeof loadUsers === 'function') {
      loadUsers();
    }
  } catch (error) {
    console.error('Error importing users:', error);
    showNotification('Failed to import users');
  }
}

// Download file helper
function downloadFile(blob, filename, mimeType) {
  const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Export selected users only (if bulk selection is active)
async function exportSelectedUsers() {
  if (typeof selectedUsers === 'undefined' || selectedUsers.size === 0) {
    showNotification('No users selected. Use the Export All button or select users first.');
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    // Get full user data for selected users
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch users');

    const data = await response.json();
    const selectedUserIds = Array.from(selectedUsers);
    const filteredUsers = data.users.filter(user => selectedUserIds.includes(user._id));

    // Create and download JSON
    const exportData = {
      exportDate: new Date().toISOString(),
      count: filteredUsers.length,
      users: filteredUsers,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadFile(blob, `selected_users_${Date.now()}.json`, 'application/json');
    
    showNotification(`${filteredUsers.length} selected users exported successfully!`);
  } catch (error) {
    console.error('Error exporting selected users:', error);
    showNotification('Failed to export selected users');
  }
}

// Initialize export/import buttons
function initExportImport() {
  console.log('📤 Initializing Export/Import...');

  // Export buttons
  const exportJSONBtn = document.getElementById('exportUsersJSON');
  if (exportJSONBtn) {
    exportJSONBtn.addEventListener('click', exportUsersJSON);
  }

  const exportCSVBtn = document.getElementById('exportUsersCSV');
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', exportUsersCSV);
  }

  const exportLogsJSONBtn = document.getElementById('exportLogsJSON');
  if (exportLogsJSONBtn) {
    exportLogsJSONBtn.addEventListener('click', exportActivityLogsJSON);
  }

  const exportLogsCSVBtn = document.getElementById('exportLogsCSV');
  if (exportLogsCSVBtn) {
    exportLogsCSVBtn.addEventListener('click', exportActivityLogsCSV);
  }

  const exportSelectedBtn = document.getElementById('exportSelectedUsers');
  if (exportSelectedBtn) {
    exportSelectedBtn.addEventListener('click', exportSelectedUsers);
  }

  // Import button
  const importBtn = document.getElementById('importUsersBtn');
  if (importBtn) {
    importBtn.addEventListener('click', importUsersFromFile);
  }
}

// Export functions to global scope
window.exportImport = {
  exportUsersJSON,
  exportUsersCSV,
  exportActivityLogsJSON,
  exportActivityLogsCSV,
  importUsersFromFile,
  exportSelectedUsers,
};

// Auto-initialize if document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExportImport);
} else {
  initExportImport();
}
