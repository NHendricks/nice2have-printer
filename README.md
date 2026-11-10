# nice2have-printer

Print-ready posters in plain HTML + CSS, exported as an exact DIN A0 PDF.

## TL;DR

- **What:** a print-ready poster ("canvas") in plain HTML + CSS → exact DIN A0 PDF. No npm packages; needs only Node ≥ 22 and Chrome/Edge.
- **Edit:** content in `index.html`, styles in `canvas.css`. All sizes as `calc(n * var(--u))`, never fixed px.
- **Run:** `npm run check` · `npm run shot` (→ `shot.png`) · `npm run pdf` (→ `canvas-a0.pdf`). After every change: `npm run shot` and look at the image.
- **Format:** exactly A0 portrait, 841 × 1189 mm. Other format: change the three places marked `FORMAT` (see "Other DIN formats").
- **Fonts:** Poppins in `fonts/` (free, OFL) – see `fonts/README.txt`.
- **Example:** `examples/ad/` (build there with `node ../../nice2have-printer.mjs pdf`).

Details below.

---

## Project

Tool for designing a print-ready **canvas** (poster, placard, notice) in plain HTML + CSS, with no npm dependencies. The installed Chrome/Edge checks the canvas, takes screenshots and outputs the PDF in the target format (default: DIN A0 portrait).

Requires only **Node ≥ 22** (built-in `WebSocket`/`fetch`) and **Chrome, Chromium or Edge**. No `npm install`, no build, no dev server. Runs on **Windows, macOS and Linux** (see "Operating systems").

### Structure

- `README.md` – this file. `CLAUDE.md` – instructions for Claude Code (print requirement, check workflow); it imports this README.
- `index.html` – the canvas as static HTML. Includes only `canvas.css`, no JavaScript needed.
- `canvas.css` – format (`@page`, `--w`/`--h`, `--u`), font (`@font-face`), print settings, plus an example layout (header, author line, three-column content, footer) to adapt. The area is the `.canvas` element.
- `fonts/poppins-{400,500,600,700}.woff2` – default font Poppins, local (Latin subset, covers German incl. „“ – …). Different font: put the woff2 files in `fonts/` and adjust `@font-face`.
- `fonts/README.txt` – where Poppins comes from, how to get and add other fonts (Google Fonts, Fontsource, foundries; licenses; open replacements for system fonts).
- `fonts/OFL.txt` – license of Poppins (SIL Open Font License 1.1, from the official Google Fonts repository). Free for private and commercial use and PDF embedding; the font files must not be sold on their own, and this license file must stay next to them whenever they are passed on. When adding another font, put its license file in `fonts/` as well.
- `img/` – images, referenced relatively (`src="img/name.jpg"`)
- `nice2have-printer.mjs` – check, screenshot and PDF via Chrome's DevTools protocol (Node built-ins only). The target format is at the top in `const FORMAT`.
- `examples/ad/` – example canvas: an A0 advertising poster for this tool (own `index.html` + `canvas.css`, fonts from `../../fonts`). Build it from that folder: `node ../../nice2have-printer.mjs shot|pdf`. Further canvases can live next to it the same way (`examples/<name>/`).

### Commands

- `npm run check` – check format, overflow, free space, images, fonts and errors
- `npm run shot` – check and write `shot.png` (other name: `npm run shot -- file.png`)
- `npm run pdf` – check and write `canvas-a0.pdf` (name follows the format; other name: `npm run pdf -- name.pdf`)
- Works the same without npm: `node nice2have-printer.mjs check|shot|pdf [file]`. The script always uses `index.html` in the current directory.
- Set the browser path via the `CHROME` environment variable if needed (otherwise the usual paths for each OS are searched).
- To view it, just double-click `index.html`; the page works via `file://`.

### Operating systems

`nice2have-printer.mjs` searches for the browser depending on the OS:

| OS | Paths searched (in this order) |
|---|---|
| Windows | Chrome under `Program Files`, `Program Files (x86)`, `%LOCALAPPDATA%`, then Edge |
| macOS | `/Applications/<App>.app/Contents/MacOS/<App>` and the same under `~/Applications`, for Google Chrome, Chromium, Microsoft Edge, Chrome Canary, Brave |
| Linux | `google-chrome`, `google-chrome-stable`, `chromium`, `chromium-browser`, `microsoft-edge` in `/usr/bin`, `/usr/local/bin`, `/snap/bin` |

