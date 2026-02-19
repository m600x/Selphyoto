// Physical dimensions (mm)
export const POSTCARD_WIDTH_MM = 148;
export const POSTCARD_HEIGHT_MM = 100;
export const YOTO_WIDTH_MM = 54;
export const YOTO_HEIGHT_MM = 85.6;
export const YOTO_CORNER_RADIUS_MM = 3.18;

// Print resolution
export const PRINT_DPI = 300;
export const PX_PER_MM = PRINT_DPI / 25.4; // ~11.811 px/mm

// Display scale: how many screen pixels per mm in the editor
export const DISPLAY_SCALE = 5;

// Crop frame (the printable postcard area) in display pixels
export const CROP_W = POSTCARD_WIDTH_MM * DISPLAY_SCALE; // 740
export const CROP_H = POSTCARD_HEIGHT_MM * DISPLAY_SCALE; // 500
export const CROP_X = 0;
export const CROP_Y = 0;

// Total canvas = crop frame (no surrounding workspace)
export const CANVAS_W = CROP_W; // 740
export const CANVAS_H = CROP_H; // 500

// Cutting marks
export const MARK_LENGTH_MM = 5;
export const MARK_GAP_MM = 1;
export const MARK_THICKNESS_MM = 0.25;

// Divider line
export const DIVIDER_THICKNESS_MM = 0.25;

// Colors
export const GUIDE_LINE_COLOR = '#cc0000';
export const SUBFRAME_COLOR = '#00cc44';
export const CROP_BORDER_COLOR = '#aaaaaa';

// ── Printer correction factors ──
// Compensate for the Selphy CP1500's borderless zoom (~3.5–4%).
// The printer enlarges the image to avoid white borders, so guides are
// shrunk in the image by these factors. After the printer zooms, they
// land at the correct physical size.
//
// Calibration: expected 54mm → measured 56.2mm (X), 85.6mm → 88.6mm (Y).
export const DEFAULT_CORRECTION_X = 0.9610;
export const DEFAULT_CORRECTION_Y = 0.9610;
