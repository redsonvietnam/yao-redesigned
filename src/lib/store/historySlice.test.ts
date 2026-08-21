import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';
import { MAX_HISTORY_ENTRIES } from '../constants';
import { CellData } from '../../types';

function makeCells(text: string): CellData[] {
  return Array.from(text, (char, i) => ({ id: `id-${i}`, char }));
}

describe('historySlice', () => {
  beforeEach(() => {
    useAppStore.setState({
      cells: [],
      cursor: 0,
      history: [],
      historyIdx: -1,
      selectedCellIndices: [],
    });
  });

  describe('pushHistory', () => {
    it('appends cells to history', () => {
      const cells = makeCells('盤王');
      useAppStore.getState().pushHistory(cells);
      const { history, historyIdx } = useAppStore.getState();
      expect(history).toHaveLength(1);
      expect(historyIdx).toBe(0);
      expect(history[0]).toEqual(cells);
    });

    it('truncates future history on new push', () => {
      useAppStore.getState().pushHistory(makeCells('盤'));
      useAppStore.getState().pushHistory(makeCells('盤王'));
      useAppStore.getState().pushHistory(makeCells('盤王天'));

      useAppStore.getState().undo();
      expect(useAppStore.getState().historyIdx).toBe(1);

      useAppStore.getState().pushHistory(makeCells('盤王地'));
      const { history, historyIdx } = useAppStore.getState();
      expect(history).toHaveLength(3);
      expect(historyIdx).toBe(2);
      expect(history[0][0].char).toBe('盤');
      expect(history[1][0].char).toBe('盤');
      expect(history[1][1].char).toBe('王');
      expect(history[2][0].char).toBe('盤');
      expect(history[2][1].char).toBe('王');
      expect(history[2][2].char).toBe('地');
    });
  });

  describe('undo', () => {
    it('restores previous state', () => {
      useAppStore.getState().pushHistory(makeCells('盤'));
      useAppStore.getState().pushHistory(makeCells('盤王'));
      useAppStore.getState().undo();
      const { cells, historyIdx } = useAppStore.getState();
      expect(cells.map((c) => c.char)).toEqual(['盤']);
      expect(historyIdx).toBe(0);
    });

    it('does nothing at history start', () => {
      useAppStore.getState().pushHistory(makeCells('盤'));
      useAppStore.setState({ historyIdx: 0 });
      useAppStore.getState().undo();
      expect(useAppStore.getState().historyIdx).toBe(0);
    });

    it('adjusts cursor if beyond restored cells length', () => {
      useAppStore.getState().pushHistory(makeCells('盤'));
      useAppStore.getState().pushHistory(makeCells('盤王'));
      useAppStore.setState({ cursor: 2 });

      useAppStore.getState().undo();
      expect(useAppStore.getState().cursor).toBe(1);
    });
  });

  describe('redo', () => {
    it('moves forward in history', () => {
      useAppStore.getState().pushHistory(makeCells('盤'));
      useAppStore.getState().pushHistory(makeCells('盤王'));
      useAppStore.getState().undo();
      useAppStore.getState().redo();
      const { cells, historyIdx } = useAppStore.getState();
      expect(cells.map((c) => c.char)).toEqual(['盤', '王']);
      expect(historyIdx).toBe(1);
    });

    it('does nothing at history end', () => {
      useAppStore.getState().pushHistory(makeCells('盤'));
      useAppStore.getState().redo();
      expect(useAppStore.getState().historyIdx).toBe(0);
    });
  });

  describe('undo after pruning', () => {
    it('can undo after history exceeds MAX_HISTORY_ENTRIES', () => {
      for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i++) {
        useAppStore.getState().pushHistory(makeCells(`c${i}`));
      }
      const { history, historyIdx } = useAppStore.getState();
      expect(history.length).toBeLessThanOrEqual(MAX_HISTORY_ENTRIES);
      expect(historyIdx).toBe(history.length - 1);

      useAppStore.getState().undo();
      expect(useAppStore.getState().historyIdx).toBe(historyIdx - 1);
    });
  });

  describe('redo after new edit invalidation', () => {
    it('invalidates redo stack after new push', () => {
      useAppStore.getState().pushHistory(makeCells('a'));
      useAppStore.getState().pushHistory(makeCells('ab'));
      useAppStore.getState().undo();
      expect(useAppStore.getState().historyIdx).toBe(0);
      expect(useAppStore.getState().cells.map((c) => c.char)).toEqual(['a']);

      useAppStore.getState().pushHistory(makeCells('ac'));
      const { history, historyIdx } = useAppStore.getState();
      expect(historyIdx).toBe(1);
      // Cells stay at undo state since pushHistory doesn't modify cells
      expect(useAppStore.getState().cells.map((c) => c.char)).toEqual(['a']);

      // Redo is a no-op because historyIdx === history.length - 1
      useAppStore.getState().redo();
      expect(useAppStore.getState().historyIdx).toBe(1);
      expect(useAppStore.getState().cells.map((c) => c.char)).toEqual(['a']);
    });
  });

  describe('redo behavior', () => {
    it('does not move past end of history', () => {
      useAppStore.getState().pushHistory(makeCells('a'));
      useAppStore.getState().pushHistory(makeCells('ab'));
      useAppStore.getState().redo();
      expect(useAppStore.getState().historyIdx).toBe(1);
      useAppStore.getState().redo();
      expect(useAppStore.getState().historyIdx).toBe(1);
    });
  });
});
