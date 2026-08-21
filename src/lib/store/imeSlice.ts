import { StateCreator } from 'zustand';
import { CellData } from '../../types';
import { dictEngine, transform } from '../imeEngine';
import { IMEState } from './types';

export interface IMESlice extends IMEState {
  setPreedit: (preedit: string) => void;
  recomputeCandidates: () => void;
  moveCandidate: (delta: number) => void;
  commitCandidate: (idx?: number) => void;
}

export const createIMESlice: StateCreator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  [],
  [],
  IMESlice
> = (set, get) => ({
  preedit: '',
  candidates: [],
  selectedCandIdx: 0,

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
});
