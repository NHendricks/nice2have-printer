# Print requirement

- Format: exactly DIN A0
- Orientation: portrait
- Dimensions: 841 × 1189 mm
- No deviation from this format allowed
- No adaptation to another paper size, landscape or "almost A0"
- Print-ready in portrait, aligned exactly to DIN A0
- Always keep the A0 portrait dimensions when adjusting the layout

(Applies to the current state. If a canvas is deliberately meant for another format, update this section and follow "Other DIN formats" in the README.)

# Project documentation

@README.md

# Working on a canvas (for Claude)

- After every layout or content change run `npm run shot` (headless; keep it that way – the user prefers no visible Chrome window) and read the output: format OK, no `!!` lines, free space not negative.
- Then look at `shot.png` with the Read tool. It is shown scaled down; the scale factor is in the image info. Check for clipped text/images, overlaps and unwanted empty areas, and compare with the template if there is one.
- Measure instead of guessing: extend the `Runtime.evaluate` expression in `nice2have-printer.mjs` (`getBoundingClientRect()`) or add `data-measure` to the areas in question. If space runs out, adjust image widths and spacing first, font sizes last.
- For examples in `examples/<name>/`, run the script from that folder: `node ../../nice2have-printer.mjs shot`.
- For a final export run `npm run pdf` and check: 1 page, MediaBox matches the format.
- Keep the project dependency-free: no npm packages in `package.json`. Temporary helpers (Playwright, pdf.js) go in a temp folder outside the project.
- The project is a neutral, reusable tool: never put content from earlier client posters into project files.
- All project files are written in English (README.md for humans, CLAUDE.md for Claude).
- Keep project knowledge here and in README.md, not in Claude's auto-memory.
