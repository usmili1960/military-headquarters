/* global window, document */

(function initSmartsuppChat() {
  const SMARTSUPP_KEY = 'd91c375b9432e4e9a251b37d755858e5f2f4b247';
  const CUSTOM_LAUNCHER_ID = 'customChatLauncher';
  let hideNativeIntervalId;

  function hideNativeLauncher() {
    const directSelectors = [
      '[id*="smartsupp"][role="button"]',
      '[class*="smartsupp"][role="button"]',
      '[id*="smartsupp"] button',
      '[class*="smartsupp"] button',
      '[class*="smartsupp-widget__button"]',
    ];

    document.querySelectorAll(directSelectors.join(', ')).forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    });

    // Smartsupp often renders launcher as a small fixed iframe.
    document.querySelectorAll('iframe[src*="smartsupp"]').forEach((frame) => {
      const rect = frame.getBoundingClientRect();
      if (rect.width <= 140 && rect.height <= 140) {
        frame.style.setProperty('display', 'none', 'important');
        frame.style.setProperty('visibility', 'hidden', 'important');
        frame.style.setProperty('opacity', '0', 'important');
        frame.style.setProperty('pointer-events', 'none', 'important');
      }
    });
  }

  function openChatWidget() {
    // Keep native launcher hidden and open the chat from the custom button.
    hideNativeLauncher();
    window.smartsupp('chat:hide');
    window.smartsupp('chat:open');
    setTimeout(hideNativeLauncher, 250);
    setTimeout(hideNativeLauncher, 900);
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

    hideNativeLauncher();
    if (!hideNativeIntervalId) {
      hideNativeIntervalId = window.setInterval(hideNativeLauncher, 1000);
    }
  }

  window._smartsupp = window._smartsupp || {};
  window._smartsupp.key = SMARTSUPP_KEY;
  window._smartsupp.hideWidget = true;
  window.smartsupp = window.smartsupp || (function initQueue() {
    const queueFn = function smartsuppQueue() {
      queueFn._.push(arguments);
    };
    queueFn._ = [];
    return queueFn;
  }());

  (function loadSmartsuppScript(d) {
    if (d.querySelector('script[src*="smartsuppchat.com/loader.js"]')) return;
    const scriptTag = d.getElementsByTagName('script')[0];
    const loaderScript = d.createElement('script');
    loaderScript.type = 'text/javascript';
    loaderScript.charset = 'utf-8';
    loaderScript.async = true;
    loaderScript.src = 'https://www.smartsuppchat.com/loader.js?';
    loaderScript.onload = () => {
      hideNativeLauncher();
      window.smartsupp('chat:hide');
    };
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