Different location: set the `CHROME` environment variable.

- macOS / Linux: `export CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` (quotes because of the spaces)
- Windows (PowerShell): `$env:CHROME = "C:\path\to\chrome.exe"`

Notes for macOS:

- Install Node ≥ 22 (e.g. `brew install node` or from nodejs.org); check with `node --version`.
- Chrome starts invisibly (headless) with its own throwaway profile in the temp folder. Your normal Chrome can stay open.
- `--use-mock-keychain` prevents the keychain prompt ("Chrome Safe Storage"), which could otherwise block the run.
- If Chrome does not respond within 30 s, the script aborts with Chrome's output instead of hanging.
- The font fallback lists `system-ui`/`-apple-system` before `Segoe UI`; normally Poppins is loaded from `fonts/` anyway.
- The result (PDF, screenshot) is the same on all systems as long as the same fonts are loaded. System fonts (e.g. Calibri for recreated worksheets) are usually missing on a Mac – put such fonts as woff2 in `fonts/` so the layout looks the same everywhere.

### Layout rules (format-independent)

- The `.canvas` area is fixed at `var(--w) × var(--h)`. No `max-width`, no mobile breakpoints, no scaling to the viewport – that would change the format.
- All sizes are based on the unit `--u`, e.g. `calc(11.5 * var(--u))`. This lets you scale everything proportionally without hunting for individual px values. Never use fixed px or pt values in the layout.
- The body is `display: block; width: var(--w)` and must not centre the canvas. The canvas is wider than the viewport and would otherwise slide out to the left.
- The height is a fixed budget: header, author line, content, footer. The content area (`.content`) takes the rest (`flex: 1`). Content that is too large gets clipped at the bottom (`overflow: hidden`) – so check after every change.
- All paths relative (`img/…`, `fonts/…`) so the page works via `file://`. No absolute paths (`/img/…`).
- `print-color-adjust: exact` on `html, body` makes sure backgrounds are printed in the PDF.
- Decorative elements that should not take up space (e.g. a round image cut-out sitting on an edge) go in with `position: absolute`.
- Floats in cards: give the card `display: flow-root` so it wraps around the image.

### Checking (screenshots)

1. Run `npm run shot`.
2. Check the output:
   - `Format: … mm OK (A0)` – otherwise `.canvas` does not match the target format.
   - `Free space`: for every element with `data-measure="Name"`, the distance from the last child to the inner bottom edge. **Negative means: does not fit.** Put the attribute on areas whose fill level matters (e.g. each column).
   - `Fonts`: the web fonts that loaded; if one is missing, a system font is used.
   - Lines with `!!`: clipped content (elements with `overflow: hidden` whose content is larger), elements past the edge, missing images, console and load errors, PDF page differs from the format.
3. Open `shot.png`. The screenshot is 96 dpi (A0: 3179 × 4494 px), i.e. 1 px = 1 CSS pixel; zoom in to check details.
4. Watch for: clipped text or images, overlapping elements, unwanted empty areas.
5. For detailed measurements, extend the `Runtime.evaluate` expression in `nice2have-printer.mjs` (`getBoundingClientRect()`) instead of guessing values. If space runs out, adjust image widths and spacing first, the font size last.

### PDF export

`npm run pdf` starts headless Chrome with `--remote-debugging-port`, loads `index.html` and prints via the DevTools command `Page.printToPDF` (`paperWidth/-Height` from `FORMAT` in inches, margins 0, `printBackground: true`, `preferCSSPageSize: true`).

- Text, SVG and CSS areas stay vector; fonts are embedded. Only images are pixels.
- A0 result: 1 page, MediaBox `[0 0 2383.92 3371.04]` pt = 841.0 × 1189.2 mm. Chrome rounds to pixels (up to approx. 0.3 mm). The script prints the page count and MediaBox and warns if there is more than one page or more than 1 mm deviation from the format.
- Do **not** use `chrome --print-to-pdf` on the command line: it ignores `@page size` and prints on US Letter (several pages).
- The browser's print dialog often doesn't offer large formats. For printing, always use the PDF from `npm run pdf`, not Ctrl+P.

