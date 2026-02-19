import { describe, it, expect, vi, afterEach } from 'vitest';
import { pad2, timestamp, sanitizeFilename } from '../../src/utils';

describe('pad2', () => {
  it('pads single digit with leading zero', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(5)).toBe('05');
    expect(pad2(9)).toBe('09');
  });

  it('does not pad two-digit numbers', () => {
    expect(pad2(10)).toBe('10');
    expect(pad2(12)).toBe('12');
    expect(pad2(99)).toBe('99');
  });

  it('handles three-digit numbers', () => {
    expect(pad2(100)).toBe('100');
  });
});

describe('sanitizeFilename', () => {
  it('replaces spaces and special chars with underscores', () => {
    expect(sanitizeFilename('hello world!.png')).toBe('hello_world_.png');
  });

  it('preserves allowed characters', () => {
    expect(sanitizeFilename('my-file_v2.0.jpg')).toBe('my-file_v2.0.jpg');
  });

  it('handles fully alphanumeric names', () => {
    expect(sanitizeFilename('photo123')).toBe('photo123');
  });

  it('replaces all special characters', () => {
    expect(sanitizeFilename('a@b#c$d')).toBe('a_b_c_d');
  });

  it('handles empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});

describe('timestamp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches YYYYMMDD_HHmmSS pattern', () => {
    expect(timestamp()).toMatch(/^\d{8}_\d{6}$/);
  });

  it('produces correct timestamp for a known date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 18, 9, 5, 3));
    expect(timestamp()).toBe('20260218_090503');
  });

  it('handles midnight correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 0, 0, 0));
    expect(timestamp()).toBe('20250101_000000');
  });

  it('handles end of day correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 11, 31, 23, 59, 59));
    expect(timestamp()).toBe('20251231_235959');
  });
});
