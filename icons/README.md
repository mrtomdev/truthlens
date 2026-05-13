# Icons

Chrome packs PNGs into `chrome.action`'s `default_icon`. We ship a single SVG
source (`icon.svg`) and reference it from the manifest as PNGs that you can
generate with any rasteriser (Inkscape, rsvg-convert, ImageMagick, or an
online tool).

```bash
# Examples (any tool works — output filenames matter):
rsvg-convert -w 16  icons/icon.svg -o icons/icon16.png
rsvg-convert -w 32  icons/icon.svg -o icons/icon32.png
rsvg-convert -w 48  icons/icon.svg -o icons/icon48.png
rsvg-convert -w 128 icons/icon.svg -o icons/icon128.png
```

If you load the extension before generating the PNGs, Chrome will show a
default puzzle-piece icon. Functionality is unaffected.
