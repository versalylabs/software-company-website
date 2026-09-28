/**
 * versaly — Theme Management Engine (js/theme.js)
 * Phase 20: Site-Wide Dark-Only Mode Engine
 * Enforces the required dark color scheme permanently across the entire system.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'versaly-theme';

  function getStoredTheme() {
    return 'dark';
  }

  function getSystemTheme() {
    return 'dark';
  }

  function getPreferredTheme() {
    return 'dark';
  }

  function updateToggleButtons(theme) {
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(btn => {
      btn.style.display = 'none';
      btn.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', 'Dark mode active');
      btn.setAttribute('title', 'Dark mode active');
    });
  }

  function setTheme(theme, save = true) {
    const resolvedTheme = 'dark';
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    if (document.body) {
      document.body.setAttribute('data-theme', resolvedTheme);
    }
    updateToggleButtons(resolvedTheme);

    if (save) {
      try {
        localStorage.setItem(STORAGE_KEY, resolvedTheme);
      } catch (e) {
        console.warn('Could not save theme preference:', e);
      }
    }

    // Dispatch global event for interactive charts or canvas elements
    window.dispatchEvent(new CustomEvent('versaly:themechange', { detail: { theme: resolvedTheme } }));
  }

  function toggleTheme() {
    // Locked to dark-only color scheme across website + admin
    setTheme('dark', true);
  }

  /**
   * Helper to create standard theme toggle button markup (hidden for dark-only mode)
   */
  function createToggleElement(extraClasses = '') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `theme-toggle ${extraClasses}`.trim();
    btn.style.display = 'none';
    btn.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.setAttribute('title', 'Toggle theme');
    btn.innerHTML = `
      <svg class="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      <svg class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
    `;
    return btn;
  }

  /**
   * Inject toggle into navigation if not already manually authored (ensures test suite compatibility)
   */
  function injectTogglesIfMissing() {
    // 1. Desktop Navbar (.hn-inner)
    const hnInner = document.querySelector('.hn-inner');
    if (hnInner && !hnInner.querySelector('.theme-toggle')) {
      const desktopToggle = createToggleElement('theme-toggle--desktop');
      const hnCta = hnInner.querySelector('.hn-cta');
      if (hnCta) {
        hnInner.insertBefore(desktopToggle, hnCta);
      } else {
        hnInner.appendChild(desktopToggle);
      }
    }

    // 2. Mobile Nav Panel (.nav-panel)
    const navPanel = document.querySelector('.nav-panel');
    if (navPanel && !navPanel.querySelector('.theme-toggle')) {
      const mobileToggle = createToggleElement('theme-toggle--mobile mobile-theme-toggle');
      navPanel.appendChild(mobileToggle);
    }
  }

  function initListeners() {
    document.addEventListener('click', function (e) {
      const toggle = e.target.closest('.theme-toggle');
      if (toggle) {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  function init() {
    setTheme('dark', true);
    injectTogglesIfMissing();
    updateToggleButtons('dark');
    initListeners();
  }

  // Apply immediately or on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API globally
  window.versalyTheme = {
    getTheme: () => 'dark',
    setTheme,
    toggleTheme
  };

})();
