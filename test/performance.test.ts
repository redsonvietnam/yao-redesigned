import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '../src/lib/store';
import { CellData } from '../src/types';

// Reset store state before each test
beforeEach(() => {
  useAppStore.setState?.({
    cells: [],
    cursor: 0,
    selectedCellIndices: [],
    mode: 'vertical',
    textFlow: 'top-to-bottom-rtl',
    inputMode: 'han',
    showGrid: true,
    cellSize: 46,
    gridDensity: 'dense' as const,
    customRows: 12,
    customCols: 10,
    showRuler: true,
    showSidePanel: true,
    ribbonTab: 'home' as const,
    zoomLevel: 100,
    paperTheme: 'classic' as const,
    docId: 'doc-1',
    docTitle: 'Chữ Dao — Bút Ký 01',
    preedit: '',
    candidates: [],
    selectedCandIdx: 0,
    history: [],
    historyIdx: 0,
  });
});

// ---------------------------------------------------------------------------
// Rendering benchmark: measure how fast we can access cell state
// ---------------------------------------------------------------------------
describe('Performance Benchmark - Cell State Access', () => {
  it('should access 100 cell values', () => {
    // Insert 100 characters
    for (let i = 0; i < 100; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const start = performance.now();
    const cellCount = useAppStore.getState().cells.length;
    const elapsed = performance.now() - start;

    expect(cellCount).toBe(100);
    console.log(`Access 100 cells: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(10);
  });

  it('should access 500 cell values', () => {
    for (let i = 0; i < 500; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const start = performance.now();
    const cellCount = useAppStore.getState().cells.length;
    const elapsed = performance.now() - start;

    expect(cellCount).toBe(500);
    console.log(`Access 500 cells: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(50);
  });

  it('should access 1000 cell values', () => {
    for (let i = 0; i < 1000; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const start = performance.now();
    const cellCount = useAppStore.getState().cells.length;
    const elapsed = performance.now() - start;

    expect(cellCount).toBe(1000);
    console.log(`Access 1000 cells: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(100);
  });

  it('should access 5000 cell values', () => {
    for (let i = 0; i < 5000; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const start = performance.now();
    const cellCount = useAppStore.getState().cells.length;
    const elapsed = performance.now() - start;

    expect(cellCount).toBe(5000);
    console.log(`Access 5000 cells: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(300);
  });
});

// ---------------------------------------------------------------------------
// Typing benchmark: measure state update performance
// ---------------------------------------------------------------------------
describe('Performance Benchmark - Typing', () => {
  it('should type 100 characters', () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const elapsed = performance.now() - start;
    const cellCount = useAppStore.getState().cells.length;

    console.log(`Type 100 chars: ${elapsed.toFixed(2)}ms, cells: ${cellCount}`);
    expect(cellCount).toBe(100);
    expect(elapsed).toBeLessThan(200);
  });

  it('should type 500 characters', () => {
    const start = performance.now();

    for (let i = 0; i < 500; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const elapsed = performance.now() - start;
    const cellCount = useAppStore.getState().cells.length;

    console.log(`Type 500 chars: ${elapsed.toFixed(2)}ms, cells: ${cellCount}`);
    expect(cellCount).toBe(500);
    expect(elapsed).toBeLessThan(500);
  });

  it('should type 1000 characters', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const elapsed = performance.now() - start;
    const cellCount = useAppStore.getState().cells.length;

    console.log(`Type 1000 chars: ${elapsed.toFixed(2)}ms, cells: ${cellCount}`);
    expect(cellCount).toBe(1000);
    expect(elapsed).toBeLessThan(1000);
  });
});

// ---------------------------------------------------------------------------
// History benchmark: measure pushHistory overhead
// ---------------------------------------------------------------------------
describe('Performance Benchmark - History', () => {
  it('should push history 10x with 100 cells', () => {
    // First, populate with 100 cells
    for (let i = 0; i < 100; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const start = performance.now();

    for (let i = 0; i < 10; i++) {
      // Use the internal pushHistory via getState().pushHistory
      const state = useAppStore.getState();
      state.pushHistory?.(state.cells);
    }

    const elapsed = performance.now() - start;
    console.log(`pushHistory 10x (100 cells): ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(100);
  });

  it('should push history 10x with 1000 cells', () => {
    // First, populate with 1000 cells
    for (let i = 0; i < 1000; i++) {
      useAppStore.setState?.({
        cells: [...useAppStore.getState().cells, { id: `c-${i}`, char: `char-${i}`, bold: false, italic: false, underline: false, color: undefined, font: undefined }],
        cursor: i + 1,
      });
    }

    const start = performance.now();

    for (let i = 0; i < 10; i++) {
      const state = useAppStore.getState();
      state.pushHistory?.(state.cells);
    }

    const elapsed = performance.now() - start;
    console.log(`pushHistory 10x (1000 cells): ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(200);
  });
});