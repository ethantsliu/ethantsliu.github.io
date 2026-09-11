"""Export a reproducible web gallery from the existing Project 1 implementation.

Run with the data folder's Python environment (arm64 on this Mac):
  arch -arm64 /path/to/data/.venv/bin/python tools/build_assets.py /path/to/data

The original script and images are read only. Its align()/edges() functions
are extracted with AST so its top-level plotting/saving code is never executed.
The raw-pixel baseline uses the same align() function without edge extraction.
"""

import argparse
import ast
import csv
import hashlib
import json
from pathlib import Path
from time import perf_counter

import cv2 as cv
import numpy as np
from PIL import Image


def export(image, path, max_size=1600):
    if isinstance(image, np.ndarray):
        image = Image.fromarray((np.clip(image, 0, 1) * 255).astype(np.uint8))
    image = image.convert("RGB")
    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    image.save(path, quality=88, optimize=True, progressive=True)
    return list(image.size)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("data", type=Path)
    args = parser.parse_args()
    output = Path(__file__).resolve().parents[1] / "assets"
    output.mkdir(exist_ok=True)
    source = args.data / "colorize_skel.py"
    module = ast.parse(source.read_text())
    functions = ast.Module(body=[n for n in module.body if isinstance(n, ast.FunctionDef) and n.name in {"align", "edges"}], type_ignores=[])
    namespace = {"np": np}
    exec(compile(functions, str(source), "exec"), namespace)
    align, edges = namespace["align"], namespace["edges"]
    records = []
    for result in sorted(args.data.glob("*_colorized.jpg")):
        name = result.stem.removesuffix("_colorized")
        original = args.data / f"{name}.tif"
        if not original.exists():
            original = args.data / f"{name}.jpg"
        # Match the existing script exactly, including its 8-bit grayscale load.
        plate = cv.imread(str(original), 0).astype(np.float32) / 255
        height = plate.shape[0] // 3
        blue, green, red = (plate[i * height:(i + 1) * height] for i in range(3))
        record = {"id": name, "source": original.name, "source_dimensions": list(reversed(plate.shape)),
                  "channel_dimensions": [plate.shape[1], height],
                  "mode": "pyramid" if min(blue.shape) > 1000 else "single-scale"}
        for method in ("raw", "edges"):
            started = perf_counter()
            reference = edges(blue) if method == "edges" else blue
            gs = align(edges(green) if method == "edges" else green, reference)
            rs = align(edges(red) if method == "edges" else red, reference)
            seconds = perf_counter() - started
            rgb = np.dstack([np.roll(red, rs, axis=(0, 1)), np.roll(green, gs, axis=(0, 1)), blue])
            record[method] = {"green_xy": [int(gs[1]), int(gs[0])], "red_xy": [int(rs[1]), int(rs[0])], "seconds": round(seconds, 3)}
            if method == "raw":
                export(rgb, output / f"{name}-raw.jpg")
            else:
                # Reproduce the current implementation so the displayed pixels
                # and reported offsets come from the same run. Preserve borders.
                record["display_dimensions"] = export(rgb, output / f"{name}-edges.jpg")
                saved = np.asarray(Image.open(result).convert("RGB"), dtype=np.float32) / 255
                record["edges"]["saved_output_mean_absolute_error"] = round(float(np.abs(saved - rgb).mean()), 6)
            print(f"{name:20s} {method:5s} G(x,y)={record[method]['green_xy']} R(x,y)={record[method]['red_xy']} {seconds:.2f}s", flush=True)
        if name in {"cathedral", "emir"}:
            export(np.dstack([red, green, blue]), output / f"{name}-unaligned.jpg")
        if name == "cathedral":
            export(Image.open(original), output / "cathedral-plate.jpg", 900)
            for label, channel in (("blue", blue), ("green", green), ("red", red)):
                export(channel, output / f"cathedral-{label}.jpg", 450)
        records.append(record)
    metadata = {"source_script_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                "offset_convention": "(x, y), positive right/down, green and red shifted relative to blue",
                "parameters": {"metric": "L2", "initial_search_radius": 15, "refinement_radius": 2,
                               "pyramid_factors": [16, 8, 4, 2, 1], "pyramid_threshold": 1000,
                               "border_crop": "min(level.shape) // 10 pixels on every side",
                               "downsampling": "strided subsampling, no prefilter", "input": "OpenCV 8-bit grayscale / 255"},
                "images": records}
    (output / "results.json").write_text(json.dumps(metadata, indent=2) + "\n")
    with (output / "offsets.csv").open("w", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["image", "method", "green_x", "green_y", "red_x", "red_y", "seconds"])
        for item in records:
            for method in ("raw", "edges"):
                writer.writerow([item["id"], method, *item[method]["green_xy"], *item[method]["red_xy"], item[method]["seconds"]])


if __name__ == "__main__":
    main()
