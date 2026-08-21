import { describe, it, expect } from 'vitest';
import {
  MAX_HISTORY_ENTRIES,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  COLOR_OPTIONS,
  FONT_OPTIONS,
  GRID_DENSITIES,
} from './constants';

describe('constants', () => {
  it('MAX_HISTORY_ENTRIES is 200', () => {
    expect(MAX_HISTORY_ENTRIES).toBe(200);
  });

  it('MIN_ZOOM is less than MAX_ZOOM', () => {
    expect(MIN_ZOOM).toBeLessThan(MAX_ZOOM);
  });

  it('ZOOM_STEP is positive', () => {
    expect(ZOOM_STEP).toBeGreaterThan(0);
  });

  it('COLOR_OPTIONS has valid hex values', () => {
    for (const color of COLOR_OPTIONS) {
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color.label).toBeTruthy();
    }
  });

  it('FONT_OPTIONS has valid font values', () => {
    for (const font of FONT_OPTIONS) {
      expect(font.value).toBeTruthy();
      expect(font.label).toBeTruthy();
    }
  });

  it('GRID_DENSITIES has valid sizes', () => {
    for (const density of GRID_DENSITIES) {
      expect(density.size).toBeGreaterThan(0);
      expect(density.label).toBeTruthy();
    }
  });

  it('GRID_DENSITIES sizes are in descending order', () => {
    for (let i = 1; i < GRID_DENSITIES.length; i++) {
      expect(GRID_DENSITIES[i].size).toBeLessThan(GRID_DENSITIES[i - 1].size);
    }
  });
});
