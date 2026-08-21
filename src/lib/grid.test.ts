import { describe, it, expect } from 'vitest';
import { getGridDimensions, getGridCapacity } from './grid';

describe('getGridDimensions', () => {
  describe('vertical layout', () => {
    it('returns correct dimensions for standard', () => {
      expect(getGridDimensions('standard', 'vertical')).toEqual({ ROWS: 10, COLS: 8 });
    });

    it('returns correct dimensions for dense', () => {
      expect(getGridDimensions('dense', 'vertical')).toEqual({ ROWS: 12, COLS: 10 });
    });

    it('returns correct dimensions for high', () => {
      expect(getGridDimensions('high', 'vertical')).toEqual({ ROWS: 15, COLS: 12 });
    });

    it('returns correct dimensions for ultra', () => {
      expect(getGridDimensions('ultra', 'vertical')).toEqual({ ROWS: 20, COLS: 16 });
    });
  });

  describe('horizontal layout', () => {
    it('returns correct dimensions for standard', () => {
      expect(getGridDimensions('standard', 'horizontal')).toEqual({ ROWS: 8, COLS: 10 });
    });

    it('returns correct dimensions for dense', () => {
      expect(getGridDimensions('dense', 'horizontal')).toEqual({ ROWS: 10, COLS: 12 });
    });

    it('returns correct dimensions for high', () => {
      expect(getGridDimensions('high', 'horizontal')).toEqual({ ROWS: 12, COLS: 15 });
    });

    it('returns correct dimensions for ultra', () => {
      expect(getGridDimensions('ultra', 'horizontal')).toEqual({ ROWS: 16, COLS: 20 });
    });
  });

  it('swaps rows and cols between vertical and horizontal', () => {
    for (const density of ['standard', 'dense', 'high', 'ultra'] as const) {
      const vert = getGridDimensions(density, 'vertical');
      const horiz = getGridDimensions(density, 'horizontal');
      expect(horiz.ROWS).toBe(vert.COLS);
      expect(horiz.COLS).toBe(vert.ROWS);
    }
  });
});

describe('getGridCapacity', () => {
  it('returns ROWS * COLS for each density/mode combination', () => {
    const densities = ['standard', 'dense', 'high', 'ultra'] as const;
    const modes = ['vertical', 'horizontal'] as const;

    for (const density of densities) {
      for (const mode of modes) {
        const dims = getGridDimensions(density, mode);
        expect(getGridCapacity(density, mode)).toBe(dims.ROWS * dims.COLS);
      }
    }
  });

  it('returns same capacity for vertical and horizontal (symmetric)', () => {
    for (const density of ['standard', 'dense', 'high', 'ultra'] as const) {
      expect(getGridCapacity(density, 'vertical')).toBe(getGridCapacity(density, 'horizontal'));
    }
  });
});
