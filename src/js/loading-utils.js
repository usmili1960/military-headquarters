/* Loading Utility Functions */

// Show loading overlay
function showLoading(message = 'Please wait...') {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    const loadingText = overlay.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
    }
    overlay.classList.add('active');
  }
}

// Hide loading overlay
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// Add loading state to button
function setButtonLoading(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.classList.add('btn-loading');
    button.disabled = true;
    // Store original text
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }
  } else {
    button.classList.remove('btn-loading');
    button.disabled = false;
    // Restore original text
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}

// Show inline spinner in element
function showInlineSpinner(element) {
  if (!element) return;
  const spinner = document.createElement('span');
  spinner.className = 'loader-small';
  spinner.id = 'inline-spinner-' + Date.now();
  element.appendChild(spinner);
  return spinner.id;
}

// Remove inline spinner
function removeInlineSpinner(spinnerId) {
  const spinner = document.getElementById(spinnerId);
  if (spinner) {
    spinner.remove();
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.showLoading = showLoading;
  window.hideLoading = hideLoading;
  window.setButtonLoading = setButtonLoading;
  window.showInlineSpinner = showInlineSpinner;
  window.removeInlineSpinner = removeInlineSpinner;
}
