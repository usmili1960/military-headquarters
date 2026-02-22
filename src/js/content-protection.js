/**
 * Content Protection System
 * Prevents downloading, copying, and screenshots
 */

(function() {
    'use strict';

    function isChatElement(target) {
        if (!target || !target.closest) return false;
        return Boolean(
            target.closest('#customChatLauncher')
            || target.closest('[id*="smartsupp"]')
            || target.closest('[class*="smartsupp"]')
            || target.closest('iframe[src*="smartsupp"]')
            || target.closest('iframe[id*="smartsupp"]')
        );
    }

    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        if (isChatElement(e.target)) return true;
        e.preventDefault();
        return false;
    }, false);

    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        if (isChatElement(e.target)) return true;
        e.preventDefault();
        return false;
    }, false);

    // Disable copy
    document.addEventListener('copy', function(e) {
        if (isChatElement(e.target)) return true;
        e.preventDefault();
        return false;
    }, false);

    // Disable cut
    document.addEventListener('cut', function(e) {
        if (isChatElement(e.target)) return true;
        e.preventDefault();
        return false;
    }, false);

    // Disable drag and drop
    document.addEventListener('dragstart', function(e) {
        if (isChatElement(e.target)) return true;
        e.preventDefault();
        return false;
    }, false);

    // Comprehensive keyboard shortcuts blocker
    document.addEventListener('keydown', function(e) {
        if (isChatElement(e.target)) return true;
        // Prevent F12 (DevTools)
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+P (Print)
        if (e.ctrlKey && e.keyCode === 80) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+C (Copy)
        if (e.ctrlKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+X (Cut)
        if (e.ctrlKey && e.keyCode === 88) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+A (Select All)
        if (e.ctrlKey && e.keyCode === 65) {
            e.preventDefault();
            return false;
        }

        // Prevent Print Screen
        if (e.keyCode === 44) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }

        // Prevent Ctrl+Shift+K (Firefox Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 75) {
            e.preventDefault();
            return false;
        }

        // Prevent F5 (Refresh with cache clear)
        if (e.ctrlKey && e.keyCode === 116) {
            e.preventDefault();
            return false;
        }
    }, false);

    // DevTools detection disabled - allows developers to debug the application

    // Prevent image dragging
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.setAttribute('draggable', 'false');
            img.style.pointerEvents = 'none';
            img.style.userSelect = 'none';
            
            // Add transparent overlay
            img.addEventListener('mousedown', function(e) {
                e.preventDefault();
                return false;
            });
        });

        // Prevent video downloads
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.setAttribute('controlsList', 'nodownload noplaybackrate');
            video.setAttribute('disablePictureInPicture', 'true');
            video.setAttribute('oncontextmenu', 'return false;');
            video.style.userSelect = 'none';
            
            // Remove download attribute from video source
            video.removeAttribute('download');
        });

        // Protect all media elements
        const mediaElements = document.querySelectorAll('audio, video, img, picture, source');
        mediaElements.forEach(media => {
            media.setAttribute('oncontextmenu', 'return false;');
            media.style.userSelect = 'none';
            media.style.webkitUserSelect = 'none';
            media.style.msUserSelect = 'none';
        });
    });

    // Disable screenshot via Page Visibility API
    // console.clear() disabled to allow console error logging
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // User might be taking screenshot
            // Removed console.clear() to allow debugging
        }
    });

    // Console clearing disabled to allow error logging and debugging

    // Watermark overlay (optional but recommended)
    window.addEventListener('load', function() {
        // Add watermark to body
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
            background-image: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 200px,
                rgba(255, 255, 255, 0.02) 200px,
                rgba(255, 255, 255, 0.02) 400px
            );
        `;
        document.body.appendChild(watermark);
    });

    // Prevent browser's built-in screenshot tools
    if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        navigator.mediaDevices.getDisplayMedia = function() {
            return Promise.reject(new Error('Screen capture is disabled'));
        };
    }

    // Disable printing
    window.addEventListener('beforeprint', function(e) {
        e.preventDefault();
        alert('Printing is disabled for security reasons');
        return false;
    });

    window.addEventListener('afterprint', function(e) {
        e.preventDefault();
        return false;
    });

    // Override print function
    window.print = function() {
        alert('Printing is disabled for security reasons');
        return false;
    };

    // Prevent iOS screenshot
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.documentElement.style.webkitTouchCallout = 'none';
    }

    // Blur detection for screenshots
    let blurTimeout;
    window.addEventListener('blur', function() {
        blurTimeout = setTimeout(function() {
            // User might be taking screenshot
            // Removed console.clear() to allow debugging
        }, 100);
    });

    window.addEventListener('focus', function() {
        clearTimeout(blurTimeout);
    });

    // Disable mouse button combinations
    document.addEventListener('mousedown', function(e) {
        if (isChatElement(e.target)) return true;
        // Prevent middle mouse button
        if (e.button === 1) {
            e.preventDefault();
            return false;
        }
        // Prevent right mouse button
        if (e.button === 2) {
            e.preventDefault();
            return false;
        }
    }, false);

    // Protect against iframe embedding
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // Disable text highlighting on mobile
    document.addEventListener('touchstart', function(e) {
        if (isChatElement(e.target)) return true;
        if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
            e.preventDefault();
        }
    }, { passive: false });

    // Monitor for screen recording software
    if ('mediaDevices' in navigator) {
        navigator.mediaDevices.addEventListener('devicechange', function() {
            console.log('Media device changed - possible screen recording');
        });
    }

    console.log('🔒 Content Protection Enabled');
})();