### How DIN A0 is implemented (reference)

Together these points produce an exact A0 PDF; they apply the same way to any other format:

1. **Paper size in CSS:** `@page { size: 841mm 1189mm portrait; margin: 0 }` – always in mm, no keyword (Chrome knows `A3`/`A4`/`A5`, but not `A0`–`A2`).
2. **Area at print size:** `.canvas` is `var(--w) × var(--h)` = 841 × 1189 mm, `overflow: hidden`, body not centred and the same width.
3. **Base unit:** `--u: 3.6px`; all sizes as multiples of it. Body text `11.5 × --u` ≈ 31 pt, heading `20 × --u` ≈ 54 pt, title `26.5 × --u` ≈ 72 pt.
4. **Check in the browser:** viewport = format size at 96 dpi (3179 × 4494 px), then measure format, overflow, images, fonts.
5. **PDF via DevTools:** `Page.printToPDF` with paper size from `FORMAT`, margins 0, backgrounds on, CSS page size preferred. Then check the page count (= 1) and MediaBox.
6. **Local font**, so it loads via `file://` and gets embedded in the PDF.

### Other DIN formats

Changing the format affects exactly **three places** (marked `FORMAT` in the code):

| Place | A0 (current) | Example A4 |
|---|---|---|
| `canvas.css`, `@page` | `size: 841mm 1189mm portrait;` | `size: 210mm 297mm portrait;` |
| `canvas.css`, `:root` | `--w: 841mm; --h: 1189mm; --u: 3.6px;` | `--w: 210mm; --h: 297mm; --u: 0.9px;` |
| `nice2have-printer.mjs`, top | `FORMAT = { name: 'A0', w: 841, h: 1189 }` | `FORMAT = { name: 'A4', w: 210, h: 297 }` |

Screenshot size, PDF paper size, the format check and the file name (`canvas-a4.pdf`) are derived from these. Tested with A4: 1 page, 210.2 × 297.0 mm, screenshot 794 × 1123 px.

#### Values per format (portrait)

Each step halves the area; the sides shrink by a factor of √2 (≈ 1.414). To carry the layout over unchanged and proportionally, divide `--u` by √2 per step.

| Format | mm (W × H) | Screenshot px (96 dpi) | `--u` proportional | Body text (11.5 × `--u`) | MediaBox approx. (pt) | Target image dpi | Pixels for full width |
|---|---|---|---|---|---|---|---|
| A0 | 841 × 1189 | 3179 × 4494 | 3.6px | ≈ 31 pt | 2384 × 3370 | 150 | ≈ 4970 |
| A1 | 594 × 841 | 2246 × 3179 | 2.55px | ≈ 22 pt | 1684 × 2384 | 150 | ≈ 3510 |
| A2 | 420 × 594 | 1588 × 2246 | 1.8px | ≈ 15.5 pt | 1191 × 1684 | 150–200 | ≈ 2480–3310 |
| A3 | 297 × 420 | 1123 × 1588 | 1.27px | ≈ 11 pt | 842 × 1191 | 300 | ≈ 3510 |
| A4 | 210 × 297 | 794 × 1123 | 0.9px | ≈ 7.8 pt | 595 × 842 | 300 | ≈ 2480 |

(pt = px × 0.75; pixels needed = width in mm / 25.4 × dpi.)

#### What to consider besides the three places

