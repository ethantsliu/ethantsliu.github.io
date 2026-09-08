/* Shared catalog. Every original artwork remains unchanged. */
window.SAGE_DEFAULT_SCENE = 'clouds-portrait';
window.SAGE_DEFAULT_PLACEMENT = 'editorial';
window.SAGE_SCENES = [
  ['01-ridgelines', 'Ridgelines', 'Landscape', 'Distant layers of hills and fine sage texture.', 'landscape'],
  ['02-tidal', 'Tidal', 'Water', 'Overlapping ripples under a cream horizon.', 'landscape'],
  ['03-meadow', 'Meadow', 'Botanical', 'Fine meadow stems and small field flowers.', 'botanical'],
  ['04-ginkgo', 'Ginkgo', 'Botanical', 'Fan-shaped leaves in sage and cream.', 'botanical'],
  ['05-dunes', 'Dunes', 'Landscape', 'Warm ridges and soft, sculptural sand contours.', 'landscape'],
  ['06-magnolia', 'Magnolia', 'Botanical', 'Pale petals and a delicate magnolia branch.', 'botanical'],
  ['07-flow', 'Flow', 'Abstract', 'Sweeping fields of fine computer texture.', 'landscape'],
  ['08-contours', 'Contours', 'Topographic', 'Measured lines across an imagined terrain.', 'landscape'],
  ['09-rain', 'Rain', 'Atmosphere', 'Rain, grain, and small ripples of light.', 'landscape'],
  ['10-terraces', 'Terraces', 'Landscape', 'Stepped fields in layers of sage and cream.', 'landscape'],
  ['11-fern', 'Fern', 'Botanical', 'Fine fronds unfolding around open space.', 'botanical'],
  ['12-lattice', 'Lattice', 'Geometric', 'A delicate surface of repeating marks.', 'landscape']
].map(([id, title, category, description, family]) => ({
  id, title, category, description, family, group: 'original',
  original: `${id}.png`, prompt: `${id}.json`,
  large: `web/${id}-1280.webp`, small: `web/${id}-640.webp`, thumb: `web/${id}-thumb.webp`,
  largeWidth: 1280, smallWidth: 640, thumbHeight: 270, paper: '#f7f7f3'
})).concat([
  ['s1-clouds', 'Clouds · Original', 'Atmosphere', 'The original landscape: cream cloud banks built from sage characters.'],
  ['s2-ridgelines', 'Ridgelines', 'Landscape', 'Layered mountain contours on neutral paper.'],
  ['s3-tidal', 'Tidal', 'Water', 'Celadon currents and cream channels through the edge.'],
  ['s4-ginkgo', 'Ginkgo', 'Botanical', 'Broad fan leaves with the detail of a botanical print.'],
  ['s5-magnolia', 'Magnolia', 'Botanical', 'Cream blossoms and engraved foliage on neutral paper.'],
  ['s6-flow', 'Flow', 'Abstract', 'Fine computational streamlines in sage and ivory.'],
  ['s7-dunes', 'Dunes', 'Landscape', 'Sweeping sand forms with sage shadows and warm ridges.'],
  ['s8-orbits', 'Orbits', 'Abstract', 'Open orbital bands crossing the edge of the page.']
].map(([id, title, category, description]) => ({
  id, title, category, description, family: 'edge', group: 'edge',
  original: `scenes/${id}.png`, prompt: `scenes/${id}.json`,
  large: `web/${id}-1600.webp`, small: `web/${id}-800.webp`, thumb: `web/${id}-thumb.webp`,
  largeWidth: 1600, smallWidth: 800, thumbHeight: 271, paper: '#f7f7f3'
})));

// Portraits are separate drawings, so give them separate selectable identities.
// Every card, homepage placement, and download refers to the same composition.
for (const [name, title, version, description] of [
  ['clouds', 'Clouds', 4, 'A tall ASCII drawing with ivory highlights and muted blue-green shadows.'],
  ['ginkgo', 'Ginkgo', 2, 'A tall branch of character-built fan leaves, with open paper above.'],
  ['tidal', 'Tidal', 2, 'A tall field of waves modeled with small sage characters.']
]) {
  const base = `portraits/${name}-ascii-v${version}`;
  window.SAGE_SCENES.push({
    id: `${name}-portrait`, title: `${title} · Portrait`,
    category: 'ASCII', description, family: 'edge', group: 'portrait',
    original: `${base}.png`, prompt: `${base}.json`,
    large: `${base}.webp`, small: `${base}.webp`, thumb: `${base}.webp`,
    largeWidth: 1173, smallWidth: 1173, thumbWidth: 1173, thumbHeight: 1341,
    width: 1173, height: 1341, paper: '#f7f7f3', format: 'portrait',
    naturalEdge: true
  });
}
