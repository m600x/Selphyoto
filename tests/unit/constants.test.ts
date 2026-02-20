import { describe, it, expect } from 'bun:test';
import * as C from '../../src/constants';

describe('constants', () => {
  it('PX_PER_MM equals 300 / 25.4', () => {
    expect(C.PX_PER_MM).toBeCloseTo(300 / 25.4, 5);
  });

  it('CROP_W equals POSTCARD_WIDTH_MM * DISPLAY_SCALE', () => {
    expect(C.CROP_W).toBe(C.POSTCARD_WIDTH_MM * C.DISPLAY_SCALE);
    expect(C.CROP_W).toBe(740);
  });

  it('CROP_H equals POSTCARD_HEIGHT_MM * DISPLAY_SCALE', () => {
    expect(C.CROP_H).toBe(C.POSTCARD_HEIGHT_MM * C.DISPLAY_SCALE);
    expect(C.CROP_H).toBe(500);
  });

  it('canvas dimensions equal crop frame', () => {
    expect(C.CANVAS_W).toBe(C.CROP_W);
    expect(C.CANVAS_H).toBe(C.CROP_H);
  });

  it('crop frame origin is at (0, 0)', () => {
    expect(C.CROP_X).toBe(0);
    expect(C.CROP_Y).toBe(0);
  });

  it('default correction factors are 0.9610', () => {
    expect(C.DEFAULT_CORRECTION_X).toBe(0.9610);
    expect(C.DEFAULT_CORRECTION_Y).toBe(0.9610);
  });

  it('YOTO card dimensions are correct', () => {
    expect(C.YOTO_WIDTH_MM).toBe(54);
    expect(C.YOTO_HEIGHT_MM).toBe(85.6);
  });

  it('postcard dimensions are correct', () => {
    expect(C.POSTCARD_WIDTH_MM).toBe(148);
    expect(C.POSTCARD_HEIGHT_MM).toBe(100);
  });

  it('print DPI is 300', () => {
    expect(C.PRINT_DPI).toBe(300);
  });

  it('display scale is 5 pixels per mm', () => {
    expect(C.DISPLAY_SCALE).toBe(5);
  });
});
