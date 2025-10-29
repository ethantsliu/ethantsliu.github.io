document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (!body) return;
  if (document.querySelector('.pond-overlay')) return;

  if (body.dataset.pond === 'off') return;

  // Temporarily disable decorative overlay
  return;
});
