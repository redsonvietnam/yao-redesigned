import { StateCreator } from 'zustand';
import { CellData } from '../../types';
import { MAX_HISTORY_ENTRIES } from '../constants';
import { HistoryState } from './types';

export interface HistorySlice extends HistoryState {
  pushHistory: (newCells: CellData[]) => void;
  undo: () => void;
  redo: () => void;
}

export const createHistorySlice: StateCreator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  history: [],
  historyIdx: 0,

  pushHistory: (newCells) => {
    const { history, historyIdx } = get();
    const sliced = history.slice(0, historyIdx + 1);
    const updated = [...sliced, newCells];
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
});
