const buttons = document.querySelectorAll('[data-method]');
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const method = button.dataset.method;
    const label = method === 'raw' ? 'raw-pixel L2' : 'edge-based L2';
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelectorAll('.results-grid .result-card').forEach(card => {
      const path = `assets/${card.dataset.image}-${method}.jpg`;
      const img = card.querySelector('img');
      img.src = path;
      img.alt = `${card.dataset.title}, reconstructed with ${label} alignment`;
      card.querySelector('a').href = path;
      card.querySelector('.offset-caption').textContent = card.dataset[`${method}Offsets`];
    });
    document.querySelector('.gallery-status').textContent = `Showing ${label} · 3 single-scale JPEGs and 14 pyramid TIFFs.`;
  });
});
