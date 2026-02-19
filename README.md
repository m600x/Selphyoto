# Selphy CP1500 Card Templater

A web application for designing and printing precisely-sized YOTO card labels using a Canon Selphy CP1500 dye-sublimation printer with postcard paper (100 × 148 mm, borderless).

The core challenge this app solves: the Selphy's borderless printing mode slightly enlarges images (~3.5–4%), making it impossible to get accurate real-life dimensions without compensation. This tool pre-corrects for that zoom so your printed cards come out at the exact right size.

## Features

### Canvas editor
- **Fabric.js-powered canvas** — drag, scale, rotate, and position images freely
- **Multi-image support** — layer multiple images with independent transforms
- **Scroll to zoom** the selected image, arrow keys to nudge, Delete/Backspace to remove
- **Background color** — White, Grey, or Black (exported in the final image)
- **Responsive** — canvas scales sharply to fill the browser window

### Guides and alignment
- **Two YOTO card subframes** (54 × 85.6 mm, portrait) with green outlines and rounded corners, centered in each half of the postcard
- **Center divider line** between the two card slots (exported)
- **Cutting marks** at each subframe corner (exported) — color selectable: Black, White, Red, Yellow
- **Dashed center guidelines** inside each subframe (vertical and horizontal) — visual only, never exported
- **Guidelines toggle** to show/hide all green visual guides

### Correction factors
- **Separate X and Y correction factors** to compensate for the Selphy's anisotropic borderless zoom
- Default: `0.9610` for both axes (calibrated from real test prints)
- Editable in the toolbar — print, measure, adjust until your subframes are exactly 54 × 85.6 mm

### Layer management
- **Resizable sidebar** with drag handle on the right edge
- **Layer list** with visibility toggles, delete, and drag-to-reorder
- **Logical groups** — create groups to toggle visibility or delete multiple layers at once
- **Drag and drop** — reorder images and groups, drag images onto group headers to add them
- **Double-click to rename** any image or group
- **Import images** via button, file picker, or drag-and-drop onto the canvas

### Project save/load
- **Export project** — saves all images, transforms, groups, and settings as a `.zip` file (`project_YYYYMMDD_HHmmSS.zip`)
- **Import project** — restores everything from a previously exported `.zip`
- Manifest includes: image data, positions, scales, rotations, group structure, correction factors, background/mark colors, guideline state, and export format preference

### Image export
- **Export as PNG or JPEG** at full 300 DPI (1748 × 1181 px)
- Split button with dropdown for format selection
- Output file named `exported_image_YYYYMMDD_HHmmSS.png`
- Export disabled when canvas is empty or all images are hidden

## Getting started

### Option A: Docker (recommended)

The easiest way to run SelphYoto. Only [Docker](https://www.docker.com/) is required.

```bash
# Clone the repository
git clone <repo-url>
cd selphyoto

# Build the image
docker build -t selphyoto .

# Run the container
docker run -d -p 8080:80 --name selphyoto selphyoto
```

Open `http://localhost:8080` in your browser. To stop it:

```bash
docker stop selphyoto
docker rm selphyoto
```

### Option B: Node.js (development)

Requires [Node.js](https://nodejs.org/) v18+.

```bash
# Clone the repository
git clone <repo-url>
cd selphyoto

# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production (without Docker)

```bash
npm run build
npm run preview
```

The built files are output to the `dist/` directory. This is a fully static site that can be hosted anywhere.

## Calibration workflow

The Selphy CP1500 enlarges images during borderless printing to avoid white edges. The correction factors compensate for this.

1. **Print a test** — export the template with default correction (0.9610) and print it borderless on postcard paper
2. **Measure** — use a ruler to measure the printed subframe dimensions (should be 54 mm wide, 85.6 mm tall)
3. **Calculate** — if the printed width is e.g. 55 mm: new Corr. X = `54 / 55 × current_corr_x`
4. **Update** — enter the new values in the Corr. X / Corr. Y fields in the toolbar
5. **Repeat** until the printed subframes match 54 × 85.6 mm

The correction values are saved in project exports, so you only need to calibrate once.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Scroll wheel | Zoom selected image |
| Arrow keys | Nudge selected image (1px) |
| Delete / Backspace | Remove selected image |

## Project structure

```
selphyoto/
├── index.html              # Entry HTML
├── package.json
├── tsconfig.json
├── Dockerfile              # Multi-stage build (Node + nginx)
├── .dockerignore
├── research.md             # Research notes and calibration data
├── README.md               # This file
├── src/
│   ├── main.ts             # Entry point, DOM event wiring
│   ├── canvas-manager.ts   # Fabric.js canvas, guides, export logic
│   ├── layer-manager.ts    # Layer list UI and drag-and-drop
│   ├── project-io.ts       # Project save/load (zip)
│   ├── constants.ts        # All dimensions, colors, and defaults
│   ├── style.css           # Dark theme styles
│   └── vite-env.d.ts       # Vite type declarations
```

## Technical details

| Spec | Value |
|------|-------|
| Postcard size | 148 × 100 mm (borderless) |
| YOTO card size | 54 × 85.6 mm |
| Corner radius | 3.18 mm |
| Print DPI | 300 (11.811 px/mm) |
| Export resolution | 1748 × 1181 px |
| Canvas library | Fabric.js v6 |
| Build tool | Vite |
| Language | TypeScript |
