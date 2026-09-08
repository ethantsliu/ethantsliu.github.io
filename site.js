(() => {
  'use strict';

  const root = document.documentElement;
  const themeButton = document.getElementById('themeToggle');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  let theme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  try {
    const savedTheme = localStorage.getItem('theme');
    theme = savedTheme === 'dark' ? 'dark' : 'light';
  } catch {
    // The early head script has already selected a theme when storage is blocked.
  }

  function applyTheme(nextTheme) {
    theme = nextTheme;
    root.setAttribute('data-theme', theme);
    themeButton?.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
    if (sunIcon) sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
    if (moonIcon) moonIcon.style.display = theme === 'light' ? 'block' : 'none';
  }

  applyTheme(theme);
  themeButton?.addEventListener('click', () => {
    applyTheme(theme === 'light' ? 'dark' : 'light');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Theme switching remains available without persistent storage.
    }
  });

  const dropdown = document.getElementById('dropdown');
  const dropdownButton = document.getElementById('dropdownBtn');
  const dropdownContent = document.getElementById('dropdownContent');

  if (dropdown && dropdownButton && dropdownContent) {
    const hoverPointer = window.matchMedia('(any-hover: hover)');
    let menuCloseTimer;
    let openedByHover = false;

    function setMenuOpen(open) {
      window.clearTimeout(menuCloseTimer);
      dropdownButton.setAttribute('aria-expanded', String(open));
      dropdownContent.classList.toggle('is-open', open);
      if (!open) openedByHover = false;
    }

    function closeMenu() { setMenuOpen(false); }

    // Allow time to cross the gap below the button; ignore touch pointer entry.
    for (const element of [dropdown, dropdownContent]) {
      element.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse' || !hoverPointer.matches) return;
        window.clearTimeout(menuCloseTimer);
        if (dropdownButton.getAttribute('aria-expanded') !== 'true') {
          openedByHover = true;
          setMenuOpen(true);
        }
      });
      element.addEventListener('pointerleave', event => {
        if (event.pointerType !== 'mouse') return;
        window.clearTimeout(menuCloseTimer);
        menuCloseTimer = window.setTimeout(() => {
          if (!dropdownContent.contains(document.activeElement)) closeMenu();
        }, 150);
      });
    }

    dropdownButton.addEventListener('click', event => {
      // Clicking an already hovered button should leave its links available.
      const keepOpen = openedByHover && event.detail > 0;
      const open = keepOpen || dropdownButton.getAttribute('aria-expanded') !== 'true';
      openedByHover = false;
      setMenuOpen(open);
    });
    dropdown.addEventListener('focusout', event => {
      if (!dropdown.contains(event.relatedTarget)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const restoreFocus = dropdownContent.contains(document.activeElement);
      closeMenu();
      if (restoreFocus) dropdownButton.focus();
    });
    document.addEventListener('click', event => {
      if (!dropdown.contains(event.target)) closeMenu();
    });
    setMenuOpen(false);
  }

  // Increment only on pages containing the homepage counter, once at startup.
  async function updateVisitCounter() {
    const visitCount = document.getElementById('visitCount');
    if (!visitCount) return;

    try {
      const response = await fetch('https://kvdb.io/36kTtgyo6xk2FrK7jvTJtm/home', {
        method: 'PATCH',
        headers: { 'Content-Type': 'text/plain' },
        body: '+1',
        cache: 'no-store',
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Visit counter request failed (${response.status}) ${errorText}`.trim());
      }
      const parsedValue = parseInt(await response.text(), 10);
      if (!Number.isFinite(parsedValue)) throw new Error('Visit counter payload missing numeric value');
      visitCount.textContent = parsedValue.toLocaleString('en-US');
      visitCount.removeAttribute('title');
    } catch (error) {
      visitCount.textContent = 'offline';
      visitCount.title = 'Visit counter temporarily unavailable';
      console.error('Visit counter error:', error);
    }
  }

  updateVisitCounter();
})();
