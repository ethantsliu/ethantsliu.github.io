(() => {
  "use strict";

  const artworks = window.SAGE_SCENES || [];
  const groups = [
    { id: "portrait", label: "Portrait studies", grid: document.getElementById("portrait-grid") },
    { id: "original", label: "Original studies", grid: document.getElementById("artwork-grid") },
    { id: "edge", label: "Edge studies", grid: document.getElementById("edge-grid") }
  ];

  const controls = {
    page: document.getElementById("page"),
    art: document.getElementById("artwork"),
    placement: document.getElementById("placement"),
    accent: document.getElementById("accent"),
    strength: document.getElementById("strength"),
    theme: document.getElementById("theme"),
    width: document.getElementById("width"),
    original: document.getElementById("original"),
    corner: document.getElementById("corner"),
    cornerSize: document.getElementById("cornerSize")
  };
  const frame = document.getElementById("site-preview");
  const viewport = document.getElementById("preview-viewport");
  const status = document.getElementById("selection-status");
  const strengthValue = document.getElementById("strength-value");
  const cardElements = new Map();
  const pageFiles = Object.fromEntries(Object.entries({ about: "site-preview.html", work: "preview-work.html", research: "preview-research.html", archive: "preview-archive.html", writing: "preview-writing.html", essay: "preview-essay.html" }).map(([page, file]) => [page, `${file}?v=24`]));
  const treatmentButtons = Array.from(document.querySelectorAll(".treatment-button"));
  const treatmentStrengths = { editorial: 100, opening: 100, closing: 100 };
  // Saved greens: sage { light: "#4c6757", dark: "#bacbb7" };
  // original { light: "#3f6b4f", dark: "#a6bca8" }.
  const accentColors = { blue: { light: "#4c6e83", dark: "#a5bfd3" }, amber: { light: "#8a642d", dark: "#c8aa70" }, graphite: { light: "#545a54", dark: "#b9beb7" } };
  const jumpArtwork = document.getElementById("jump-art");
  const pageTop = document.getElementById("page-top");
  let displayedPage = "about";
  let previewReady = false;
  let focusOnReady = false;

  function sendPreview() {
    const artwork = artworks.find((item) => item.id === controls.art.value);
    if (!artwork) return;
    const isHome = controls.page.value === "about";
    controls.art.disabled = !isHome;
    controls.placement.disabled = !isHome;
    controls.strength.disabled = !isHome;
    controls.corner.disabled = controls.original.checked || (isHome && controls.placement.value !== "editorial") || controls.width.value === "mobile";
    controls.cornerSize.disabled = !isHome || controls.corner.disabled || !controls.corner.checked;
    const strength = Number(controls.strength.value);
    strengthValue.value = `${strength}%`;
    viewport.classList.toggle("is-mobile", controls.width.value === "mobile");
    document.getElementById("accent-swatch").style.background = accentColors[controls.accent.value][controls.theme.value];
    const treatmentNotes = {
      editorial: controls.page.value === "about"
        ? "All updates on the left; tall artwork fades into paper on the right."
        : "Original layout, with a small cloud at the page’s lower-right edge.",
      opening: "A full-width scene opens the page.",
      closing: "A full-width scene follows the content."
    };
    const secondaryNote = controls.corner.checked && controls.width.value !== "mobile"
      ? "Small clouds at the upper-left and lower-right edges, clear of the reading area."
      : "Original layout, with a small cloud at the page’s lower-right edge.";
    document.getElementById("placement-note").textContent = controls.original.checked
      ? "The current site, for comparison."
      : isHome ? treatmentNotes[controls.placement.value] : secondaryNote;
    jumpArtwork.hidden = controls.original.checked || (isHome && !["editorial", "closing"].includes(controls.placement.value));
    pageTop.hidden = jumpArtwork.hidden;
    document.getElementById("preview-navigation").hidden = jumpArtwork.hidden;
    for (const button of treatmentButtons) {
      button.disabled = !isHome;
      button.setAttribute("aria-pressed", String(button.dataset.placement === controls.placement.value));
    }
    if (displayedPage !== controls.page.value) {
      displayedPage = controls.page.value;
      previewReady = false;
      focusOnReady = isHome && controls.placement.value === "closing";
      frame.src = pageFiles[displayedPage];
    }

    for (const [id, elements] of cardElements) {
      const selected = isHome && !controls.original.checked && id === controls.art.value;
      elements.card.classList.toggle("is-selected", selected);
      elements.imageButton.setAttribute("aria-pressed", String(selected));
      elements.tryButton.setAttribute("aria-pressed", String(selected));
      elements.tryButton.textContent = selected ? "In preview" : "Try on site";
      elements.badge.hidden = !selected;
    }

    status.textContent = controls.original.checked
      ? "Original site · Artwork hidden"
      : isHome
        ? `${controls.page.selectedOptions[0].textContent} · ${artwork.title} · ${controls.accent.selectedOptions[0].textContent}`
        : `${controls.page.selectedOptions[0].textContent} · ${controls.corner.checked ? "Cloud corners" : "Cloud fragment"} · ${controls.accent.selectedOptions[0].textContent}`;

    // A copied address keeps the current comparison, including the selected page.
    const saved = new URLSearchParams();
    saved.set("scene", "9");
    for (const [key, control] of Object.entries(controls)) saved.set(key, control.type === "checkbox" ? String(control.checked) : control.value);
    try { history.replaceState(null, "", `#${saved}`); } catch { /* Some file viewers disallow history writes. */ }

    frame.contentWindow?.postMessage({
      type: "sage-preview",
      art: controls.art.value,
      placement: controls.placement.value,
      accent: controls.accent.value,
      strength,
      theme: controls.theme.value,
      original: controls.original.checked,
      corner: controls.corner.checked,
      cornerSize: controls.cornerSize.value
    }, "*");
    if (previewReady && focusOnReady) {
      focusOnReady = false;
      focusArtwork();
    }
  }

  function chooseArtwork(id) {
    controls.page.value = "about";
    controls.art.value = id;
    controls.original.checked = false;
    sendPreview();
    document.querySelector(".preview-panel").scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
    });
    if (previewReady) focusArtwork();
    else focusOnReady = true;
  }

  function focusArtwork() {
    frame.contentWindow?.postMessage({ type: "sage-focus" }, "*");
  }

  function chooseTreatment(placement) {
    if (!Object.hasOwn(treatmentStrengths, placement)) return;
    if (controls.placement.value !== placement) controls.strength.value = String(treatmentStrengths[placement]);
    controls.placement.value = placement;
    controls.original.checked = false;
    sendPreview();
    focusArtwork();
  }

  function createCard(artwork, index) {
    const card = document.createElement("article");
    card.className = "artwork-card";
    if (artwork.format === "portrait") card.classList.add("artwork-card-portrait");
    card.setAttribute("aria-labelledby", `title-${artwork.id}`);

    const imageButton = document.createElement("button");
    imageButton.className = "artwork-image-button";
    imageButton.type = "button";
    imageButton.setAttribute("aria-label", `Try ${artwork.title} from ${groups.find(group => group.id === artwork.group).label} on the site`);
    imageButton.setAttribute("aria-pressed", "false");
    imageButton.addEventListener("click", () => chooseArtwork(artwork.id));

    const image = document.createElement("img");
    image.src = artwork.thumb;
    if (artwork.small && artwork.format !== "portrait") {
      image.srcset = `${artwork.thumb} 480w, ${artwork.small} ${artwork.smallWidth}w, ${artwork.large} ${artwork.largeWidth}w`;
      image.sizes = "(max-width: 480px) calc(100vw - 32px), (max-width: 1480px) 46vw, 678px";
    }
    image.alt = artwork.description;
    image.width = artwork.thumbWidth || 480;
    image.height = artwork.thumbHeight;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      if (image.dataset.fallback) return;
      image.dataset.fallback = "true";
      image.removeAttribute("srcset");
      image.src = artwork.original;
    });

    const badge = document.createElement("span");
    badge.className = "selected-badge";
    badge.textContent = "In preview";
    badge.hidden = true;
    badge.setAttribute("aria-hidden", "true");
    imageButton.append(image, badge);

    const titleRow = document.createElement("div");
    titleRow.className = "card-title-row";
    const title = document.createElement("h3");
    title.id = `title-${artwork.id}`;
    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent = String(index + 1).padStart(2, "0");
    title.append(number, artwork.title);
    const category = document.createElement("p");
    category.className = "card-category";
    category.textContent = artwork.category;
    titleRow.append(title, category);

    const description = document.createElement("p");
    description.className = "card-description";
    description.textContent = artwork.description;

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const tryButton = document.createElement("button");
    tryButton.type = "button";
    tryButton.className = "try-button";
    tryButton.textContent = "Try on site";
    tryButton.setAttribute("aria-label", imageButton.getAttribute("aria-label"));
    tryButton.setAttribute("aria-pressed", "false");
    tryButton.addEventListener("click", () => chooseArtwork(artwork.id));

    const download = document.createElement("a");
    download.className = "download-link";
    download.href = artwork.original;
    download.download = `${artwork.id}.png`;
    download.textContent = "Download PNG ↓";
    download.setAttribute("aria-label", `Download original ${artwork.title} PNG`);
    const view = document.createElement("a");
    view.className = "download-link";
    view.href = artwork.large;
    view.target = "_blank";
    view.rel = "noopener";
    view.textContent = "View image";
    view.setAttribute("aria-label", `View ${artwork.title} image`);
    actions.append(tryButton, view, download);
    if (artwork.prompt) {
      const prompt = document.createElement("a");
      prompt.className = "download-link";
      prompt.href = artwork.prompt;
      prompt.target = "_blank";
      prompt.rel = "noopener";
      prompt.textContent = "Prompt";
      prompt.setAttribute("aria-label", `View ${artwork.title} generation prompt`);
      actions.append(prompt);
    }
    card.append(imageButton, titleRow, description, actions);
    cardElements.set(artwork.id, { card, imageButton, tryButton, badge });
    return card;
  }

  for (const group of groups) {
    const options = document.createElement("optgroup");
    options.label = group.label;
    for (const [index, artwork] of artworks.filter((item) => item.group === group.id).entries()) {
      const option = document.createElement("option");
      option.value = artwork.id;
      option.textContent = artwork.title;
      options.append(option);
      group.grid.append(createCard(artwork, index));
    }
    controls.art.append(options);
  }

  const defaultArtwork = artworks.find((artwork) => artwork.id === (window.SAGE_DEFAULT_SCENE || "01-ridgelines")) || artworks[0];
  if (defaultArtwork) controls.art.value = defaultArtwork.id;
  const defaultPlacement = window.SAGE_DEFAULT_PLACEMENT || "editorial";
  controls.placement.value = Object.hasOwn(treatmentStrengths, defaultPlacement) ? defaultPlacement : "editorial";
  controls.strength.value = "100";
  controls.original.checked = false;
  const defaults = Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.type === "checkbox" ? control.checked : control.value]));
  function restoreComparison() {
    const saved = new URLSearchParams(location.hash.slice(1));
    const currentVersion = saved.get("scene") === "9";
    for (const [key, control] of Object.entries(controls)) {
      if (control.type === "checkbox") control.checked = defaults[key];
      else control.value = defaults[key];
      if (!saved.has(key)) continue;
      if (!currentVersion && !["art", "page", "theme", "width", "accent"].includes(key)) continue;
      const value = saved.get(key);
      if (control.type === "checkbox") control.checked = value === "true";
      else if (key === "strength") {
        const number = Number(value);
        if (value.trim() && Number.isFinite(number)) control.value = String(Math.min(100, Math.max(5, number)));
      } else if (Array.from(control.options).some(option => option.value === value)) control.value = value;
    }
  }
  restoreComparison();
  // Links to another comparison can change only the hash of an already-open
  // gallery. Apply those selections without requiring a page reload.
  window.addEventListener("hashchange", () => {
    restoreComparison();
    sendPreview();
  });
  focusOnReady = controls.page.value === "about" && controls.placement.value === "closing";
  // Older links retain artwork and display preferences while opening the new composition at full strength.
  document.getElementById("preview-controls").addEventListener("submit", (event) => event.preventDefault());
  for (const [name, control] of Object.entries(controls)) {
    if (name === "placement") continue;
    control.addEventListener(name === "strength" ? "input" : "change", sendPreview);
  }
  for (const button of treatmentButtons) button.addEventListener("click", () => chooseTreatment(button.dataset.placement));
  controls.placement.addEventListener("change", () => {
    controls.strength.value = String(treatmentStrengths[controls.placement.value]);
    controls.original.checked = false;
    sendPreview();
    focusArtwork();
  });

  frame.addEventListener("load", () => {
    previewReady = true;
    sendPreview();
  });
  jumpArtwork.addEventListener("click", focusArtwork);
  pageTop.addEventListener("click", () => {
    frame.contentWindow?.postMessage({ type: "sage-focus", position: "top" }, "*");
  });
  window.addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow || !event.data || typeof event.data !== "object") return;
    if (event.data.type === "sage-ready") {
      previewReady = true;
      sendPreview();
    }
    if (event.data.type === "sage-theme" && ["light", "dark"].includes(event.data.theme)) {
      controls.theme.value = event.data.theme;
      sendPreview();
    }
    if (event.data.type === "sage-navigate" && Object.hasOwn(pageFiles, event.data.page)) {
      controls.page.value = event.data.page;
      sendPreview();
    }
  });

  sendPreview();
})();
