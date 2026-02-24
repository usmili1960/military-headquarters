/* global window, document */

(function initTawkChat() {
  const path = window.location.pathname.toLowerCase();
  const isHomePage = path === '/' || path.endsWith('/index.html') || path.endsWith('/pages/index.html');
  const isUserDashboard = path.endsWith('/user-dashboard.html') || path.endsWith('/pages/user-dashboard.html');
  if (!isHomePage && !isUserDashboard) return;

  if (document.querySelector('script[src*="embed.tawk.to/699c1e53593adb1c36ddd911/1ji4tcvl8"]')) return;

  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();
  const tawkApi = window.Tawk_API;
  let isChatOpen = false;

  function updateLauncherState(isOpen) {
    const launcher = document.getElementById('customChatLauncher');
    if (!launcher) return;

    launcher.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    launcher.classList.toggle('is-open', isOpen);
  }

  function createCustomLauncher() {
    if (document.getElementById('customChatLauncher')) return;

    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.id = 'customChatLauncher';
    launcher.className = 'custom-chat-launcher';
    launcher.setAttribute('aria-label', 'Open live support chat');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = '<span class="custom-chat-launcher__icon" aria-hidden="true"><i class="fas fa-comments"></i></span><span>Live Chat</span>';

    launcher.addEventListener('click', () => {
      if (!window.Tawk_API || typeof window.Tawk_API.maximize !== 'function') return;

      if (isChatOpen && typeof window.Tawk_API.minimize === 'function') {
        window.Tawk_API.minimize();
      } else {
        window.Tawk_API.maximize();
      }
    });

    document.body.appendChild(launcher);
  }

  function safelyHideDefaultWidget() {
    if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
      window.Tawk_API.hideWidget();
    }
  }

  const previousOnLoad = tawkApi.onLoad;
  tawkApi.onLoad = function onTawkLoad() {
    createCustomLauncher();
    safelyHideDefaultWidget();

    if (typeof previousOnLoad === 'function') previousOnLoad.apply(this, arguments);
  };

  const previousOnChatMaximized = tawkApi.onChatMaximized;
  tawkApi.onChatMaximized = function onChatMaximized() {
    isChatOpen = true;
    updateLauncherState(true);

    if (typeof previousOnChatMaximized === 'function') previousOnChatMaximized.apply(this, arguments);
  };

  const previousOnChatMinimized = tawkApi.onChatMinimized;
  tawkApi.onChatMinimized = function onChatMinimized() {
    isChatOpen = false;
    updateLauncherState(false);
    safelyHideDefaultWidget();

    if (typeof previousOnChatMinimized === 'function') previousOnChatMinimized.apply(this, arguments);
  };

  const previousOnChatHidden = tawkApi.onChatHidden;
  tawkApi.onChatHidden = function onChatHidden() {
    isChatOpen = false;
    updateLauncherState(false);
    safelyHideDefaultWidget();

    if (typeof previousOnChatHidden === 'function') previousOnChatHidden.apply(this, arguments);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCustomLauncher, { once: true });
  } else {
    createCustomLauncher();
  }

  const firstScript = document.getElementsByTagName('script')[0];
  const tawkScript = document.createElement('script');
  tawkScript.async = true;
  tawkScript.src = 'https://embed.tawk.to/699c1e53593adb1c36ddd911/1ji4tcvl8';
  tawkScript.charset = 'UTF-8';
  tawkScript.setAttribute('crossorigin', '*');

  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(tawkScript, firstScript);
  } else if (document.head) {
    document.head.appendChild(tawkScript);
  } else {
    document.documentElement.appendChild(tawkScript);
  }
}());
