import { StateCreator } from 'zustand';
import { CellData } from '../../types';
import { db } from '../db';

export interface PersistenceSlice {
  loadDocument: (docId: string, title: string, cells: CellData[]) => void;
  newDocument: () => void;
  saveCurrentDocument: () => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
}

export const createPersistenceSlice: StateCreator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  [],
  [],
  PersistenceSlice
> = (set, get) => ({
  loadDocument: async (docId, docTitle, cells) => {
    try {
      // Verify the document still exists in Dexie before loading
      const exists = await db.documents.get(docId);
      if (!exists) {
        set({ persistenceError: `Tài liệu "${docTitle}" không tồn tại hoặc đã bị xoá.` });
        return;
      }
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
        persistenceError: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to load document:', err);
      set({ persistenceError: `Không thể tải tài liệu: ${message}` });
    }
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
      persistenceError: null,
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

  deleteDocument: async (docId) => {
    try {
      await db.documents.delete(docId);
      const { docId: currentDocId, newDocument } = get();
      // If the deleted document was the active one, reset to a new document
      if (currentDocId === docId) {
        newDocument();
      }
      set({ persistenceError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to delete document:', err);
      set({ persistenceError: `Xoá thất bại: ${message}` });
    }
  },
});
