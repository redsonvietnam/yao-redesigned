import { StateCreator } from 'zustand';
import { FormattingState } from './types';

export interface FormattingSlice extends FormattingState {
  setSelectedCellIndices: (indices: number[]) => void;
  applyFormattingToSelection: (format: { bold?: boolean; italic?: boolean; underline?: boolean; color?: string; font?: string }) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  setSelectedColor: (color: string) => void;
  setSelectedFont: (font: string) => void;
}

export const createFormattingSlice: StateCreator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  [],
  [],
  FormattingSlice
> = (set, get) => ({
  selectedColor: '#15120e',
  selectedFont: 'Noto Serif SC',
  isBold: false,
  isItalic: false,
  isUnderline: false,

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
});
