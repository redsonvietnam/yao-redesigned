import { GridDensity, LayoutMode } from '../types';

interface GridDimensions {
  ROWS: number;
  COLS: number;
}

const GRID_SIZE: Record<GridDensity, GridDimensions> = {
  standard: { ROWS: 10, COLS: 8 },
  dense: { ROWS: 12, COLS: 10 },
  high: { ROWS: 15, COLS: 12 },
  ultra: { ROWS: 20, COLS: 16 },
};

const GRID_SIZE_HORIZONTAL: Record<GridDensity, GridDimensions> = {
  standard: { ROWS: 8, COLS: 10 },
  dense: { ROWS: 10, COLS: 12 },
  high: { ROWS: 12, COLS: 15 },
  ultra: { ROWS: 16, COLS: 20 },
};

export function getGridDimensions(
  density: GridDensity,
  layoutMode: LayoutMode,
): GridDimensions {
  return layoutMode === 'vertical'
    ? GRID_SIZE[density]
    : GRID_SIZE_HORIZONTAL[density];
}

export function getGridCapacity(
  density: GridDensity,
  layoutMode: LayoutMode,
): number {
  const dims = getGridDimensions(density, layoutMode);
  return dims.ROWS * dims.COLS;
}
