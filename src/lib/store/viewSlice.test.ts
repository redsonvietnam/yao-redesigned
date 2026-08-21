import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './index';

describe('viewSlice', () => {
  beforeEach(() => {
    useAppStore.setState({
      mode: 'vertical',
      textFlow: 'top-to-bottom-rtl',
      inputMode: 'han',
      showGrid: true,
      cellSize: 46,
      gridDensity: 'dense',
      customRows: 12,
      customCols: 10,
      showRuler: true,
      showSidePanel: true,
      ribbonTab: 'home',
      zoomLevel: 100,
      paperTheme: 'classic',
    });
  });

  describe('setDocTitle', () => {
    it('updates document title', () => {
      useAppStore.getState().setDocTitle('New Title');
      expect(useAppStore.getState().docTitle).toBe('New Title');
    });
  });

  describe('setMode', () => {
    it('sets layout mode', () => {
      useAppStore.getState().setMode('horizontal');
      expect(useAppStore.getState().mode).toBe('horizontal');
    });
  });

  describe('setTextFlow', () => {
    it('sets text flow', () => {
      useAppStore.getState().setTextFlow('left-to-right-ttb');
      expect(useAppStore.getState().textFlow).toBe('left-to-right-ttb');
    });
  });

  describe('setInputMode', () => {
    it('sets input mode and clears IME state', () => {
      useAppStore.setState({
        preedit: 'test',
        candidates: [{ hanzi: '盤', weight: 100, meaning: 'test' }],
        selectedCandIdx: 0,
      });
      useAppStore.getState().setInputMode('latin');
      const state = useAppStore.getState();
      expect(state.inputMode).toBe('latin');
      expect(state.preedit).toBe('');
      expect(state.candidates).toEqual([]);
      expect(state.selectedCandIdx).toBe(0);
    });
  });

  describe('setShowGrid', () => {
    it('toggles grid visibility', () => {
      useAppStore.getState().setShowGrid(false);
      expect(useAppStore.getState().showGrid).toBe(false);
    });
  });

  describe('setCellSize', () => {
    it('updates cell size', () => {
      const mockSetProperty = vi.fn();
      vi.stubGlobal('document', {
        documentElement: { style: { setProperty: mockSetProperty } },
      });

      useAppStore.getState().setCellSize(50);
      expect(useAppStore.getState().cellSize).toBe(50);
      expect(mockSetProperty).toHaveBeenCalledWith('--cell', '50px');
      expect(mockSetProperty).toHaveBeenCalledWith('--glyph', '31px');
    });
  });

  describe('setGridDensity', () => {
    it('updates grid density', () => {
      useAppStore.getState().setGridDensity('ultra');
      expect(useAppStore.getState().gridDensity).toBe('ultra');
    });
  });

  describe('setCustomDimensions', () => {
    it('updates custom rows and cols', () => {
      useAppStore.getState().setCustomDimensions(15, 12);
      const state = useAppStore.getState();
      expect(state.customRows).toBe(15);
      expect(state.customCols).toBe(12);
    });
  });

  describe('setShowRuler', () => {
    it('toggles ruler visibility', () => {
      useAppStore.getState().setShowRuler(false);
      expect(useAppStore.getState().showRuler).toBe(false);
    });
  });

  describe('setShowSidePanel / toggleSidePanel', () => {
    it('sets side panel visibility', () => {
      useAppStore.getState().setShowSidePanel(false);
      expect(useAppStore.getState().showSidePanel).toBe(false);
    });

    it('toggles side panel', () => {
      useAppStore.getState().toggleSidePanel();
      expect(useAppStore.getState().showSidePanel).toBe(false);
      useAppStore.getState().toggleSidePanel();
      expect(useAppStore.getState().showSidePanel).toBe(true);
    });
  });

  describe('setRibbonTab', () => {
    it('updates ribbon tab', () => {
      useAppStore.getState().setRibbonTab('tools');
      expect(useAppStore.getState().ribbonTab).toBe('tools');
    });
  });

  describe('setZoomLevel', () => {
    it('updates zoom level', () => {
      useAppStore.getState().setZoomLevel(120);
      expect(useAppStore.getState().zoomLevel).toBe(120);
    });
  });

  describe('setPaperTheme', () => {
    it('updates paper theme', () => {
      useAppStore.getState().setPaperTheme('dark');
      expect(useAppStore.getState().paperTheme).toBe('dark');
    });
  });
});
