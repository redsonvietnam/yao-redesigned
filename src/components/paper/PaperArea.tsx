import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../lib/store';
import { getGridDimensions } from '../../lib/grid';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '../../lib/constants';
import { PaperCell } from './PaperCell';
import { CandidatePopup } from './CandidatePopup';
import { PaperContextMenu } from './PaperContextMenu';
import { HorizontalRuler, VerticalRuler } from './PaperRuler';
import { PaperKeyboardHandler } from './PaperKeyboardHandler';

export const PaperArea: React.FC = () => {
  const {
    cells,
    cursor,
    setCursor,
    preedit,
    setPreedit,
    candidates,
    selectedCandIdx,
    moveCandidate,
    commitCandidate,
    backspace,
    moveCursor,
    insertChar,
    mode,
    textFlow,
    inputMode,
    showGrid,
    selectedCellIndices,
    setSelectedCellIndices,
    setLookupChar,
    gridDensity,
    showRuler,
    paperTheme,
    cellSize,
    setCellSize,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setSelectedColor,
    setSelectedFont,
    selectedColor,
    selectedFont,
    isBold,
    isItalic,
    isUnderline,
    deleteSelection,
    selectAll,
    pasteText,
    copySelectionText,
    cutSelectionText,
    undo,
    redo,
  } = useAppStore();

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const paperWrapRef = useRef<HTMLDivElement>(null);

  // Mouse Drag Selection State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cellIndex: number;
    char: string;
  } | null>(null);

  // Focus hidden input on click
  const handlePaperClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.context-menu')) return;
    hiddenInputRef.current?.focus();
    setContextMenu(null);
  }, []);

  // Global mouse listeners for drag selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStartIdx(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Optional Ctrl + Mouse Wheel for quick zooming on canvas
  const handlePaperWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const newSize = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cellSize + delta));
      setCellSize(newSize);
    }
  }, [cellSize, setCellSize]);

  // Determine Grid Dimensions based on density & orientation
  const dims = useMemo(() => getGridDimensions(gridDensity, mode), [gridDensity, mode]);
  const CAP = dims.ROWS * dims.COLS;
  const totalSlots = Math.max(cells.length, cursor) + 1;
  const pageCount = Math.max(1, Math.ceil(totalSlots / CAP));

  // Position for candidate chop popup
  const [chopPos, setChopPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!preedit) {
      setChopPos(null);
      return;
    }
    const cursorCell = paperWrapRef.current?.querySelector(`.cell[data-idx="${cursor}"]`);
    if (cursorCell) {
      const rect = cursorCell.getBoundingClientRect();
      setChopPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 340),
      });
    }
  }, [preedit, cursor, cells, mode, gridDensity]);

  // Keyboard navigation & Shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const composing = preedit.length > 0;
    const { ROWS, COLS } = dims;

    // Handle Control / Cmd Shortcuts
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'c') {
        e.preventDefault();
        const text = copySelectionText();
        if (text) navigator.clipboard.writeText(text);
        return;
      }
      if (key === 'x') {
        e.preventDefault();
        const text = cutSelectionText();
        if (text) navigator.clipboard.writeText(text);
        return;
      }
      if (key === 'v') {
        return;
      }
      if (key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }
      if (key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (key === 'p') {
        e.preventDefault();
        window.print();
        return;
      }
      if (key === 'b') {
        e.preventDefault();
        toggleBold();
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        toggleItalic();
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        toggleUnderline();
        return;
      }
    }

    if (composing) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveCandidate(-1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveCandidate(1);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        commitCandidate();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setPreedit('');
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
        return;
      }
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        commitCandidate(parseInt(e.key, 10) - 1);
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        setPreedit(preedit + e.key.toLowerCase());
        return;
      }
      e.preventDefault();
      return;
    }

    // Deleting selected range or backspacing
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (selectedCellIndices.length > 0) {
        deleteSelection();
      } else {
        backspace();
      }
      return;
    }

    // Non-composing keyboard navigation
    const isVerticalFlow = textFlow === 'top-to-bottom-rtl';

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (isVerticalFlow) moveCursor(ROWS);
      else moveCursor(-1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (isVerticalFlow) moveCursor(-ROWS);
      else moveCursor(1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isVerticalFlow) moveCursor(-1);
      else moveCursor(-COLS);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (isVerticalFlow) moveCursor(1);
      else moveCursor(COLS);
      return;
    }

    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      if (inputMode === 'han') {
        setPreedit(e.key.toLowerCase());
      } else {
        insertChar(e.key);
      }
      return;
    }

    if (e.key === ' ' && inputMode === 'latin') {
      e.preventDefault();
      insertChar(' ');
      return;
    }
  }, [preedit, dims, textFlow, inputMode, selectedCellIndices, copySelectionText, cutSelectionText, selectAll, undo, redo, moveCandidate, commitCandidate, setPreedit, backspace, deleteSelection, moveCursor, insertChar, toggleBold, toggleItalic, toggleUnderline]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (text) {
      pasteText(text);
    }
  }, [pasteText]);

  // Mouse Drag Selection Handlers
  const handleCellMouseDown = useCallback((idx: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    hiddenInputRef.current?.focus();
    setContextMenu(null);

    if (e.shiftKey) {
      const start = Math.min(cursor, idx);
      const end = Math.max(cursor, idx);
      const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setSelectedCellIndices(indices);
    } else {
      setIsDragging(true);
      setDragStartIdx(idx);
      setCursor(Math.min(idx, cells.length));
      setSelectedCellIndices([idx]);
    }
  }, [cursor, cells.length, setCursor, setSelectedCellIndices]);

  const handleCellMouseEnter = useCallback((idx: number) => {
    if (isDragging && dragStartIdx !== null) {
      const start = Math.min(dragStartIdx, idx);
      const end = Math.max(dragStartIdx, idx);
      const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setSelectedCellIndices(indices);
    }
  }, [isDragging, dragStartIdx, setSelectedCellIndices]);

  const handleCellContextMenu = useCallback((idx: number, char: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedCellIndices.includes(idx)) {
      setSelectedCellIndices([idx]);
    }
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 260),
      y: Math.min(e.clientY, window.innerHeight - 340),
      cellIndex: idx,
      char,
    });
  }, [selectedCellIndices, setSelectedCellIndices]);

  // Theme paper background class helper
  const getThemeClass = useCallback(() => {
    if (paperTheme === 'white') return 'bg-white text-black shadow-2xl border-gray-300';
    if (paperTheme === 'dark') return 'bg-[#1a1612] text-[#f2e7d0] shadow-2xl border-[#a68a5b]/40';
    return '';
  }, [paperTheme]);

  return (
    <div
      ref={paperWrapRef}
      onClick={handlePaperClick}
      onWheel={handlePaperWheel}
      className="paper-wrap desk-mat flex-1 border border-[#a68a5b]/30 rounded-2xl p-1 sm:p-2.5 relative flex flex-col items-center justify-start h-full min-h-0 overflow-hidden shadow-2xl transition-all select-none"
    >
      {/* Word Page Container - Maximized Height Viewport */}
      <div className="w-full h-full overflow-y-auto overflow-x-auto p-1 sm:p-3 flex flex-col items-center gap-4 scrollbar-thin">
        {Array.from({ length: pageCount }).map((_, pIdx) => (
          <div key={pIdx} className="relative group shrink-0">
            {showRuler && <HorizontalRuler cols={dims.COLS} />}

            <div className="flex relative">
              {showRuler && <VerticalRuler rows={dims.ROWS} />}
              {/* Page Grid Canvas */}
              <div
                className={`page ${mode} tf-${textFlow} ${showGrid ? 'grid-on' : ''} ${getThemeClass()} relative`}
                style={
                  textFlow === 'top-to-bottom-rtl'
                    ? { gridTemplateRows: `repeat(${dims.ROWS}, var(--cell))` }
                    : { gridTemplateColumns: `repeat(${dims.COLS}, var(--cell))` }
                }
              >
                {Array.from({ length: CAP }).map((_, slotIdx) => {
                  const globalIdx = pIdx * CAP + slotIdx;
                  return (
                    <PaperCell
                      key={globalIdx}
                      globalIdx={globalIdx}
                      cellData={cells[globalIdx]}
                      isCursor={globalIdx === cursor}
                      isSelected={selectedCellIndices.includes(globalIdx)}
                      preedit={preedit}
                      paperTheme={paperTheme}
                      onMouseDown={handleCellMouseDown}
                      onMouseEnter={handleCellMouseEnter}
                      onContextMenu={handleCellContextMenu}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chop Candidate Popup */}
      <CandidatePopup
        preedit={preedit}
        candidates={candidates}
        selectedCandIdx={selectedCandIdx}
        chopPos={chopPos}
        commitCandidate={commitCandidate}
      />

      {/* Right Click Context Menu */}
      {contextMenu && (
        <PaperContextMenu
          contextMenu={contextMenu}
          isBold={isBold}
          isItalic={isItalic}
          isUnderline={isUnderline}
          selectedColor={selectedColor}
          selectedFont={selectedFont}
          toggleBold={toggleBold}
          toggleItalic={toggleItalic}
          toggleUnderline={toggleUnderline}
          setSelectedColor={setSelectedColor}
          setSelectedFont={setSelectedFont}
          copySelectionText={copySelectionText}
          cutSelectionText={cutSelectionText}
          pasteText={pasteText}
          selectAll={selectAll}
          deleteSelection={deleteSelection}
          setLookupChar={setLookupChar}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Hidden input for receiving keyboard events & clipboard paste */}
      <PaperKeyboardHandler
        ref={hiddenInputRef}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  );
};