- **Font size by reading distance, not just proportionally:** A0/A1 are read from 1–2 m, A4 from approx. 40 cm. Scaled proportionally, A4 ends up at approx. 8 pt body text – too small. For A4 aim for body text ≥ 10–11 pt (`--u` approx. 1.2–1.3px) and plan for less content, fewer columns (2 rather than 3) or smaller images. For A3, proportional (≈ 11 pt) is just about fine.
- **Image resolution:** Large formats are viewed from a distance, 150 dpi is enough. A3/A4 are read up close, aim for 300 dpi here. Upscayl (see below) helps with images that are too small.
- **Thin lines:** Borders like `1 × --u` get very thin on small formats (A4: 0.9 px ≈ 0.24 mm). Below approx. 0.1 mm lines disappear in print; set minimums then, e.g. `max(1 * var(--u), 0.3mm)`.
- **Screenshot resolution:** On small formats the 96 dpi screenshot is coarse (A4: 794 px wide). For detailed checks, use a higher `deviceScaleFactor` / `scale` (e.g. 3) in `nice2have-printer.mjs` for `Emulation.setDeviceMetricsOverride` and `Page.captureScreenshot`.
- **Landscape:** Swap width and height in all three places (`@page { size: 1189mm 841mm landscape }`, swap `--w`/`--h`, swap `FORMAT.w`/`h`). Redistribute the layout (more columns, flatter header), otherwise lines get very long.
- **Bleed:** If a printer requires bleed (e.g. 3 mm per side), the page gets bigger (A4 → 216 × 303 mm): set `@page`, `--w`/`--h` and `FORMAT` to the bleed size and keep important content at least 3–5 mm away from the trim edge. That is then deliberately no longer "exactly A4" and needs to be agreed with the printer.
- **Multi-page formats (e.g. an A4 handout with several pages):** The tool is designed for exactly one page (the check warns if there are more). For several pages, use several `.canvas` elements with `break-after: page` and adapt the page check in `nice2have-printer.mjs`.
- **Update the "Print requirement" in `CLAUDE.md`** to the new format, otherwise Claude Code keeps enforcing "exactly A0".

### Printing – clarify beforehand

- **Colours:** RGB in the PDF; the printer converts to CMYK, deviations (especially orange) are possible. Ask for a proof.
- **Bleed:** If the printer requires bleed, that conflicts with the fixed format (see above). Clarify beforehand.
- **Image resolution:** see the table; logos preferably as SVG.

## Tips and techniques

### Building from a template

- Measure colours from a clean source (PDF or original file), not from a photo of the print: photos distort colours (gradients, wrong tones). Pixel sampling via a canvas element in the browser.
- Match texts, order and size ratios by comparing screenshot ↔ template.
- Check spelling and clarify deviations from the template with the client before changing them.

### Extracting images from a PDF

- Embedded JPEGs are stored raw (`/DCTDecode`) in the PDF: copy the stream bytes out directly (start `FF D8`, length from `/Length`). No extra tools needed.
- Cropping via a canvas element: determine the background colour from the corners, count rows/columns as image edge only if more than 30 % of the pixels differ (density detection, threshold approx. 10). A plain bounding box leaves remnants of neighbouring text and borders.
- Convert line drawings (black on background) to PNG with transparency (alpha from brightness) instead of using `mix-blend-mode`.
- Vector worksheets (PDF): either recreate them as HTML (text stays sharp in the PDF) or render them to PNG at high resolution with pdf.js (e.g. scale 5 = 360 dpi).

### Upscaling images (Upscayl)

Windows (this machine): Upscayl is in `D:\Programme\upscayl`. Call: `resources\bin\upscayl-bin.exe -i <in.png> -o <out.png> -m D:/Programme/upscayl/resources/models -n high-fidelity-4x -s 4 -f png`.

macOS: the app ships the same command-line program, usually at `/Applications/Upscayl.app/Contents/Resources/bin/upscayl-bin`, models at `/Applications/Upscayl.app/Contents/Resources/models` (check the path before first use). Same parameters.

- Photos: `high-fidelity-4x` (preserves structure); `upscayl-standard-4x` looks smeared.
- Symbols and graphics: `digital-art-4x`.
- Then save photos as JPEG (quality 0.92); keep the originals separately (e.g. in an `originals/` folder).

### Design that has worked well

- Content blocks as cards (lighter tone of the area colour, fine border, rounded corners).
- Consistent image frames per image type: photos with a white border, rounding and soft shadow; worksheets as "paper" (white background, fine grey border, shadow, straight).
- Speech bubbles, arrows and logos as inline SVG so they stay vector in the PDF.

### Helper tools (not installed in the project)

For image work (cropping via a canvas element with Playwright, PDF rendering with `pdfjs-dist`), use the packages temporarily outside the project (e.g. `npm i playwright pdfjs-dist` in a temp folder) and copy only the finished images into `img/`, so the project stays dependency-free.
