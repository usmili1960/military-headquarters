/**
 * Notification System JavaScript
 * Handles real-time notifications for users and admins
 */

let notificationsData = {
  notifications: [],
  unreadCount: 0,
};

let notificationCheckInterval = null;
const API_BASE = (() => {
  const hostname = window.location.hostname;
  if (hostname.includes('onrender.com') || hostname.includes('railway.app') || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
})();

// Initialize notification system
function initNotificationSystem(userId, isAdmin = false) {
  console.log('🔔 Initializing Notification System...');
  
  // Load initial notifications
  loadNotifications(userId, isAdmin);
  
  // Check for new notifications every 30 seconds
  notificationCheckInterval = setInterval(() => {
    loadNotifications(userId, isAdmin);
  }, 30000);
  
  // Setup notification bell click handler
  setupNotificationBell();
}

// Load notifications
async function loadNotifications(userId, isAdmin = false) {
  try {
    const endpoint = isAdmin 
      ? `${API_BASE}/api/admin/notifications`
      : `${API_BASE}/api/notifications/${userId}`;
    
    const headers = {};
    if (isAdmin) {
      const token = localStorage.getItem('adminToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(endpoint, { headers });
    
    if (!response.ok) throw new Error('Failed to load notifications');

    const data = await response.json();
    notificationsData.notifications = data.notifications;
    notificationsData.unreadCount = typeof data.unreadCount === 'number'
      ? data.unreadCount
      : data.notifications.filter((n) => !n.isRead).length;

    // Update UI
    updateNotificationBadge(notificationsData.unreadCount);
    
    // Show new notification toast if there are unread ones
    if (notificationsData.unreadCount > 0 && data.notifications.length > 0) {
      const latestUnread = data.notifications.find(n => !n.isRead);
      if (latestUnread && shouldShowToast(latestUnread)) {
        showNotificationToast(latestUnread);
      }
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// Check if should show toast (don't show if already shown recently)
function shouldShowToast(notification) {
  const shownKey = `notification_shown_${notification._id}`;
  const wasShown = sessionStorage.getItem(shownKey);
  if (wasShown) return false;
  
  sessionStorage.setItem(shownKey, 'true');
  return true;
}

// Update notification badge
function updateNotificationBadge(count) {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

// Setup notification bell click handler
function setupNotificationBell() {
  const bell = document.getElementById('notificationBell');
  if (!bell) return;

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationDropdown();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

// Toggle notification dropdown
function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (!dropdown) return;

  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';

  if (!isVisible) {
    displayNotifications();
  }
}

// Display notifications in dropdown
function displayNotifications() {
  const list = document.getElementById('notificationList');
  if (!list) return;

  if (notificationsData.notifications.length === 0) {
    list.innerHTML = '<div class="notification-empty">No notifications</div>';
    return;
  }

  let html = '';
  notificationsData.notifications.slice(0, 10).forEach(notification => {
    const time = formatTimeAgo(new Date(notification.createdAt));
    const unreadClass = notification.isRead ? '' : 'notification-unread';
    const icon = getNotificationIcon(notification.type);
    const priorityClass = `priority-${notification.priority}`;
    
    html += `
      <div class="notification-item ${unreadClass} ${priorityClass}" data-id="${notification._id}" onclick="markNotificationAsRead('${notification._id}', '${notification.actionUrl || ''}')">
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${time}</div>
        </div>
        ${!notification.isRead ? '<div class="notification-dot"></div>' : ''}
      </div>
    `;
  });

  // Add mark all as read button
  if (notificationsData.unreadCount > 0) {
    html += `
      <div class="notification-footer">
        <button onclick="markAllNotificationsAsRead()" class="btn-mark-all-read">
          Mark all as read
        </button>
      </div>
    `;
  }

  list.innerHTML = html;
}

// Get notification icon by type
function getNotificationIcon(type) {
  const icons = {
    approval: '✅',
    rejection: '❌',
    procedure_assigned: '📋',
    procedure_updated: '✏️',
    status_changed: '🔄',
    message: '💬',
    warning: '⚠️',
    info: 'ℹ️',
    system: '⚙️',
  };
  return icons[type] || '🔔';
}

// Format time ago
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// Mark notification as read
async function markNotificationAsRead(notificationId, actionUrl) {
  try {
    const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });

    if (response.ok) {
      // Update local data
      const notification = notificationsData.notifications.find(n => n._id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        notificationsData.unreadCount = Math.max(0, notificationsData.unreadCount - 1);
        updateNotificationBadge(notificationsData.unreadCount);
      }

      // Navigate to action URL if provided
      if (actionUrl) {
        window.location.href = actionUrl;
      } else {
        // Just update the UI
        displayNotifications();
      }
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
  try {
    const adminToken = localStorage.getItem('adminToken');
    const userId = localStorage.getItem('militaryId') || localStorage.getItem('adminId');
    const isAdmin = Boolean(adminToken);
    const endpoint = isAdmin
      ? `${API_BASE}/api/admin/notifications/read-all`
      : `${API_BASE}/api/notifications/${userId}/mark-all-read`;
    const headers = isAdmin
      ? { Authorization: `Bearer ${adminToken}` }
      : {};

    if (!isAdmin && !userId) return;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers,
    });

    if (response.ok) {
      notificationsData.notifications.forEach(n => n.isRead = true);
      notificationsData.unreadCount = 0;
      updateNotificationBadge(0);
      displayNotifications();
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Show notification toast
function showNotificationToast(notification) {
  const toast = document.createElement('div');
  toast.className = `notification-toast priority-${notification.priority}`;
  toast.innerHTML = `
    <div class="toast-icon">${getNotificationIcon(notification.type)}</div>
    <div class="toast-content">
      <div class="toast-title">${notification.title}</div>
      <div class="toast-message">${notification.message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Send notification (admin only)
async function sendNotification(userIds, title, message, type = 'message', priority = 'medium') {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin authentication required');
      return;
    }

    const response = await fetch(`${API_BASE}/api/admin/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userIds,
        title,
        message,
        type,
        priority,
      }),
    });

    if (!response.ok) throw new Error('Failed to send notification');

    const data = await response.json();
    showNotification(`Notification sent to ${data.count} users`);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    showNotification('Failed to send notification');
    return false;
  }
}

// Stop notification checking (call on logout)
function stopNotificationSystem() {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    notificationCheckInterval = null;
  }
}
