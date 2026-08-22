import { StateCreator } from 'zustand';
import { LayoutMode, TextFlow, InputMode, GridDensity, RibbonTab } from '../../types';
import { ViewState } from './types';

export interface ViewSlice extends ViewState {
  setDocTitle: (title: string) => void;
  setMode: (mode: LayoutMode) => void;
  setTextFlow: (textFlow: TextFlow) => void;
  setInputMode: (mode: InputMode) => void;
  setShowGrid: (show: boolean) => void;
  setCellSize: (size: number) => void;
  setGridDensity: (density: GridDensity) => void;
  setCustomDimensions: (rows: number, cols: number) => void;
  setShowRuler: (show: boolean) => void;
  setShowSidePanel: (show: boolean) => void;
  toggleSidePanel: () => void;
  setRibbonTab: (tab: RibbonTab) => void;
  setZoomLevel: (zoom: number) => void;
  setPaperTheme: (theme: 'classic' | 'white' | 'dark') => void;
  toggleRibbonRow2: () => void;
}

export const createViewSlice: StateCreator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  [],
  [],
  ViewSlice
> = (set) => ({
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
  ribbonRow2Expanded: true,

  setDocTitle: (docTitle) => set({ docTitle }),
  setMode: (mode) => set({ mode }),
  setTextFlow: (textFlow) => set({ textFlow }),
  setInputMode: (inputMode) => {
    set({ inputMode, preedit: '', candidates: [], selectedCandIdx: 0 });
  },
  setShowGrid: (showGrid) => set({ showGrid }),
  setCellSize: (cellSize) => {
    document.documentElement.style.setProperty('--cell', `${cellSize}px`);
    document.documentElement.style.setProperty('--glyph', `${Math.round(cellSize * 0.61)}px`);
    set({ cellSize });
  },
  setGridDensity: (gridDensity) => set({ gridDensity }),
  setCustomDimensions: (customRows, customCols) => set({ customRows, customCols }),
  setShowRuler: (showRuler) => set({ showRuler }),
  setShowSidePanel: (showSidePanel) => set({ showSidePanel }),
  toggleSidePanel: () => set((state) => ({ showSidePanel: !state.showSidePanel })),
  setRibbonTab: (ribbonTab) => set({ ribbonTab }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  setPaperTheme: (paperTheme) => set({ paperTheme }),
  toggleRibbonRow2: () => set((state) => ({ ribbonRow2Expanded: !state.ribbonRow2Expanded })),
});
