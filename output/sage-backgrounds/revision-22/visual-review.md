# Homepage cloud composition review

The previous homepage cloud occupied a roughly 152 × 560 CSS pixel strip at a 1440px viewport. Its detailed edge repeatedly met the same gutter boundary. The revision changes both the source composition and the way it is positioned.

## Selected composition

- A 1374 × 1145 source with broader cloud forms, an overhead bank, and a naturally painted opening around the header.
- A 500 CSS pixel canvas in the default view, extending beyond the viewport at top and left. No homepage CSS mask or gutter-width clipping.
- An edge that changes reach substantially: cloud across the top, deeper irregular recesses down the left, and clear space before Latest.
- Native image proportions and upright ASCII characters, with existing Golden hour and dark-mode presentation filters.

## Independent review

The visual reviewer compared the complete homepage against revision 21 and checked both themes. They found the rectangular strip removed, the theme control and name in clear space, and the new framing meaningfully improved. They also noted that the result remains a modest corner accent, especially in dark mode. The selected version keeps the lower-right cloud as the main artwork and leaves the centered content in its existing positions.

The first square source was rejected for this placement because keeping the header clear cropped away too much cloud volume and left texture near the theme button. That study is preserved as `details/cloud-corner-expansive-v1.*`.

## Verification

`gallery-checks.json` records the interactive size choices, secondary-page independence, state persistence, Original comparison, mobile visibility, and hover navigation. `accessibility/results.json` records content geometry, keyboard interaction, responsive behavior, secondary-page visual comparisons, and read-only counter requests. Screenshot capture blocks external requests; the full-page captures may display `visits offline` without changing the live total.

The secondary comparison detected 15 pixels differing by one color-channel level in the Archive footer. A focused recheck confirmed identical geometry, image sources, and computed artwork styles. This negligible raster rounding is documented in `accessibility/archive-recheck.json`; the other 19 secondary captures were identical. The reviewed verification result is in `verification-summary.json`.
