import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './index';

// Mock the db module
const mockStore = new Map<string, unknown>();

vi.mock('../db', () => ({
  db: {
    documents: {
      get: vi.fn(async (id: string) => mockStore.get(id) || undefined),
      put: vi.fn(async (doc: { id: string }) => { mockStore.set(doc.id, doc); }),
      delete: vi.fn(async (id: string) => { mockStore.delete(id); }),
    },
  },
}));

import { db } from '../db';

describe('persistenceSlice', () => {
  beforeEach(() => {
    mockStore.clear();
    vi.mocked(db.documents.get).mockClear();
    vi.mocked(db.documents.put).mockClear();
    vi.mocked(db.documents.delete).mockClear();

    useAppStore.setState({
      docId: 'doc-1',
      docTitle: 'Test Document',
      cells: [{ id: '1', char: '盤' }],
      cursor: 1,
      mode: 'vertical',
      showGrid: true,
      cellSize: 46,
      preedit: '',
      candidates: [],
      selectedCandIdx: 0,
      selectedCellIndices: [],
      history: [[{ id: '1', char: '盤' }]],
      historyIdx: 0,
      saveError: null,
      persistenceError: null,
    });
  });

  describe('saveCurrentDocument', () => {
    it('saves successfully', async () => {
      await useAppStore.getState().saveCurrentDocument();
      expect(db.documents.put).toHaveBeenCalledOnce();
      expect(useAppStore.getState().saveError).toBeNull();
    });

    it('sets saveError on failure', async () => {
      vi.mocked(db.documents.put).mockRejectedValue(new Error('Disk full'));
      await useAppStore.getState().saveCurrentDocument();
      expect(useAppStore.getState().saveError).toContain('Disk full');
    });
  });

  describe('loadDocument', () => {
    it('loads document successfully when it exists in DB', async () => {
      const cells = [{ id: '1', char: '盤' }, { id: '2', char: '王' }];
      vi.mocked(db.documents.get).mockResolvedValue({ id: 'doc-2', title: 'Loaded', cells } as never);

      await useAppStore.getState().loadDocument('doc-2', 'Loaded', cells);
      const state = useAppStore.getState();
      expect(state.docId).toBe('doc-2');
      expect(state.docTitle).toBe('Loaded');
      expect(state.cells).toEqual(cells);
      expect(state.persistenceError).toBeNull();
    });

    it('sets persistenceError when document does not exist', async () => {
      vi.mocked(db.documents.get).mockResolvedValue(undefined);

      await useAppStore.getState().loadDocument('doc-missing', 'Missing', []);
      expect(useAppStore.getState().persistenceError).toContain('không tồn tại');
      expect(useAppStore.getState().docId).not.toBe('doc-missing');
    });

    it('sets persistenceError on DB error', async () => {
      vi.mocked(db.documents.get).mockRejectedValue(new Error('DB corrupted'));

      await useAppStore.getState().loadDocument('doc-1', 'Test', []);
      expect(useAppStore.getState().persistenceError).toContain('DB corrupted');
    });
  });

  describe('deleteDocument', () => {
    it('deletes existing document', async () => {
      vi.mocked(db.documents.get).mockResolvedValue({ id: 'doc-2', title: 'To Delete' } as never);
      vi.mocked(db.documents.delete).mockResolvedValue(undefined);

      await useAppStore.getState().deleteDocument('doc-2');
      expect(db.documents.delete).toHaveBeenCalledWith('doc-2');
      expect(useAppStore.getState().persistenceError).toBeNull();
    });

    it('sets persistenceError when deleting nonexistent document', async () => {
      vi.mocked(db.documents.get).mockResolvedValue(undefined);

      await useAppStore.getState().deleteDocument('doc-missing');
      expect(useAppStore.getState().persistenceError).toContain('không tồn tại');
      expect(db.documents.delete).not.toHaveBeenCalled();
    });

    it('creates new document when deleting active document', async () => {
      vi.mocked(db.documents.get).mockResolvedValue({ id: 'doc-1', title: 'Current' } as never);
      vi.mocked(db.documents.delete).mockResolvedValue(undefined);

      await useAppStore.getState().deleteDocument('doc-1');
      const state = useAppStore.getState();
      expect(state.docId).not.toBe('doc-1');
      expect(state.cells).toEqual([]);
      expect(state.docTitle).toContain('Bản thảo');
    });

    it('does not create new document when deleting non-active document', async () => {
      const originalDocId = useAppStore.getState().docId;
      vi.mocked(db.documents.get).mockResolvedValue({ id: 'doc-other', title: 'Other' } as never);
      vi.mocked(db.documents.delete).mockResolvedValue(undefined);

      await useAppStore.getState().deleteDocument('doc-other');
      expect(useAppStore.getState().docId).toBe(originalDocId);
    });

    it('sets persistenceError on delete failure', async () => {
      vi.mocked(db.documents.get).mockResolvedValue({ id: 'doc-2' } as never);
      vi.mocked(db.documents.delete).mockRejectedValue(new Error('Permission denied'));

      await useAppStore.getState().deleteDocument('doc-2');
      expect(useAppStore.getState().persistenceError).toContain('Permission denied');
    });
  });
});
