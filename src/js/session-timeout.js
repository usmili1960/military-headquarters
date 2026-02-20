/* Session Timeout Management */

// Configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout
let timeoutTimer = null;
let warningTimer = null;
let lastActivityTime = Date.now();

// Initialize session timeout tracking
function initSessionTimeout() {
  resetSessionTimeout();
  
  // Track user activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, () => {
      lastActivityTime = Date.now();
      resetSessionTimeout();
    }, true);
  });
}

// Reset timeout timers
function resetSessionTimeout() {
  // Clear existing timers
  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (warningTimer) clearTimeout(warningTimer);
  
  // Set warning timer
  warningTimer = setTimeout(showSessionWarning, SESSION_TIMEOUT - WARNING_TIME);
  
  // Set logout timer
  timeoutTimer = setTimeout(handleSessionTimeout, SESSION_TIMEOUT);
}

// Show warning modal
function showSessionWarning() {
  const remainingTime = Math.ceil((SESSION_TIMEOUT - (Date.now() - lastActivityTime)) / 60000);
  
  if (remainingTime <= 0) {
    handleSessionTimeout();
    return;
  }
  
  const continueSession = confirm(
    `Your session will expire in ${remainingTime} minute(s) due to inactivity.\n\n` +
    'Click OK to continue your session, or Cancel to logout.'
  );
  
  if (continueSession) {
    lastActivityTime = Date.now();
    resetSessionTimeout();
  } else {
    handleSessionTimeout();
  }
}

// Handle session timeout
function handleSessionTimeout() {
  console.log('⏱️ Session expired due to inactivity');
  
  // Clear all auth data
  localStorage.removeItem('userLoggedIn');
  localStorage.removeItem('userMilitaryId');
  localStorage.removeItem('userToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('adminLoggedIn');
  localStorage.removeItem('adminEmail');
  localStorage.removeItem('adminToken');
  
  // Clear cookies
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  showNotification('Your session has expired due to inactivity. Please login again.', 'warning', 'Session Expired');
  
  // Redirect to homepage
  window.location.href = '/pages/index.html';
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.initSessionTimeout = initSessionTimeout;
  window.resetSessionTimeout = resetSessionTimeout;
}

// Auto-initialize if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  const isUserLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
  const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
  
  if (isUserLoggedIn || isAdminLoggedIn) {
    initSessionTimeout();
    console.log('✅ Session timeout manager initialized (30 minutes)');
  }
});
