# Homepage release

The approved revision 36 crane placement is now applied to the production `index.html`. The root homepage already used the approved golden-hour cloud portrait and Latest layout; this release adds the matching crane flock at the final size and position.

The production crane WebP in `photos/cranes-ascii.webp` is an unchanged copy of `motifs/cranes-ascii-v1.webp`. The decorative CSS background appears at widths of at least 1280 pixels and is not requested below that width. Its source renders at 216 × 180 pixels, with `top: 30px` and the approved horizontal offset.

Production navigation, persisted theme preference, and the existing visit-counter endpoint and increment behavior remain in `site.js`. The interactive gallery remains available separately.

Browser checks compare homepage content, artwork and text bounds, colors, and overflow against the approved preview at 390, 768, 1280, 1440, and 1920 pixels in both themes. Additional checks cover saved theme reload, desktop hover and click, Escape focus restoration, production navigation, and mobile taps. All counter requests are mocked, verifying one `PATCH +1` per homepage load without changing the live count. The screenshots therefore display a fixture count of 12,345.
