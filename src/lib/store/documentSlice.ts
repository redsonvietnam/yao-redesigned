import { StateCreator } from 'zustand';
import { CellData } from '../../types';
import { DocumentState } from './types';

export interface DocumentSlice extends DocumentState {
  insertChar: (char: string) => void;
  backspace: () => void;
  moveCursor: (delta: number) => void;
  setCursor: (index: number) => void;
  clearAll: () => void;
  deleteSelection: () => void;
  selectAll: () => void;
  pasteText: (text: string) => void;
  copySelectionText: () => string;
  cutSelectionText: () => string;
}

export const createDocumentSlice: StateCreator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  [],
  [],
  DocumentSlice
> = (set, get) => ({
  docId: 'doc-1',
  docTitle: 'Chữ Dao — Bút Ký 01',
  cells: [],
  cursor: 0,
  selectedCellIndices: [],

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

    if (selectedCellIndices.length > 0) {
      deleteSelection();
    }

    const currentCursor = get().cursor;
    const currentCells = [...get().cells];
    const chars = Array.from(text);

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
});
