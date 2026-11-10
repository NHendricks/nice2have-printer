FONTS
=====

TL;DR
- Poppins (Google Fonts, via @fontsource/poppins 5.3.0), Latin subset,
  weights 400/500/600/700. Free, also commercially. Keep OFL.txt next to it.
- New font: download from fonts.google.com or fontsource.org, put the files
  plus their license in this folder, add one @font-face per weight in
  canvas.css, run npm run check ("Fonts:" must list every weight you use).
- Never copy system or commercial fonts (Calibri, Arial, ...) in here –
  use open look-alikes (Carlito, Liberation Sans, ...).

Details below.

---

This folder holds the fonts used by the canvas. They are loaded locally via
@font-face in canvas.css, so they work over file:// and get embedded in the PDF.


1. Where Poppins comes from
---------------------------

Font:      Poppins (geometric sans-serif)
Designers: Indian Type Foundry (Latin design by Jonny Pinhorn,
           Devanagari by Ninad Kale)
Project:   https://github.com/itfoundry/Poppins
License:   SIL Open Font License 1.1 – see OFL.txt in this folder

The files here were taken from the npm package @fontsource/poppins, version
5.3.0, which repackages Poppins v24 from Google Fonts
(https://fonts.google.com/specimen/Poppins). Only the "latin" subset in the
normal style is included and the files were renamed:

  poppins-400.woff2   Regular    <- poppins-latin-400-normal.woff2
  poppins-500.woff2   Medium     <- poppins-latin-500-normal.woff2
  poppins-600.woff2   SemiBold   <- poppins-latin-600-normal.woff2
  poppins-700.woff2   Bold       <- poppins-latin-700-normal.woff2

The same files can be downloaded again directly, e.g.:
  https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.3.0/files/poppins-latin-400-normal.woff2

The "latin" subset covers English, German and most Western European languages,
including „“ ‚‘ – — … and €. Not included: italic styles, weights 100–300 and
800–900, and the "latin-ext" subset (needed for e.g. Polish, Czech, Turkish,
Vietnamese). If a character is missing, the browser silently falls back to a
system font for that character – check the screenshot.

Using Poppins is free, also commercially (posters, print, advertising, PDFs).
The font files must not be sold on their own, and OFL.txt must stay next to
them whenever they are passed on (e.g. when sharing this repository).


2. How to get other fonts
-------------------------

a) Google Fonts – https://fonts.google.com
   All fonts there are free to use (SIL OFL or Apache license), including
   commercial print. Click "Get font" -> "Download all" to get a ZIP with TTF
   files and the license (OFL.txt). TTF works fine for print; no conversion to
   woff2 is needed (see step 3 for the @font-face syntax).

b) Fontsource – https://fontsource.org
   The same Google fonts (plus some others) as ready-made woff2 files, split
   by subset, weight and style. Download a single file directly, no npm needed:
     https://cdn.jsdelivr.net/npm/@fontsource/<family>@<version>/files/<family>-<subset>-<weight>-<style>.woff2
   e.g.
     https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff2
   The font page on fontsource.org lists available weights, styles, subsets
   and the license. The license file is in the package on npm/jsDelivr
   (https://cdn.jsdelivr.net/npm/@fontsource/<family>@<version>/LICENSE).

c) Directly from the type designer or foundry (often on GitHub), e.g. Inter,
   Source Sans, IBM Plex. Use the release files (OTF/TTF/woff2) and the
   license that comes with them.

d) Commercial fonts (bought from a foundry, Adobe Fonts, MyFonts, ...):
   check that the license allows desktop/print use AND embedding in PDFs.
   A pure "web font" license is usually not enough for a printed poster.
   Don't commit commercial font files to a shared repository unless the
   license allows redistribution.

e) System fonts (Calibri, Cambria, Segoe UI, Arial, Helvetica, San Francisco):
   they may be used on the machine they are installed on, but must not be
   copied into this folder or passed on. They also differ between Windows and
   macOS, so the layout would change. Use an open replacement with the same
   metrics instead:
     Calibri  -> Carlito        Cambria  -> Caladea
     Arial    -> Liberation Sans / Arimo
     Times    -> Liberation Serif / Tinos
   (all on Google Fonts or in the Liberation/Chrome OS core font projects).


3. Adding a font to the canvas
------------------------------

1. Put the font files in this folder, with a clear name per weight/style,
   e.g. inter-400.woff2, inter-700.woff2, inter-400-italic.woff2.
2. Put the font's license file next to them, named after the font,
   e.g. OFL-Inter.txt (OFL.txt here belongs to Poppins).
3. Add one @font-face rule per file at the top of canvas.css:

     @font-face { font-family: 'Inter'; font-style: normal; font-weight: 700;
                  font-display: block; src: url(fonts/inter-700.woff2) format('woff2'); }

   For TTF/OTF files use format('truetype') or format('opentype').
   In examples/<name>/canvas.css the path is ../../fonts/...
4. Use it: font-family: 'Inter', system-ui, sans-serif;
5. Run npm run check. The "Fonts:" line lists every weight that actually
   loaded. Every weight and style used in the CSS needs its own file:
   canvas.css sets font-synthesis: none, so a missing bold or italic is NOT
   faked by the browser – the text silently falls back to another weight.
6. After npm run pdf the font is embedded in the PDF (only the characters
   actually used).
