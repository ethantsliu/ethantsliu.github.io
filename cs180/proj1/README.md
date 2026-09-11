# CS 180 Project 1 — website

The site follows the existing Project 0 page at `../index.html`, sharing its
Berkeley blue/gold palette, cream paper background, serif headings, and section
layout. It is a static site; open `index.html` directly or serve the portfolio:

```sh
python3 -m http.server 1801 --bind 127.0.0.1
```

From the portfolio root, visit http://127.0.0.1:1801/cs180/proj1/.

## Revising the writeup

- Edit the main writeup in `tools/page-template.html`.
- Edit gallery titles and captions in `tools/build_page.py`.
- Run `python3 tools/build_page.py` from this directory to update `index.html`.
- Appearance: `styles.css`, on top of Project 0's `../styles.css`.
- Interactions: `script.js`. The gallery and writeup are static HTML and remain
  readable without JavaScript. Full-image links and offset downloads work locally.

## Image provenance and reproduction

Source folder: `/Users/EthanLiu/Documents/Programming/CS180_fa2026_proj1_data`.
The original Python script, scans, and saved colorized images are not modified.

`tools/build_assets.py` reads the existing `align()` and `edges()` functions with
Python AST, avoiding the script's top-level GUI and file writes. It reruns the
same search on both raw channel intensities and edge maps. Both displayed sets
are regenerated so the images and offsets correspond to the same run. Web JPEGs
are resized to at most 1,600 pixels after full-resolution alignment; no image
borders are cropped. No AI-generated images are used.

On this Mac, run from this directory:

```sh
OPENBLAS_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 arch -arm64 \
  /Users/EthanLiu/Documents/Programming/CS180_fa2026_proj1_data/.venv/bin/python \
  tools/build_assets.py \
  /Users/EthanLiu/Documents/Programming/CS180_fa2026_proj1_data
python3 tools/build_page.py
```

Elsewhere use a Python environment with NumPy, OpenCV, and Pillow. The source
script hash, measured offsets, search settings, and alignment-only runtimes are
in `assets/results.json`; offsets are also in `assets/offsets.csv`.

## Review before submission

- The Fall 2026 assignment requires 14 provided scans plus at least three
  personally selected scans. Only 14 scans were found locally; which are supplied
  versus personal selections still needs confirmation. Collection coverage remains unresolved; this is tracked here rather than on the project page.
- The raw-pixel L2 run visibly fails on Church and has noticeable fringes on
  Emir. Both are described and compared with the edge-based results. The page
  does not claim the baseline meets the assignment's alignment tolerance.
- The existing pyramid uses strided sampling without a low-pass filter and
  OpenCV's 8-bit grayscale loading, including for TIFF inputs. The writeup
  describes the actual code, rather than claiming Gaussian downsampling or
  preservation of 16-bit precision.
- Publishing and course submission are separate steps.

Assignment: https://cal-cs180.github.io/fa26/hw/proj1/index.html
