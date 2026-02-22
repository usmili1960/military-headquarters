/* global window, document */

(function initSmartsuppChat() {
  const SMARTSUPP_KEY = 'd1f1f8a7ed23b3a149255ff1dd33907b4d29f5a9';
  const CUSTOM_LAUNCHER_ID = 'customChatLauncher';

  function openChatWidget() {
    if (typeof window.smartsupp === 'function') {
      try {
        window.smartsupp('chat:open');
      } catch (error) {
        // Keep fallback behavior if API command differs by widget version.
      }
    }
  }

  function createCustomLauncher() {
    if (document.getElementById(CUSTOM_LAUNCHER_ID)) return;

    const launcher = document.createElement('button');
    launcher.id = CUSTOM_LAUNCHER_ID;
    launcher.className = 'custom-chat-launcher';
    launcher.type = 'button';
    launcher.innerHTML = '<span class="custom-chat-launcher__icon">💬</span><span>Chat Support</span>';
    launcher.setAttribute('aria-label', 'Open chat support');
    launcher.addEventListener('click', openChatWidget);
    document.body.appendChild(launcher);
  }

  window._smartsupp = window._smartsupp || {};
  window._smartsupp.key = SMARTSUPP_KEY;

  if (window.smartsupp) return;

  (function loadSmartsuppScript(d) {
    const scriptTag = d.getElementsByTagName('script')[0];
    const loaderScript = d.createElement('script');
    loaderScript.type = 'text/javascript';
    loaderScript.charset = 'utf-8';
    loaderScript.async = true;
    loaderScript.src = 'https://www.smartsuppchat.com/loader.js?';
    if (scriptTag && scriptTag.parentNode) {
      scriptTag.parentNode.insertBefore(loaderScript, scriptTag);
    } else {
      d.head.appendChild(loaderScript);
    }
  }(document));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCustomLauncher);
  } else {
    createCustomLauncher();
  }
}());
