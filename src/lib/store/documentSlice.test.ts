import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('documentSlice', () => {
  beforeEach(() => {
    useAppStore.setState({
      cells: [],
      cursor: 0,
      selectedCellIndices: [],
      selectedColor: '#15120e',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      preedit: '',
      candidates: [],
      selectedCandIdx: 0,
    });
  });

  describe('insertChar', () => {
    it('inserts a character at cursor position', () => {
      useAppStore.getState().insertChar('盤');
      const { cells, cursor } = useAppStore.getState();
      expect(cells).toHaveLength(1);
      expect(cells[0].char).toBe('盤');
      expect(cells[0].id).toBeDefined();
      expect(typeof cells[0].id).toBe('string');
      expect(cells[0].id.length).toBeGreaterThan(0);
      expect(cursor).toBe(1);
    });

    it('inserts at correct cursor position in middle', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
        ],
        cursor: 1,
      });
      useAppStore.getState().insertChar('天');
      const { cells, cursor } = useAppStore.getState();
      expect(cells.map((c) => c.char)).toEqual(['盤', '天', '王']);
      expect(cursor).toBe(2);
    });

    it('generates unique IDs for each cell', () => {
      useAppStore.getState().insertChar('盤');
      useAppStore.getState().insertChar('王');
      const { cells } = useAppStore.getState();
      expect(cells[0].id).not.toBe(cells[1].id);
    });

    it('applies current formatting to inserted cell', () => {
      useAppStore.setState({ isBold: true, isItalic: true, selectedColor: '#b23a2e' });
      useAppStore.getState().insertChar('盤');
      const cell = useAppStore.getState().cells[0];
      expect(cell.bold).toBe(true);
      expect(cell.italic).toBe(true);
      expect(cell.color).toBe('#b23a2e');
    });

    it('omits default color from cell', () => {
      useAppStore.getState().insertChar('盤');
      const cell = useAppStore.getState().cells[0];
      expect(cell.color).toBeUndefined();
    });
  });

  describe('backspace', () => {
    it('removes the character before cursor', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
        ],
        cursor: 2,
      });
      useAppStore.getState().backspace();
      const { cells, cursor } = useAppStore.getState();
      expect(cells).toHaveLength(1);
      expect(cells[0].char).toBe('盤');
      expect(cursor).toBe(1);
    });

    it('does nothing when cursor is at 0', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }],
        cursor: 0,
      });
      useAppStore.getState().backspace();
      expect(useAppStore.getState().cells).toHaveLength(1);
      expect(useAppStore.getState().cursor).toBe(0);
    });

    it('does nothing when cells are empty', () => {
      useAppStore.getState().backspace();
      expect(useAppStore.getState().cells).toHaveLength(0);
    });
  });

  describe('moveCursor', () => {
    it('moves cursor forward', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }, { id: '2', char: '王' }],
        cursor: 0,
      });
      useAppStore.getState().moveCursor(1);
      expect(useAppStore.getState().cursor).toBe(1);
    });

    it('moves cursor backward', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }, { id: '2', char: '王' }],
        cursor: 2,
      });
      useAppStore.getState().moveCursor(-1);
      expect(useAppStore.getState().cursor).toBe(1);
    });

    it('clamps cursor at 0', () => {
      useAppStore.setState({ cursor: 0 });
      useAppStore.getState().moveCursor(-5);
      expect(useAppStore.getState().cursor).toBe(0);
    });

    it('clamps cursor at cells.length', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }],
        cursor: 1,
      });
      useAppStore.getState().moveCursor(5);
      expect(useAppStore.getState().cursor).toBe(1);
    });
  });

  describe('setCursor', () => {
    it('sets cursor to exact index', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }, { id: '2', char: '王' }],
      });
      useAppStore.getState().setCursor(1);
      expect(useAppStore.getState().cursor).toBe(1);
    });

    it('clamps cursor within bounds', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }],
      });
      useAppStore.getState().setCursor(10);
      expect(useAppStore.getState().cursor).toBe(1);
    });

    it('clears selection when setting cursor', () => {
      useAppStore.setState({ selectedCellIndices: [0, 1, 2] });
      useAppStore.getState().setCursor(1);
      expect(useAppStore.getState().selectedCellIndices).toEqual([]);
    });
  });

  describe('clearAll', () => {
    it('resets cells, cursor, and selection', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }, { id: '2', char: '王' }],
        cursor: 2,
        selectedCellIndices: [0],
      });
      useAppStore.getState().clearAll();
      const state = useAppStore.getState();
      expect(state.cells).toEqual([]);
      expect(state.cursor).toBe(0);
      expect(state.selectedCellIndices).toEqual([]);
    });
  });

  describe('deleteSelection', () => {
    it('removes selected cells', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
          { id: '3', char: '天' },
        ],
        selectedCellIndices: [0, 2],
      });
      useAppStore.getState().deleteSelection();
      const { cells, cursor, selectedCellIndices } = useAppStore.getState();
      expect(cells).toHaveLength(1);
      expect(cells[0].char).toBe('王');
      expect(cursor).toBe(0);
      expect(selectedCellIndices).toEqual([]);
    });

    it('does nothing with empty selection', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }],
        selectedCellIndices: [],
      });
      useAppStore.getState().deleteSelection();
      expect(useAppStore.getState().cells).toHaveLength(1);
    });
  });

  describe('selectAll', () => {
    it('selects all cells', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
          { id: '3', char: '天' },
        ],
      });
      useAppStore.getState().selectAll();
      expect(useAppStore.getState().selectedCellIndices).toEqual([0, 1, 2]);
    });

    it('does nothing when cells are empty', () => {
      useAppStore.setState({ cells: [] });
      useAppStore.getState().selectAll();
      expect(useAppStore.getState().selectedCellIndices).toEqual([]);
    });
  });

  describe('copySelectionText', () => {
    it('copies selected cells as text', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
          { id: '3', char: '天' },
        ],
        selectedCellIndices: [0, 2],
      });
      expect(useAppStore.getState().copySelectionText()).toBe('盤天');
    });

    it('returns single char at cursor when no selection', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }, { id: '2', char: '王' }],
        cursor: 1,
        selectedCellIndices: [],
      });
      expect(useAppStore.getState().copySelectionText()).toBe('王');
    });

    it('returns empty string when no cells', () => {
      useAppStore.setState({ cells: [], selectedCellIndices: [] });
      expect(useAppStore.getState().copySelectionText()).toBe('');
    });
  });

  describe('pasteText', () => {
    it('inserts text at cursor', () => {
      useAppStore.setState({ cells: [], cursor: 0 });
      useAppStore.getState().pasteText('盤王');
      const { cells, cursor } = useAppStore.getState();
      expect(cells).toHaveLength(2);
      expect(cells[0].char).toBe('盤');
      expect(cells[1].char).toBe('王');
      expect(cursor).toBe(2);
    });

    it('does nothing with empty text', () => {
      useAppStore.setState({ cells: [], cursor: 0 });
      useAppStore.getState().pasteText('');
      expect(useAppStore.getState().cells).toHaveLength(0);
    });

    it('deletes selection before pasting', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
          { id: '3', char: '天' },
        ],
        selectedCellIndices: [1],
        cursor: 2,
      });
      useAppStore.getState().pasteText('地');
      const cells = useAppStore.getState().cells;
      expect(cells.map((c) => c.char)).toEqual(['盤', '地', '天']);
    });
  });
});
