/* global window, document */

(function initSmartsuppChat() {
  const SMARTSUPP_KEY = 'd1f1f8a7ed23b3a149255ff1dd33907b4d29f5a9';
  const CUSTOM_LAUNCHER_ID = 'customChatLauncher';
  let openRequested = false;

  function isSmartsuppElement(element) {
    if (!element || !element.closest) return false;
    return Boolean(
      element.closest('#customChatLauncher')
      || element.closest('[id*="smartsupp"]')
      || element.closest('[class*="smartsupp"]')
      || element.closest('iframe[src*="smartsupp"]')
      || element.closest('iframe[id*="smartsupp"]')
    );
  }

  function tryClickSmartsuppFallback() {
    const selector = [
      'iframe[src*="smartsupp"]',
      '[id*="smartsupp"][role="button"]',
      '[class*="smartsupp"][role="button"]',
      '[id*="smartsupp"] button',
      '[class*="smartsupp"] button',
    ].join(', ');

    const target = document.querySelector(selector);
    if (!target) return false;

    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }

  function openChatWidget() {
    openRequested = true;

    if (typeof window.smartsupp === 'function') {
      try {
        window.smartsupp('chat:open');
        window.smartsupp('chat:show');
        openRequested = false;
        return;
      } catch (error) {
        // Keep fallback behavior if API command differs by widget version.
      }
    }

    tryClickSmartsuppFallback();
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
    loaderScript.onload = () => {
      if (openRequested) {
        setTimeout(openChatWidget, 200);
      }
    };
    if (scriptTag && scriptTag.parentNode) {
      scriptTag.parentNode.insertBefore(loaderScript, scriptTag);
    } else {
      d.head.appendChild(loaderScript);
    }
  }(document));

  // If widget UI appears after load, honor any pending open request.
  const observer = new MutationObserver((mutations) => {
    if (!openRequested) return;
    const hasSmartsuppNode = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => (
      node.nodeType === 1 && isSmartsuppElement(node)
    )));
    if (hasSmartsuppNode) {
      setTimeout(openChatWidget, 100);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCustomLauncher);
  } else {
    createCustomLauncher();
  }
}());
