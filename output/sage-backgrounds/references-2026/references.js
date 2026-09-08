const references = [
  {
    id: 'josh', name: 'Josh Comeau', title: 'Art shapes the page boundary.', url: 'https://www.joshwcomeau.com/',
    observed: 'A blue illustrated sky ends in an irregular white edge. The avatar sits at that transition; articles and their sidebar sit on the white surface below. Farther down, the reading area remains plain.',
    transfer: 'A ridge, tide, or botanical form could define the edge of a section. This gives the artwork a structural job and lets it stay visible without placing detail under sentences.',
    limit: 'The mascot, bright palette, and tall opening are specific to Josh’s playful identity. Your version would need a calmer treatment and a shorter opening.',
    views: [
      { label: 'Opening', file: 'josh-desktop.png', alt: 'A blue sky, layered cloud shapes, and a seated avatar border a white area containing an article feed and sidebar.' },
      { label: 'Reading area', file: 'josh-reading.png', alt: 'Josh Comeau’s article feed continues on a plain white reading surface below the illustrated opening.' },
      { label: 'Mobile', file: 'josh-mobile.png', alt: 'The illustrated opening of Josh Comeau’s site at a narrow mobile width.' }
    ]
  },
  {
    id: 'maggie', name: 'Maggie Appleton', title: 'Art and prose share the paper.', url: 'https://maggieappleton.com/ai-dark-forest',
    observed: 'In the Dark Forest essay, the drawing expands wider than the centered prose. Its white ground meets the page without a frame. On the homepage, illustrated essay covers sit alongside a compact list of notes.',
    transfer: 'The artwork can have its own width and visual weight while your text keeps its centered alignment. It can feel printed onto the page, with real detail and a clear silhouette.',
    limit: 'These drawings explain specific essays. We would still need a reason for a landscape to appear at a particular point in your biography or recent work.',
    views: [
      { label: 'Drawing in an essay', file: 'maggie-essay-illustration.png', alt: 'Centered paragraphs lead into a wider black line drawing of trees and underground layers on the same white paper.', url: 'https://maggieappleton.com/ai-dark-forest' },
      { label: 'Essay covers & notes', file: 'maggie-home-essays.png', alt: 'Large illustrated essay covers occupy two columns beside a compact text list of notes.', url: 'https://maggieappleton.com/' },
      { label: 'Homepage opening', file: 'maggie-home-desktop.png', alt: 'Maggie Appleton’s homepage opens with a large typographic introduction on warm off-white paper.', url: 'https://maggieappleton.com/' }
    ]
  },
  {
    id: 'anthropic', name: 'Anthropic Research', title: 'Art belongs to a featured story.', url: 'https://www.anthropic.com/research',
    observed: 'A substantial illustration leads a research feature, with its headline immediately below. Shorter stories sit alongside it. The publication index then returns to a full-width text table.',
    transfer: 'One selected project or essay could carry a strong illustration. That provides a natural place for art within a scholarly page, while keeping the complete publication list easy to scan.',
    limit: 'The illustration represents that particular story. Choosing an arbitrary background for a random update would give it a weaker connection to the content.',
    views: [
      { label: 'Feature & publications', file: 'anthropic-research-feature-desktop.png', alt: 'A large sage research illustration with its headline below sits beside related stories, above a publication table.' },
      { label: 'Mobile feature', file: 'anthropic-research-feature-mobile.png', alt: 'The research illustration stacks above its headline and prose on mobile.' },
      { label: 'Page opening', file: 'anthropic-research-desktop.png', alt: 'The opening of Anthropic’s research page on a warm neutral background.' }
    ]
  },
  {
    id: 'stripe', name: 'Stripe Press', title: 'The artwork is an object.', url: 'https://press.stripe.com/built-to-grow',
    observed: 'A complete, richly patterned book occupies the left side of its detail page, with a separate prose column on the right. The homepage turns the collection of book spines into the main browsing experience.',
    transfer: 'A graphic could be presented as a deliberate visual object with a title or caption. Its texture and composition stay intact, and surrounding words have their own space.',
    limit: 'The 3D catalog is a theatrical experience built around books. Its scale and interaction would demand a lot of attention on a personal research site.',
    views: [
      { label: 'Book & prose', file: 'stripe-book-desktop.png', alt: 'A large teal and gold marbled book floats on the left of a dark page, with gold serif description text on the right.' },
      { label: 'Collection', file: 'stripe-home-desktop.png', alt: 'Stripe Press presents a large three-dimensional stack of illustrated book spines.', url: 'https://press.stripe.com/' },
      { label: 'Mobile', file: 'stripe-book-mobile.png', alt: 'A complete illustrated book appears above its title and description on mobile.' }
    ]
  },
  {
    id: 'ink', name: 'Ink & Switch', title: 'Drawings punctuate the content.', url: 'https://www.inkandswitch.com/',
    observed: 'Below a full-screen anniversary artwork, the research overview becomes a plain centered document. Small, bold hand-drawn symbols align with each research-area description.',
    transfer: 'A consistent drawing style could recur beside selected sections and links. Repetition and alignment can establish an artistic identity across pages with very little visual area.',
    limit: 'These are purposeful category symbols, not landscape scenes. The full-screen anniversary opening is a different, much more dominant choice.',
    views: [
      { label: 'Research overview', file: 'ink-switch-home-research.png', alt: 'A centered research overview pairs small black hand-drawn symbols with research-area headings and paragraphs.' },
      { label: 'Anniversary opening', file: 'ink-switch-home-desktop.png', alt: 'A black full-screen anniversary artwork made of scattered letterforms opens Ink and Switch’s homepage.' }
    ]
  },
  {
    id: 'wafer', name: 'Wafer', title: 'Text occupies a clearing in a scene.', url: 'https://www.wafer.ai/',
    observed: 'The opening is a large glyph-textured cloud scene, with a short central headline placed in comparatively clear sky. Farther down, denser product copy occupies quiet areas and separate panels.',
    transfer: 'If your art is a setting for your name and introduction, the empty space needs to be part of its composition. A legible clearing can coexist with strong detail elsewhere in the scene.',
    limit: 'Wafer’s hero carries very little text compared with your biography and Latest section. Extending the same detailed scene beneath the whole list would be a different composition.',
    views: [
      { label: 'Opening scene', file: 'wafer-desktop.png', alt: 'Wafer’s large sage and cream cloud scene surrounds a short centered heading in clear sky.' },
      { label: 'Following sections', file: 'wafer-reading.png', alt: 'The bottom of Wafer’s cloud scene leads into darker product sections with separated text and visuals.' },
      { label: 'Mobile', file: 'wafer-mobile.png', alt: 'The opening cloud scene and centered headline on Wafer’s mobile layout.' }
    ]
  }
];

