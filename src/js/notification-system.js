/**
 * Global Notification System
 * Replaces browser alert() with custom styled notifications
 */

// Initialize notification system on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('notificationOverlay')) {
        createNotificationHTML();
    }
    injectNotificationStyles();
});

// Create notification HTML structure
function createNotificationHTML() {
    const notificationHTML = `
        <div id="globalLoader" class="global-loader">
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <div id="loaderMessage" class="loader-message">Loading...</div>
            </div>
        </div>
        <div id="notificationOverlay" class="notification-overlay">
            <div class="notification-popup">
                <div class="notification-header">
                    <div id="notificationIcon" class="notification-icon"></div>
                    <h3 id="notificationTitle" class="notification-title"></h3>
                </div>
                <div id="notificationMessage" class="notification-message"></div>
                <div class="notification-buttons">
                    <button id="notificationBtn" class="notification-btn primary">OK</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notificationHTML);
}

// Inject notification styles
function injectNotificationStyles() {
    if (document.getElementById('notification-system-styles')) return;
    
    const styles = `
        <style id="notification-system-styles">
            /* Global Loader Styles */
            .global-loader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 11000;
                animation: fadeIn 0.3s ease;
            }

            .global-loader.show {
                display: flex;
            }

            .loader-content {
                text-align: center;
            }

            .loader-spinner {
                width: 60px;
                height: 60px;
                border: 5px solid rgba(255, 255, 255, 0.3);
                border-top: 5px solid #ffffff;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: spin 1s linear infinite;
            }

            .loader-message {
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .notification-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            .notification-overlay.show {
                display: flex;
            }

            .notification-popup {
                background-color: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 450px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease;
                position: relative;
            }

            .notification-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 20px;
            }

            .notification-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                flex-shrink: 0;
            }

            .notification-icon.success {
                background-color: #d4edda;
                color: #28a745;
            }

            .notification-icon.error {
                background-color: #f8d7da;
                color: #dc3545;
            }

            .notification-icon.info {
                background-color: #d1ecf1;
                color: #17a2b8;
            }

            .notification-icon.warning {
                background-color: #fff3cd;
                color: #ffc107;
            }

            .notification-title {
                font-size: 20px;
                font-weight: 700;
                color: #003366;
                margin: 0;
            }

            .notification-message {
                color: #333;
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 25px;
                white-space: pre-line;
            }

            .notification-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .notification-btn {
                padding: 10px 25px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .notification-btn.primary {
                background-color: #003366;
                color: white;
            }

            .notification-btn.primary:hover {
                background-color: #002244;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 51, 102, 0.3);
            }

            .notification-btn.secondary {
                background-color: #6c757d;
                color: white;
            }

            .notification-btn.secondary:hover {
                background-color: #5a6268;
            }

            .notification-btn.danger {
                background-color: #dc3545;
                color: white;
            }

            .notification-btn.danger:hover {
                background-color: #c82333;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes slideIn {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @media (max-width: 600px) {
                .notification-popup {
                    padding: 20px;
                    max-width: 90%;
                }

                .notification-title {
                    font-size: 18px;
                }

                .notification-message {
                    font-size: 14px;
                }

                .notification-btn {
                    padding: 8px 20px;
                    font-size: 13px;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

/**
 * Show a notification popup
 * @param {string} message - The message to display
 * @param {string} type - Type of notification: 'success', 'error', 'info', 'warning'
 * @param {string} title - Optional custom title
 * @returns {Promise} Resolves when the notification is closed
 */
function showNotification(message, type = 'info', title = '') {
    return new Promise((resolve) => {
        // Ensure notification system is initialized
        if (!document.getElementById('notificationOverlay')) {
            createNotificationHTML();
            injectNotificationStyles();
        }

        const overlay = document.getElementById('notificationOverlay');
        const icon = document.getElementById('notificationIcon');
        const titleEl = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');
        const btn = document.getElementById('notificationBtn');

        // Set icon based on type
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>'
        };

        const titles = {
            success: title || 'Success',
            error: title || 'Error',
            info: title || 'Information',
            warning: title || 'Warning'
        };

        icon.innerHTML = icons[type] || icons.info;
        icon.className = `notification-icon ${type}`;
        titleEl.textContent = titles[type];
        messageEl.textContent = message;

        overlay.classList.add('show');

        // Close on button click
        const closeNotification = () => {
            overlay.classList.remove('show');
            resolve(true);
        };

        btn.onclick = closeNotification;

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeNotification();
            }
        };

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeNotification();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Show a confirmation dialog
 * @param {string} message - The message to display
 * @param {string} title - Optional custom title
 * @returns {Promise<boolean>} Resolves with true if confirmed, false if cancelled
 */
function showConfirmation(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        // Ensure notification system is initialized
        if (!document.getElementById('notificationOverlay')) {
            createNotificationHTML();
            injectNotificationStyles();
        }

        const overlay = document.getElementById('notificationOverlay');
        const icon = document.getElementById('notificationIcon');
        const titleEl = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');
        const buttonsContainer = overlay.querySelector('.notification-buttons');

        // Set icon for confirmation
        icon.innerHTML = '<i class="fas fa-question-circle"></i>';
        icon.className = 'notification-icon warning';
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Replace buttons with Yes/No
        buttonsContainer.innerHTML = `
            <button id="cancelBtn" class="notification-btn secondary">Cancel</button>
            <button id="confirmBtn" class="notification-btn primary">Confirm</button>
        `;

        overlay.classList.add('show');

        const closeNotification = (result) => {
            overlay.classList.remove('show');
            // Restore single OK button for next notification
            buttonsContainer.innerHTML = '<button id="notificationBtn" class="notification-btn primary">OK</button>';
            resolve(result);
        };

        document.getElementById('confirmBtn').onclick = () => closeNotification(true);
        document.getElementById('cancelBtn').onclick = () => closeNotification(false);

        // Close on overlay click (cancel)
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeNotification(false);
            }
        };

        // Close on Escape key (cancel)
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeNotification(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Show loading spinner
 * @param {string} message - Optional loading message
 */
function showLoader(message = 'Loading...') {
    // Ensure notification system is initialized
    if (!document.getElementById('globalLoader')) {
        createNotificationHTML();
        injectNotificationStyles();
    }

    const loader = document.getElementById('globalLoader');
    const loaderMessage = document.getElementById('loaderMessage');
    
    if (loaderMessage) {
        loaderMessage.textContent = message;
    }
    
    if (loader) {
        loader.classList.add('show');
    }
}

/**
 * Hide loading spinner
 */
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.classList.remove('show');
    }
}

/**
 * Show notification with optional loader beforehand
 * @param {string} message - The message to display
 * @param {string} type - Type of notification
 * @param {string} title - Optional custom title
 * @param {boolean} showLoaderFirst - Whether to show loader before notification
 * @param {number} loaderDuration - How long to show loader (ms)
 */
async function showNotificationWithLoader(message, type = 'info', title = '', showLoaderFirst = true, loaderDuration = 500) {
    if (showLoaderFirst) {
        showLoader('Processing...');
        await new Promise(resolve => setTimeout(resolve, loaderDuration));
        hideLoader();
    }
    return showNotification(message, type, title);
}

// Override native alert (optional - uncomment if you want to completely replace alert)
// window.alert = function(message) {
//     showNotification(message, 'info');
// };

// Export functions for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showNotification, showConfirmation, showLoader, hideLoader, showNotificationWithLoader };
}
