# SelphYoto

A web application for designing and printing precisely-sized YOTO card labels using a Canon Selphy CP1500 dye-sublimation printer with postcard paper (100 × 148 mm, borderless).

The core challenge this app solves: the Selphy's borderless printing mode slightly enlarges images (~3.5–4%), making it impossible to get accurate real-life dimensions without compensation. This tool pre-corrects for that zoom so your printed cards come out at the exact right size.

**100% client-side** — no data is ever sent to a server. All image processing happens in your browser.

## Features

### Canvas editor
- **Fabric.js-powered canvas** — drag, scale, rotate, and position images freely
- **Multi-image support** — layer multiple images with independent transforms
- **Scroll to zoom** the selected image, arrow keys to nudge, Delete/Backspace to remove
- **Lock layers** — prevent accidental manipulation while keeping visibility control
- **Background color** — White, Grey, or Black (exported in the final image)
- **Responsive** — canvas scales sharply to fill the browser window
- **Auto-save** — state is persisted to IndexedDB so a page refresh won't lose your work

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
- **Layer list** with visibility toggles, lock, delete, and drag-to-reorder
- **Logical groups** — create groups to toggle visibility or delete multiple layers at once
- **Drag and drop** — reorder images and groups, drag images onto group headers to add them
- **Double-click to rename** any image or group
- **Delete confirmation** — prompts before removing images (sidebar button and keyboard)
- **Import images** via button, file picker, or drag-and-drop onto the canvas

### Project save/load
- **Export project** — saves all images, transforms, groups, and settings as a `.zip` file (`selphyoto_project_YYYYMMDD_HHmmSS.zip`)
- **Import project** — restores everything from a previously exported `.zip`

### Image export
- **Export as PNG or JPEG** at full 300 DPI (1748 × 1181 px)
- Split button with dropdown for format selection
- Output file named `selphyoto_exported_YYYYMMDD_HHmmSS.png` (or `.jpg`)
- Export disabled when canvas is empty or all images are hidden

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (for development and testing)
- [Docker](https://www.docker.com/) (optional, for containerised builds)

### Install dependencies

```bash
npm install
npx playwright install chromium
```

Or with Make (runs both automatically):

```bash
make install
```

### Run the dev server

```bash
npx vite
```

Or with Make:

```bash
make dev
```

Open `http://localhost:5173` in your browser. Changes are hot-reloaded.

### Build for production (without Docker)

```bash
npm run build
npm run preview
```

The built files are output to the `dist/` directory. This is a fully static site that can be hosted anywhere.

## Testing

The project includes a comprehensive test suite across three layers: unit tests, integration tests, and end-to-end browser tests.

### Run all tests

```bash
npx vitest run && npx playwright test --config tests/e2e/playwright.config.ts
```

Or with Make:

```bash
make tests
```

### Unit tests only

Unit tests cover constants validation, utility functions, and CanvasManager logic with mocked Fabric.js.

```bash
npx vitest run tests/unit/
```

Or with Make:

```bash
make unit-tests
```

### Integration tests only

Integration tests cover LayerManager DOM rendering, project import/export roundtrips, and IndexedDB auto-save operations.

```bash
npx vitest run tests/integration/
```

Or with Make:

```bash
make integration-tests
```

### End-to-end tests only

E2E tests use Playwright with Chromium to test the full application in a real browser. A Vite dev server is started automatically on port 5174.

```bash
npx playwright test --config tests/e2e/playwright.config.ts
```

Or with Make:

```bash
make e2e-tests
```

> **Note:** After installing or upgrading `@playwright/test`, you must download the matching browser binary:
>
> ```bash
> npx playwright install chromium
> ```
>
> Or with Make: `make install-playwright`

### Test coverage

Generate a V8 coverage report for unit and integration tests:

```bash
npx vitest run --coverage
```

Or with Make:

```bash
make tests-coverage
```

### Watch mode

Re-run unit and integration tests on file changes:

```bash
npx vitest
```

## Docker

### Build the Docker image

The commit hash is embedded into the app at build time via a build argument.

```bash
docker build -t selphyoto --build-arg COMMIT_HASH=$(git rev-parse --short HEAD) .
```

Or with Make:

```bash
make build
```

### Run the container

```bash
docker run -d -p 8080:80 --name selphyoto selphyoto
```

Or with Make:

```bash
make run
```

Open `http://localhost:8080` in your browser.

### Stop the container

```bash
docker stop selphyoto && docker rm selphyoto
```

Or with Make:

```bash
make stop
```

## Makefile reference

Run `make` (with no arguments) to see all available targets:

```
make help                Show this help
make install             Install npm dependencies and Playwright browsers
make install-playwright  Download Playwright browsers only (after upgrade)
make dev                 Start the Vite dev server (http://localhost:5173)
make unit-tests          Run unit tests only (Vitest)
make integration-tests   Run integration tests only (Vitest + jsdom)
make e2e-tests           Run end-to-end tests (Playwright + Chromium)
make tests               Run the full test suite (unit + integration + e2e)
make tests-coverage      Run unit + integration tests with V8 coverage report
make build               Build the Docker image (with embedded commit hash)
make run                 Run the Docker container (http://localhost:8080)
make stop                Stop and remove the Docker container
make clean               Remove node_modules and dist
```

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
| Delete / Backspace | Remove selected image (with confirmation) |

## Project structure

```
selphyoto/
├── index.html                  Entry HTML
├── package.json
├── tsconfig.json
├── vite.config.ts              Vite config (injects version + commit hash)
├── vitest.config.ts            Vitest config (unit + integration tests)
├── Makefile                    Make targets for dev, test, build, run
├── Dockerfile                  Multi-stage build (Node + nginx)
├── .dockerignore
├── src/
│   ├── main.ts                 Entry point, DOM event wiring, auto-save
│   ├── canvas-manager.ts       Fabric.js canvas, guides, export logic
│   ├── layer-manager.ts        Layer list UI and drag-and-drop
│   ├── project-io.ts           Project save/load (zip)
│   ├── auto-save.ts            IndexedDB auto-save
│   ├── utils.ts                Shared helpers (pad2, timestamp, sanitize)
│   ├── constants.ts            All dimensions, colors, and defaults
│   ├── style.css               Dark theme styles
│   └── vite-env.d.ts           Vite type declarations
├── tests/
│   ├── setup.ts                Vitest setup (global stubs)
│   ├── unit/
│   │   ├── constants.test.ts   Constant value validation
│   │   ├── utils.test.ts       Utility function tests
│   │   ├── canvas-manager.test.ts  CanvasManager with mocked Fabric.js
│   │   └── auto-save.test.ts   collectState() tests
│   ├── integration/
│   │   ├── layer-manager.test.ts   LayerManager DOM tests (jsdom)
│   │   ├── project-roundtrip.test.ts  ZIP import/export roundtrip
│   │   └── auto-save-idb.test.ts  IndexedDB operations (fake-indexeddb)
│   └── e2e/
│       ├── playwright.config.ts    Playwright config
│       └── app.spec.ts             Full browser tests (30 tests)
├── research.md                 Research notes and calibration data
└── agents.md                   LLM context file
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
| Unit/Integration tests | Vitest + jsdom + fake-indexeddb |
| E2E tests | Playwright (Chromium) |
