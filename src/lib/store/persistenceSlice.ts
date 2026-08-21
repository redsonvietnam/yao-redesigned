import { StateCreator } from 'zustand';
import { CellData } from '../../types';
import { db } from '../db';

export interface PersistenceSlice {
  loadDocument: (docId: string, title: string, cells: CellData[]) => void;
  newDocument: () => void;
  saveCurrentDocument: () => Promise<void>;
}

export const createPersistenceSlice: StateCreator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  [],
  [],
  PersistenceSlice
> = (set, get) => ({
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
});