const sites = document.getElementById('sites');
const views = document.getElementById('views');
let selected = references.findIndex(reference => reference.id === location.hash.slice(1));
if (selected < 0) selected = 0;
let selectedView = 0;

function updateImage() {
  const reference = references[selected];
  const view = reference.views[selectedView];
  const screenshot = document.getElementById('screenshot');
  screenshot.src = view.file;
  screenshot.alt = view.alt;
  document.getElementById('image-link').href = view.file;
  document.getElementById('full-image').href = view.file;
  document.getElementById('source').href = view.url || reference.url;
  document.getElementById('caption').textContent = `${reference.name} · ${view.label} · Actual site screenshot, September 8, 2026. Click the image to inspect at full size.`;
  [...views.children].forEach((button, index) => button.setAttribute('aria-pressed', String(index === selectedView)));
}

function renderReference() {
  const reference = references[selected];
  [...sites.children].forEach((button, index) => button.setAttribute('aria-pressed', String(index === selected)));
  document.getElementById('number').textContent = `${String(selected + 1).padStart(2, '0')} / ${references.length} · ${reference.name}`;
  for (const key of ['title', 'observed', 'transfer', 'limit']) document.getElementById(key).textContent = reference[key];
  views.replaceChildren();
  reference.views.forEach((view, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = view.label;
    button.addEventListener('click', () => { selectedView = index; updateImage(); });
    views.append(button);
  });
  updateImage();
}

references.forEach((reference, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = reference.name;
  button.addEventListener('click', () => {
    selected = index;
    selectedView = 0;
    history.replaceState(null, '', `#${reference.id}`);
    renderReference();
  });
  sites.append(button);
});

window.addEventListener('hashchange', () => {
  const index = references.findIndex(reference => reference.id === location.hash.slice(1));
  if (index >= 0) { selected = index; selectedView = 0; renderReference(); }
});
renderReference();
