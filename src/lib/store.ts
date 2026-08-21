import { create } from 'zustand';
import { CellData, LayoutMode, TextFlow, InputMode, Candidate, GridDensity, RibbonTab } from '../types';
import { dictEngine, transform } from './imeEngine';
import { db } from './db';
import { MAX_HISTORY_ENTRIES } from './constants';

const INITIAL_SAMPLE_CELLS: CellData[] = [
  { id: '1', char: '盤' },
  { id: '2', char: '王' },
  { id: '3', char: '天' },
  { id: '4', char: '地' },
  { id: '5', char: '山' },
  { id: '6', char: '水' },
  { id: '7', char: '人' },
  { id: '8', char: '好' },
  { id: '9', char: '家' },
  { id: '10', char: '母' },
  { id: '11', char: '父' },
  { id: '12', char: '子' },
];

interface AppState {
  // Document state
  docId: string;
  docTitle: string;
  cells: CellData[];
  cursor: number;
  selectedCellIndices: number[];

  // IME State
  preedit: string;
  candidates: Candidate[];
  selectedCandIdx: number;

  // View Layout & Word Controls
  mode: LayoutMode;
  textFlow: TextFlow;
  inputMode: InputMode;
  showGrid: boolean;
  cellSize: number;
  gridDensity: GridDensity;
  customRows: number;
  customCols: number;
  showRuler: boolean;
  showSidePanel: boolean;
  ribbonTab: RibbonTab;
  zoomLevel: number;
  paperTheme: 'classic' | 'white' | 'dark';

  // Active Formatting
  selectedColor: string;
  selectedFont: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;

  // History Undo/Redo
  history: CellData[][];
  historyIdx: number;

  // UI Panels
  activeTab: 'rules' | 'dict' | 'lookup' | 'ocr' | 'settings';
  activeLookupChar: string | null;
  showSymbolPicker: boolean;
  saveError: string | null;

  // Actions
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

  setPreedit: (preedit: string) => void;
  recomputeCandidates: () => void;
  moveCandidate: (delta: number) => void;
  commitCandidate: (idx?: number) => void;

  insertChar: (char: string) => void;
  backspace: () => void;
  moveCursor: (delta: number) => void;
  setCursor: (index: number) => void;
  clearAll: () => void;

  setSelectedCellIndices: (indices: number[]) => void;
  applyFormattingToSelection: (format: { bold?: boolean; italic?: boolean; underline?: boolean; color?: string; font?: string }) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  setSelectedColor: (color: string) => void;
  setSelectedFont: (font: string) => void;

  deleteSelection: () => void;
  selectAll: () => void;
  pasteText: (text: string) => void;
  copySelectionText: () => string;
  cutSelectionText: () => string;

  undo: () => void;
  redo: () => void;
  pushHistory: (newCells: CellData[]) => void;

  setActiveTab: (tab: 'rules' | 'dict' | 'lookup' | 'ocr' | 'settings') => void;
  setLookupChar: (char: string | null) => void;
  setShowSymbolPicker: (show: boolean) => void;
  toggleSymbolPicker: () => void;
  setSaveError: (error: string | null) => void;

  loadDocument: (docId: string, title: string, cells: CellData[]) => void;
  newDocument: () => void;
  saveCurrentDocument: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  docId: 'doc-1',
  docTitle: 'Chữ Dao — Bút Ký 01',
  cells: INITIAL_SAMPLE_CELLS,
  cursor: INITIAL_SAMPLE_CELLS.length,
  selectedCellIndices: [],

  preedit: '',
  candidates: [],
  selectedCandIdx: 0,

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

  selectedColor: '#15120e',
  selectedFont: 'Noto Serif SC',
  isBold: false,
  isItalic: false,
  isUnderline: false,

  history: [INITIAL_SAMPLE_CELLS],
  historyIdx: 0,

  activeTab: 'dict',
  activeLookupChar: null,
  showSymbolPicker: false,
  saveError: null,

  setShowSymbolPicker: (showSymbolPicker) => set({ showSymbolPicker }),
  toggleSymbolPicker: () => set((state) => ({ showSymbolPicker: !state.showSymbolPicker })),
  setSaveError: (saveError) => set({ saveError }),

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

  setPreedit: (preedit) => {
    set({ preedit });
    get().recomputeCandidates();
  },

  recomputeCandidates: () => {
    const { preedit } = get();
    if (!preedit) {
      set({ candidates: [], selectedCandIdx: 0 });
      return;
    }
    const transformed = transform(preedit);
    const cands = dictEngine.matchCandidates(transformed);
    set({ candidates: cands, selectedCandIdx: 0 });
  },

