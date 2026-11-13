(() => {
  'use strict';

  const root = document.documentElement;
  const themeButton = document.getElementById('themeToggle');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  const headerBirds = document.querySelector('.header-cranes');
  const mobileBirds = window.matchMedia('(max-width: 720px)');
  const birdCanvases = new Map();
  let birdSource;
  let birdRenderVersion = 0;
  let theme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  try {
    const savedTheme = localStorage.getItem('theme');
    theme = savedTheme === 'dark' ? 'dark' : 'light';
  } catch {
    // The early head script has already selected a theme when storage is blocked.
  }

  async function renderHeaderBirds(nextTheme) {
    if (!headerBirds) return;
    const version = ++birdRenderVersion;
    if (!mobileBirds.matches) {
      headerBirds.classList.remove('has-transparent-birds');
      headerBirds.replaceChildren();
      return;
    }

    if (!birdCanvases.has(nextTheme)) {
      // Resolve the existing color filter into an 8-bit image, then remove
      // its white/black matte. The displayed canvas has real transparency,
      // so a phone's live compositor cannot show a mismatched paper backdrop.
      const filter = getComputedStyle(root).getPropertyValue('--cloud-filter').trim();
      birdSource ??= (async () => {
        const image = new Image();
        image.src = 'photos/cranes-ascii.webp';
        await image.decode();
        return image;
      })();
      const image = await birdSource;
      const operations = Array.from(filter.matchAll(/([a-z-]+)\(([^)]+)\)/g), ([, type, raw]) => {
        const amount = parseFloat(raw) / (raw.includes('%') ? 100 : 1);
        const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        if (type === 'brightness' || type === 'invert') {
          const slope = type === 'invert' ? 1 - 2 * amount : amount;
          return [identity.map(value => value * slope), type === 'invert' ? amount * 255 : 0];
        }
        if (type === 'saturate' || type === 'grayscale') {
          const saturation = type === 'grayscale' ? 1 - amount : amount;
          const luminance = type === 'grayscale' ? [.2126, .7152, .0722] : [.213, .715, .072];
          return [identity.map((value, index) => value * saturation + (1 - saturation) * luminance[index % 3]), 0];
        }
        if (type === 'sepia') {
          const sepia = [.393, .769, .189, .349, .686, .168, .272, .534, .131];
          return [sepia.map((value, index) => value * amount + identity[index] * (1 - amount)), 0];
        }
        if (type === 'hue-rotate') {
          const cosine = Math.cos(amount * Math.PI / 180), sine = Math.sin(amount * Math.PI / 180);
          return [[
            .213 + .787 * cosine - .213 * sine, .715 - .715 * cosine - .715 * sine, .072 - .072 * cosine + .928 * sine,
            .213 - .213 * cosine + .143 * sine, .715 + .285 * cosine + .140 * sine, .072 - .072 * cosine - .283 * sine,
            .213 - .213 * cosine - .787 * sine, .715 - .715 * cosine + .715 * sine, .072 + .928 * cosine + .072 * sine
          ], 0];
        }
        return [identity, 0];
      });
      const canvas = document.createElement('canvas');
      // More than enough resolution for the 120px artwork on high-DPI phones.
      canvas.width = 600;
      canvas.height = 500;
      canvas.dataset.theme = nextTheme;
      canvas.setAttribute('aria-hidden', 'true');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Bird canvas could not be created');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = pixels.data;
      const light = nextTheme === 'light';
      const clamp = value => Math.max(0, Math.min(255, value));
      for (let index = 0; index < data.length; index += 4) {
        if (!data[index + 3]) continue;
        let r = data[index], g = data[index + 1], b = data[index + 2];
        for (const [matrix, offset] of operations) {
          const nextR = clamp(matrix[0] * r + matrix[1] * g + matrix[2] * b + offset);
          const nextG = clamp(matrix[3] * r + matrix[4] * g + matrix[5] * b + offset);
          const nextB = clamp(matrix[6] * r + matrix[7] * g + matrix[8] * b + offset);
          r = nextR; g = nextG; b = nextB;
        }
        r = Math.round(r); g = Math.round(g); b = Math.round(b);
        const matte = light ? Math.min(r, g, b) : Math.max(r, g, b);
        if ((light && matte >= 250) || (!light && matte <= 5)) {
          data[index + 3] = 0;
          continue;
        }
        const alpha = light ? 255 - matte : matte;
        data[index] = (light ? r - matte : r) * 255 / alpha;
        data[index + 1] = (light ? g - matte : g) * 255 / alpha;
        data[index + 2] = (light ? b - matte : b) * 255 / alpha;
        data[index + 3] = alpha;
      }
      context.putImageData(pixels, 0, 0);
      birdCanvases.set(nextTheme, canvas);
    }
    if (version === birdRenderVersion) {
      headerBirds.replaceChildren(birdCanvases.get(nextTheme));
      headerBirds.classList.add('has-transparent-birds');
    }
  }

  function applyTheme(nextTheme) {
    theme = nextTheme;
    root.setAttribute('data-theme', theme);
    themeButton?.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
    if (sunIcon) sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
    if (moonIcon) moonIcon.style.display = theme === 'light' ? 'block' : 'none';
    renderHeaderBirds(theme).catch(error => console.warn('Bird rendering failed:', error));
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
  mobileBirds.addEventListener('change', () => {
    renderHeaderBirds(theme).catch(error => console.warn('Bird rendering failed:', error));
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

    // Recovered from KVdb on November 12, 2026, before migrating to Abacus.
    const savedCount = 5656;
    const api = 'https://abacus.jasoncameron.dev';
    const counter = 'ethantsliu.github.io/home';
    const cacheKey = 'homeVisitCount';

    function displayCount(value, title = '') {
      visitCount.textContent = value.toLocaleString('en-US');
      if (title) visitCount.title = title;
      else visitCount.removeAttribute('title');
    }

    let lastCount = savedCount;
    try {
      const cachedCount = Number(localStorage.getItem(cacheKey));
      if (Number.isSafeInteger(cachedCount) && cachedCount > lastCount) lastCount = cachedCount;
    } catch {
      // The saved count still displays when browser storage is unavailable.
    }
    displayCount(lastCount, 'Last saved visit count; connecting to live counter');

    async function requestCount(action) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${api}/${action}/${counter}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Visit counter request failed (${response.status})`);
        const { value } = await response.json();
        if (!Number.isSafeInteger(value) || value < savedCount) {
          throw new Error('Visit counter returned an invalid total');
        }
        return value;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    let value;
    let title = '';
    try {
      value = await requestCount('hit');
    } catch {
      // A failed response may still have recorded the visit. Read, never
      // increment a second time, so a transient failure cannot double-count.
      try {
        value = await requestCount('get');
        title = 'Saved visit count; this visit could not be confirmed';
      } catch (error) {
        displayCount(lastCount, 'Last saved visit count; live counter temporarily unavailable');
        console.warn('Visit counter temporarily unavailable:', error);
        return;
      }
    }

    displayCount(value, title);
    try {
      localStorage.setItem(cacheKey, String(value));
    } catch {
      // A successful server update does not depend on browser storage.
    }
  }

  updateVisitCounter();
})();
