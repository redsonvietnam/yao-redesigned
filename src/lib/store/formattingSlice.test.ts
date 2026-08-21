import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('formattingSlice', () => {
  beforeEach(() => {
    useAppStore.setState({
      cells: [],
      selectedCellIndices: [],
      isBold: false,
      isItalic: false,
      isUnderline: false,
      selectedColor: '#15120e',
      selectedFont: 'Noto Serif SC',
    });
  });

  describe('toggleBold', () => {
    it('toggles bold state', () => {
      useAppStore.getState().toggleBold();
      expect(useAppStore.getState().isBold).toBe(true);
      useAppStore.getState().toggleBold();
      expect(useAppStore.getState().isBold).toBe(false);
    });

    it('applies bold to selected cells', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
        ],
        selectedCellIndices: [0],
      });
      useAppStore.getState().toggleBold();
      expect(useAppStore.getState().cells[0].bold).toBe(true);
      expect(useAppStore.getState().cells[1].bold).toBeUndefined();
    });
  });

  describe('toggleItalic', () => {
    it('toggles italic state', () => {
      useAppStore.getState().toggleItalic();
      expect(useAppStore.getState().isItalic).toBe(true);
      useAppStore.getState().toggleItalic();
      expect(useAppStore.getState().isItalic).toBe(false);
    });

    it('applies italic to selected cells', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
        ],
        selectedCellIndices: [1],
      });
      useAppStore.getState().toggleItalic();
      expect(useAppStore.getState().cells[0].italic).toBeUndefined();
      expect(useAppStore.getState().cells[1].italic).toBe(true);
    });
  });

  describe('toggleUnderline', () => {
    it('toggles underline state', () => {
      useAppStore.getState().toggleUnderline();
      expect(useAppStore.getState().isUnderline).toBe(true);
      useAppStore.getState().toggleUnderline();
      expect(useAppStore.getState().isUnderline).toBe(false);
    });

    it('applies underline to selected cells', () => {
      useAppStore.setState({
        cells: [
          { id: '1', char: '盤' },
          { id: '2', char: '王' },
          { id: '3', char: '天' },
        ],
        selectedCellIndices: [0, 2],
      });
      useAppStore.getState().toggleUnderline();
      expect(useAppStore.getState().cells[0].underline).toBe(true);
      expect(useAppStore.getState().cells[1].underline).toBeUndefined();
      expect(useAppStore.getState().cells[2].underline).toBe(true);
    });
  });

  describe('setSelectedColor', () => {
    it('updates selected color', () => {
      useAppStore.getState().setSelectedColor('#b23a2e');
      expect(useAppStore.getState().selectedColor).toBe('#b23a2e');
    });

    it('applies color to selected cells', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }],
        selectedCellIndices: [0],
      });
      useAppStore.getState().setSelectedColor('#4f6a52');
      expect(useAppStore.getState().cells[0].color).toBe('#4f6a52');
    });
  });

  describe('setSelectedFont', () => {
    it('updates selected font', () => {
      useAppStore.getState().setSelectedFont('Ma Shan Zheng');
      expect(useAppStore.getState().selectedFont).toBe('Ma Shan Zheng');
    });

    it('applies font to selected cells', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }],
        selectedCellIndices: [0],
      });
      useAppStore.getState().setSelectedFont('Zhi Mang Xing');
      expect(useAppStore.getState().cells[0].font).toBe('Zhi Mang Xing');
    });
  });

  describe('applyFormattingToSelection', () => {
    it('applies multiple formatting options at once', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }, { id: '2', char: '王' }],
        selectedCellIndices: [0],
      });
      useAppStore.getState().applyFormattingToSelection({
        bold: true,
        italic: true,
        color: '#b23a2e',
      });
      const cell = useAppStore.getState().cells[0];
      expect(cell.bold).toBe(true);
      expect(cell.italic).toBe(true);
      expect(cell.color).toBe('#b23a2e');
    });

    it('does nothing when no cells selected', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤' }],
        selectedCellIndices: [],
      });
      useAppStore.getState().applyFormattingToSelection({ bold: true });
      expect(useAppStore.getState().cells[0].bold).toBeUndefined();
    });

    it('clears formatting with false values', () => {
      useAppStore.setState({
        cells: [{ id: '1', char: '盤', bold: true, italic: true }],
        selectedCellIndices: [0],
      });
      useAppStore.getState().applyFormattingToSelection({ bold: false, italic: false });
      expect(useAppStore.getState().cells[0].bold).toBe(false);
      expect(useAppStore.getState().cells[0].italic).toBe(false);
    });
  });
});
