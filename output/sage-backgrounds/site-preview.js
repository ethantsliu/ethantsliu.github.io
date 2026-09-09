(() => {
  'use strict';
  const scenes = window.SAGE_SCENES;
  const fallback = window.SAGE_DEFAULT_SCENE || scenes[0].id;
  const root = document.documentElement;
  const body = document.body;
  const isHome = body.classList.contains('home');
  if (!isHome) document.querySelector('.sage-scene')?.remove();
  // A small closing fragment stays in normal flow, clear of the reading area.
  // Secondary pages share this cloud motif independently of the homepage study.
  if (!isHome) {
    const fragment = document.createElement('div');
    fragment.className = 'sage-page-fragment';
    fragment.setAttribute('aria-hidden', 'true');
    const cloud = scenes.find(scene => scene.id === 'clouds-portrait');
    const image = document.createElement('img');
    image.alt = '';
    image.width = cloud.width;
    image.height = cloud.height;
    image.decoding = 'async';
    image.src = new URL(cloud.large, location.href).href;
    fragment.append(image);
    body.append(fragment);
  }
  const themeButton = document.getElementById('themeToggle');
  const dropdownButton = document.getElementById('dropdownBtn');
  const dropdownContent = document.getElementById('dropdownContent');
  const query = new URLSearchParams(location.search);
  const pageFiles = { about: 'site-preview.html', work: 'preview-work.html', research: 'preview-research.html', writing: 'preview-writing.html', archive: 'preview-archive.html', essay: 'preview-essay.html' };
  const routes = { '': 'about', index: 'about', work: 'work', research: 'research', writing: 'writing', archive: 'archive', baylearn: 'essay' };
  const corner = document.createElement('div');
  corner.className = 'sage-corner-cloud';
  corner.setAttribute('aria-hidden', 'true');
  const cornerImage = document.createElement('img');
  cornerImage.alt = '';
  cornerImage.width = 1024;
  cornerImage.height = 1536;
  cornerImage.decoding = 'async';
  corner.append(cornerImage);
  body.prepend(corner);
  let state = {
    art: query.get('art') || fallback,
    placement: query.get('placement') || window.SAGE_DEFAULT_PLACEMENT || 'editorial',
    accent: query.get('accent') || 'blue', strength: query.get('strength') || 100,
    theme: query.get('theme') || 'light', original: query.get('original') === 'true',
    corner: query.has('corner') ? query.get('corner') === 'true' : true,
    cornerSize: query.get('cornerSize') || 'medium'
  };

  // Keep the source list intact for the Original and earlier placement comparisons.
  // The illustration belongs to the Latest section, not to an individual project.
  const editorial = document.createElement('div');
  editorial.className = 'sage-editorial';
  const picture = document.createElement('div');
  picture.className = 'sage-editorial-picture';
  picture.setAttribute('aria-hidden', 'true');
  const illustration = document.createElement('img');
  illustration.alt = '';
  illustration.width = 1672;
  illustration.height = 941;
  illustration.decoding = 'async';
  picture.append(illustration);
  editorial.append(picture);

  const sourceList = document.querySelector('.home .list-section > .feature-list');
  if (sourceList) {
    sourceList.classList.add('sage-source-list');
    const recent = document.createElement('ul');
    recent.className = 'sage-recent-list';
    recent.setAttribute('aria-label', 'Latest projects and writing');
    [...sourceList.children].forEach(item => {
      const copy = item.cloneNode(true);
      const label = copy.querySelector('.feature-label');
      const date = copy.querySelector('.feature-date');
      const meta = document.createElement('div');
      meta.className = 'sage-entry-meta';
      if (label) {
        label.textContent = label.textContent.replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim();
        meta.append(label);
      }
      if (date) meta.append(date);
      copy.append(meta);
      recent.append(copy);
    });
    editorial.replaceChildren(recent, picture);
    sourceList.before(editorial);
  }

  function render() {
    if (!scenes.some(scene => scene.id === state.art)) state.art = fallback;
    const scene = scenes.find(scene => scene.id === state.art);
    if (!['editorial', 'opening', 'closing'].includes(state.placement)) state.placement = 'editorial';
    if (!['blue', 'amber', 'graphite'].includes(state.accent)) state.accent = 'blue';
    state.theme = state.theme === 'dark' ? 'dark' : 'light';
    const number = Number(state.strength);
    state.strength = Number.isFinite(number) ? Math.min(100, Math.max(5, number)) : 100;
    const file = window.innerWidth <= 1000 ? scene.small : scene.large;
    const artURL = new URL(file, location.href);
    root.style.setProperty('--sage-art', `url("${artURL.href}")`);
    root.style.setProperty('--scene-paper', scene.paper);
    root.style.setProperty('--sage-strength', String(state.strength / 100));
    root.setAttribute('data-theme', state.theme);
    body.dataset.placement = state.placement;
    body.dataset.art = state.art;
    body.dataset.collection = scene.group;
    body.dataset.family = scene.family;
    const usePortrait = scene.format === 'portrait';
    body.dataset.portrait = String(usePortrait);
    body.dataset.naturalEdge = String(usePortrait && Boolean(scene.naturalEdge));
    body.dataset.accent = state.accent;
    body.classList.toggle('show-original', Boolean(state.original));
    const showCorner = Boolean(state.corner) && !state.original && (!isHome || state.placement === 'editorial');
    body.dataset.cornerCloud = String(showCorner);
    if (!['small', 'medium', 'large'].includes(state.cornerSize)) state.cornerSize = 'medium';
    body.dataset.cornerSize = state.cornerSize;
    if (showCorner && window.innerWidth >= 1280 && !cornerImage.hasAttribute('src')) {
      cornerImage.src = new URL('details/cloud-corner-rounded-v1.webp', location.href).href;
    }
    if (sourceList && state.placement === 'editorial' && !state.original) {
      const large = new URL(scene.large, location.href).href;
      const small = new URL(scene.small, location.href).href;
      // A tall crop displays a small part of a landscape source, so it needs the
      // larger source even when its CSS column is comparatively narrow.
      if (usePortrait) {
        illustration.removeAttribute('srcset');
        illustration.removeAttribute('sizes');
        illustration.width = scene.width;
        illustration.height = scene.height;
        illustration.src = large;
      } else {
        illustration.width = 1672;
        illustration.height = 941;
        illustration.sizes = sourceList ? '(max-width: 760px) 800px, 1600px' : '(max-width: 760px) 800px, 1100px';
        illustration.srcset = `${small} ${scene.smallWidth}w, ${large} ${scene.largeWidth}w`;
        illustration.src = large;
      }
    }
    themeButton.setAttribute('aria-label', `Switch to ${state.theme === 'light' ? 'dark' : 'light'} theme`);
    document.querySelector('.sun-icon').style.display = state.theme === 'dark' ? 'block' : 'none';
    document.querySelector('.moon-icon').style.display = state.theme === 'light' ? 'block' : 'none';
    document.querySelectorAll('a[data-preview-route]').forEach(link => {
      const url = new URL(pageFiles[link.dataset.previewRoute], location.href);
      url.search = new URLSearchParams(state).toString();
      link.href = url.href;
    });
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || !event.data) return;
    if (event.data.type === 'sage-focus') {
      if (event.data.position !== 'top' && !state.original && (!isHome || state.placement === 'closing')) {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      } else if (event.data.position !== 'top' && !state.original && state.placement === 'editorial' && sourceList) {
        const target = sourceList.closest('.list-section');
        window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - 24), behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      return;
    }
    if (event.data.type !== 'sage-preview') return;
    const { art, placement, strength, theme, accent, original, corner, cornerSize } = event.data;
    state = { art, placement, strength, theme, accent, original: Boolean(original), corner: Boolean(corner), cornerSize };
    render();
  });
  window.addEventListener('resize', render);
  themeButton.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    render();
    if (window.parent !== window) window.parent.postMessage({ type: 'sage-theme', theme: state.theme }, '*');
  });
  const dropdown = document.getElementById('dropdown');
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
  // Restore the site's hover interaction, including time to cross the small
  // gap below the button. Ignore touch-generated pointer entry events.
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
    // A mouse click following hover should not immediately hide the links.
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
  document.addEventListener('click', event => { if (!event.target.closest('#dropdown')) closeMenu(); });
  // Known pages stay in the experiment; other content opens separately.
  document.querySelectorAll('a[href]').forEach(link => {
    const raw = link.getAttribute('href');
    const route = raw.replace(/^\//, '').replace(/\.html$/, '');
    if (Object.hasOwn(routes, route)) {
      const page = routes[route];
      link.dataset.previewRoute = page;
      link.removeAttribute('target');
      link.addEventListener('click', event => {
        if (window.parent === window || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        window.parent.postMessage({ type: 'sage-navigate', page }, '*');
      });
      return;
    }
    link.target = '_blank';
    link.rel = 'noopener';
  });
  // Read the live total without incrementing it while trying design variants.
  // The production homepage retains its existing PATCH +1 implementation.
  async function displayVisitCount() {
    const counter = document.getElementById('visitCount');
    if (!counter) return;
    try {
      const response = await fetch('https://kvdb.io/36kTtgyo6xk2FrK7jvTJtm/home', {
        method: 'GET', cache: 'no-store', credentials: 'omit'
      });
      if (!response.ok) throw new Error('Counter unavailable');
      const raw = (await response.text()).trim();
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) throw new Error('Invalid count');
      counter.textContent = Number(raw).toLocaleString('en-US');
      counter.removeAttribute('title');
    } catch {
      counter.textContent = 'offline';
      counter.title = 'Visit counter temporarily unavailable';
    }
  }
  displayVisitCount();
  render();
  if (window.parent !== window) window.parent.postMessage({ type: 'sage-ready' }, '*');
})();