  moveCandidate: (delta) => {
    const { candidates, selectedCandIdx } = get();
    if (candidates.length === 0) return;
    const len = candidates.length;
    const nextIdx = (selectedCandIdx + delta + len) % len;
    set({ selectedCandIdx: nextIdx });
  },

  commitCandidate: (idx) => {
    const { candidates, selectedCandIdx, cursor, cells, pushHistory, isBold, isItalic, isUnderline, selectedColor } = get();
    const targetIdx = idx !== undefined ? idx : selectedCandIdx;
    const cand = candidates[targetIdx];
    if (!cand) return;

    const newCells = [...cells];
    const newCell: CellData = {
      id: crypto.randomUUID(),
      char: cand.hanzi,
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      color: selectedColor !== '#15120e' ? selectedColor : undefined,
    };

    newCells.splice(cursor, 0, newCell);
    const newCursor = cursor + 1;

    set({
      cells: newCells,
      cursor: newCursor,
      preedit: '',
      candidates: [],
      selectedCandIdx: 0,
    });
    pushHistory(newCells);
  },

  insertChar: (char) => {
    const { cursor, cells, pushHistory, isBold, isItalic, isUnderline, selectedColor } = get();
    const newCells = [...cells];
    const newCell: CellData = {
      id: crypto.randomUUID(),
      char,
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      color: selectedColor !== '#15120e' ? selectedColor : undefined,
    };
    newCells.splice(cursor, 0, newCell);
    const newCursor = cursor + 1;

    set({ cells: newCells, cursor: newCursor });
    pushHistory(newCells);
  },

  backspace: () => {
    const { preedit, cursor, cells, pushHistory, recomputeCandidates } = get();
    if (preedit) {
      const nextPreedit = preedit.slice(0, -1);
      set({ preedit: nextPreedit });
      recomputeCandidates();
      return;
    }

    if (cursor > 0) {
      const newCells = [...cells];
      newCells.splice(cursor - 1, 1);
      const newCursor = cursor - 1;
      set({ cells: newCells, cursor: newCursor, selectedCellIndices: [] });
      pushHistory(newCells);
    }
  },

  moveCursor: (delta) => {
    const { cells, cursor } = get();
    const nextCursor = Math.max(0, Math.min(cells.length, cursor + delta));
    set({ cursor: nextCursor });
  },

  setCursor: (index) => {
    const { cells } = get();
    const target = Math.max(0, Math.min(cells.length, index));
    set({ cursor: target, selectedCellIndices: [] });
  },

  clearAll: () => {
    const { pushHistory } = get();
    set({
      cells: [],
      cursor: 0,
      preedit: '',
      candidates: [],
      selectedCandIdx: 0,
      selectedCellIndices: [],
    });
    pushHistory([]);
  },

  setSelectedCellIndices: (selectedCellIndices) => set({ selectedCellIndices }),

  applyFormattingToSelection: (format) => {
    const { selectedCellIndices, cells, pushHistory } = get();
    if (selectedCellIndices.length === 0) return;

    const newCells = cells.map((cell, idx) => {
      if (selectedCellIndices.includes(idx)) {
        return {
          ...cell,
          bold: format.bold !== undefined ? format.bold : cell.bold,
          italic: format.italic !== undefined ? format.italic : cell.italic,
          underline: format.underline !== undefined ? format.underline : cell.underline,
          color: format.color !== undefined ? format.color : cell.color,
          font: format.font !== undefined ? format.font : cell.font,
        };
      }
      return cell;
    });

    set({ cells: newCells });
    pushHistory(newCells);
  },

  toggleBold: () => {
    const { isBold, selectedCellIndices, applyFormattingToSelection } = get();
    const next = !isBold;
    set({ isBold: next });
    if (selectedCellIndices.length > 0) {
      applyFormattingToSelection({ bold: next });
    }
  },

  toggleItalic: () => {
    const { isItalic, selectedCellIndices, applyFormattingToSelection } = get();
    const next = !isItalic;
    set({ isItalic: next });
    if (selectedCellIndices.length > 0) {
      applyFormattingToSelection({ italic: next });
    }
  },

  toggleUnderline: () => {
    const { isUnderline, selectedCellIndices, applyFormattingToSelection } = get();
    const next = !isUnderline;
    set({ isUnderline: next });
    if (selectedCellIndices.length > 0) {
      applyFormattingToSelection({ underline: next });
    }
  },

  setSelectedColor: (color) => {
    const { selectedCellIndices, applyFormattingToSelection } = get();
    set({ selectedColor: color });
    if (selectedCellIndices.length > 0) {
      applyFormattingToSelection({ color });
    }
  },

  setSelectedFont: (font) => {
    const { selectedCellIndices, applyFormattingToSelection } = get();
    set({ selectedFont: font });
    if (selectedCellIndices.length > 0) {
      applyFormattingToSelection({ font });
    }
  },

  deleteSelection: () => {
    const { selectedCellIndices, cells, pushHistory } = get();
    if (selectedCellIndices.length === 0) return;
    const sorted = [...selectedCellIndices].sort((a, b) => a - b);
    const setIndices = new Set(sorted);

    const newCells = cells.filter((_, idx) => !setIndices.has(idx));
    const firstDeleted = sorted[0];
    const newCursor = Math.min(firstDeleted, newCells.length);

    set({ cells: newCells, cursor: newCursor, selectedCellIndices: [] });
    pushHistory(newCells);
  },

  selectAll: () => {
    const { cells } = get();
    if (cells.length === 0) return;
    const allIndices = Array.from({ length: cells.length }, (_, i) => i);
    set({ selectedCellIndices: allIndices });
  },

  copySelectionText: () => {
    const { selectedCellIndices, cells, cursor } = get();
    if (selectedCellIndices.length > 0) {
      const sorted = [...selectedCellIndices].sort((a, b) => a - b);
      return sorted.map((idx) => cells[idx]?.char || '').join('');
    } else if (cells.length > 0 && cursor < cells.length) {
      return cells[cursor]?.char || '';
    }
    return '';
  },

  cutSelectionText: () => {
    const { copySelectionText, deleteSelection } = get();
    const text = copySelectionText();
    if (text) {
      deleteSelection();
    }
    return text;
  },

  pasteText: (text) => {
    if (!text) return;
    const { selectedCellIndices, deleteSelection, cursor, cells, pushHistory, isBold, isItalic, isUnderline, selectedColor, selectedFont } = get();
    
    // If there is a selection, delete it first
    if (selectedCellIndices.length > 0) {
      deleteSelection();
    }

    const currentCursor = get().cursor;
    const currentCells = [...get().cells];
    const chars = Array.from(text); // Correctly handles Unicode / Chinese surrogate pairs

    const newCellsToInsert: CellData[] = chars.map((ch) => ({
      id: crypto.randomUUID(),
      char: ch,
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      color: selectedColor !== '#15120e' ? selectedColor : undefined,
      font: selectedFont !== 'Noto Serif SC' ? selectedFont : undefined,
    }));

    currentCells.splice(currentCursor, 0, ...newCellsToInsert);
    const newCursor = currentCursor + newCellsToInsert.length;

    set({ cells: currentCells, cursor: newCursor, selectedCellIndices: [] });
    pushHistory(currentCells);
  },

  pushHistory: (newCells) => {
    const { history, historyIdx } = get();
    const sliced = history.slice(0, historyIdx + 1);
    const updated = [...sliced, newCells];
    // Cap history to prevent unbounded memory growth
    if (updated.length > MAX_HISTORY_ENTRIES) {
      const pruned = updated.slice(updated.length - MAX_HISTORY_ENTRIES);
      set({ history: pruned, historyIdx: pruned.length - 1 });
    } else {
      set({ history: updated, historyIdx: updated.length - 1 });
    }
  },

  undo: () => {
    const { history, historyIdx } = get();
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      const prevCells = history[prevIdx];
      set({
        cells: prevCells,
        historyIdx: prevIdx,
        cursor: Math.min(get().cursor, prevCells.length),
      });
    }
  },

  redo: () => {
    const { history, historyIdx } = get();
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      const nextCells = history[nextIdx];
      set({
        cells: nextCells,
        historyIdx: nextIdx,
        cursor: Math.min(get().cursor, nextCells.length),
      });
    }
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  setLookupChar: (activeLookupChar) => {
    set({ activeLookupChar, activeTab: 'lookup' });
  },

  loadDocument: (docId, docTitle, cells) => {
    set({
      docId,
      docTitle,
      cells,
      cursor: cells.length,
      preedit: '',
      candidates: [],
      selectedCandIdx: 0,
      selectedCellIndices: [],
      history: [cells],
      historyIdx: 0,
    });
  },

  newDocument: () => {
    const newId = `doc-${Date.now()}`;
    const newTitle = `Bản thảo Chữ Dao ${new Date().toLocaleDateString('vi-VN')}`;
    set({
      docId: newId,
      docTitle: newTitle,
      cells: [],
      cursor: 0,
      preedit: '',
      candidates: [],
      selectedCandIdx: 0,
      selectedCellIndices: [],
      history: [[]],
      historyIdx: 0,
    });
  },

  saveCurrentDocument: async () => {
    const { docId, docTitle, cells, mode, showGrid, cellSize } = get();
    try {
      await db.documents.put({
        id: docId,
        title: docTitle,
        cells,
        mode,
        showGrid,
        cellSize,
        updatedAt: Date.now(),
      });
      set({ saveError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to save document:', err);
      set({ saveError: `Lưu thất bại: ${message}` });
    }
  },
}));
