import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { transform } from '../lib/imeEngine';
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  BookOpen,
  Bold,
  Italic,
  Underline,
  MousePointer,
} from 'lucide-react';
import { GridDensity, LayoutMode } from '../types';

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
    // Store functions for editing & selection
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

  // High-quality, standard Chinese CJK calligraphic and serif fonts
  const fontOptions = [
    { label: 'Tống Thể (Chữ In Cổ)', value: 'Noto Serif SC' },
    { label: 'Thư Pháp Mã Sơn', value: 'Ma Shan Zheng' },
    { label: 'Bút Tháp Cương Bút', value: 'Zhi Mang Xing' },
    { label: 'Hành Thư Long Cang', value: 'Long Cang' },
    { label: 'Thảo Thư Liễu Kiến', value: 'Liu Jian Mao Cao' },
    { label: 'Hắc Thể (Nét Đều Rõ)', value: 'Noto Sans SC' },
  ];

  const colorOptions = [
    { label: 'Thâm Mực (Đen)', hex: '#15120e' },
    { label: 'Chu Thần (Đỏ)', hex: '#b23a2e' },
    { label: 'Trúc Lục (Xanh)', hex: '#4f6a52' },
    { label: 'Kim Đồng (Vàng)', hex: '#a68a5b' },
    { label: 'Chàm Thẫm (Lam)', hex: '#23324d' },
    { label: 'Tử Cấm (Tím)', hex: '#58325a' },
  ];

  // Focus hidden input on click
  const handlePaperClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.context-menu')) return;
    hiddenInputRef.current?.focus();
    setContextMenu(null);
  };

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
  const handlePaperWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 2 : -2;
      const newSize = Math.min(110, Math.max(20, cellSize + delta));
      setCellSize(newSize);
    }
  };

  // Determine Grid Dimensions based on density & orientation
  const getGridDims = (density: GridDensity, layoutMode: LayoutMode) => {
    switch (density) {
      case 'standard':
        return layoutMode === 'vertical' ? { ROWS: 10, COLS: 8 } : { ROWS: 8, COLS: 10 };
      case 'dense':
        return layoutMode === 'vertical' ? { ROWS: 12, COLS: 10 } : { ROWS: 10, COLS: 12 };
      case 'high':
        return layoutMode === 'vertical' ? { ROWS: 15, COLS: 12 } : { ROWS: 12, COLS: 15 };
      case 'ultra':
        return layoutMode === 'vertical' ? { ROWS: 20, COLS: 16 } : { ROWS: 16, COLS: 20 };
      default:
        return layoutMode === 'vertical' ? { ROWS: 12, COLS: 10 } : { ROWS: 10, COLS: 12 };
    }
  };

  const dims = getGridDims(gridDensity, mode);
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

  // Keyboard navigation & Shortcuts (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+A, Delete, etc.)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    if (text) {
      pasteText(text);
    }
  };

  // Mouse Drag Selection Handlers
  const handleCellMouseDown = (idx: number, e: React.MouseEvent) => {
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
  };

  const handleCellMouseEnter = (idx: number) => {
    if (isDragging && dragStartIdx !== null) {
      const start = Math.min(dragStartIdx, idx);
      const end = Math.max(dragStartIdx, idx);
      const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setSelectedCellIndices(indices);
    }
  };

  const handleCellContextMenu = (idx: number, char: string, e: React.MouseEvent) => {
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
  };

  const tagLabel = (t?: string) => {
    switch (t) {
      case 'exact': return 'đúng';
      case 'prefix': return 'gần đúng';
      case 'abbrev': return 'gõ tắt';
      case 'meaning': return 'nghĩa';
      default: return '';
    }
  };

  // Theme paper background class helper
  const getThemeClass = () => {
    if (paperTheme === 'white') return 'bg-white text-black shadow-2xl border-gray-300';
    if (paperTheme === 'dark') return 'bg-[#1a1612] text-[#f2e7d0] shadow-2xl border-[#a68a5b]/40';
    return '';
  };

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
            {/* Word Horizontal Ruler along top */}
            {showRuler && (
              <div className="flex items-center mb-1 text-[9px] font-mono text-[#a68a5b]/70 select-none border-b border-[#a68a5b]/30 pb-0.5">
                <span className="w-6 text-center text-[#b23a2e]">Cột:</span>
                <div className="flex justify-between flex-1 px-1">
                  {Array.from({ length: dims.COLS }).map((_, c) => (
                    <span key={c} className="w-4 text-center">{c + 1}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex relative">
              {/* Word Vertical Ruler along left */}
              {showRuler && (
                <div className="flex flex-col justify-between mr-1 text-[9px] font-mono text-[#a68a5b]/70 select-none border-r border-[#a68a5b]/30 pr-0.5 py-1">
                  {Array.from({ length: dims.ROWS }).map((_, r) => (
                    <span key={r} className="h-4 text-center leading-4">{r + 1}</span>
                  ))}
                </div>
              )}

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
                  const isCursor = globalIdx === cursor;
                  const isSelected = selectedCellIndices.includes(globalIdx);
                  const cellData = cells[globalIdx];

                  return (
                    <div
                      key={globalIdx}
                      data-idx={globalIdx}
                      onMouseDown={(e) => handleCellMouseDown(globalIdx, e)}
                      onMouseEnter={() => handleCellMouseEnter(globalIdx)}
                      onContextMenu={(e) => handleCellContextMenu(globalIdx, cellData?.char || '', e)}
                      className={`cell ${isCursor ? 'cursor' : ''} ${isSelected ? 'selected-cell ring-2 ring-[#b23a2e] bg-[#b23a2e]/20' : ''}`}
                      style={{
                        color: cellData?.color || (paperTheme === 'white' ? '#000000' : 'var(--ink-950)'),
                        fontFamily: cellData?.font || 'Noto Serif SC',
                        fontWeight: cellData?.bold ? '700' : '400',
                        fontStyle: cellData?.italic ? 'italic' : 'normal',
                        textDecoration: cellData?.underline ? 'underline' : 'none',
                      }}
                    >
                      {isCursor && preedit ? (
                        <span className="preedit">{transform(preedit)}</span>
                      ) : (
                        cellData?.char || ''
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chop Candidate Popup */}
      {preedit && chopPos && (
        <div
          className="chop animate-in fade-in zoom-in-95 duration-100 z-50"
          style={{ top: `${chopPos.top}px`, left: `${chopPos.left}px` }}
        >
          {candidates.length === 0 ? (
            <div className="text-xs p-1 text-[#fbe9df]/90">
              Không tìm thấy chữ khớp với "{transform(preedit)}"
            </div>
          ) : (
            candidates.slice(0, 9).map((c, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  commitCandidate(idx);
                }}
                className={`cand ${idx === selectedCandIdx ? 'selected' : ''}`}
              >
                <span className="num">{idx + 1}</span>
                <span className="glyph">{c.hanzi}</span>
                <span className="gloss">{c.meaning || ''}</span>
                <span className="tag">{tagLabel(c.matchType)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Right Click Context Menu for Full Word Formatting & Editing */}
      {contextMenu && (
        <div
          className="context-menu fixed z-50 bg-[#1c1712]/95 backdrop-blur-xl border border-[#a68a5b]/40 rounded-2xl shadow-2xl p-2 w-64 text-xs text-[#cdb996] animate-in fade-in duration-150 space-y-1"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {/* Quick Format Toolbar inside Context Menu */}
          <div className="flex items-center justify-between bg-[#120e0b] p-1 rounded-xl border border-[#a68a5b]/20 mb-1">
            <button
              onClick={() => {
                toggleBold();
              }}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                isBold ? 'bg-[#b23a2e] text-white' : 'hover:text-white'
              }`}
              title="Đậm (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                toggleItalic();
              }}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                isItalic ? 'bg-[#b23a2e] text-white' : 'hover:text-white'
              }`}
              title="Nghiêng (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                toggleUnderline();
              }}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                isUnderline ? 'bg-[#b23a2e] text-white' : 'hover:text-white'
              }`}
              title="Gạch chân (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-[#a68a5b]/30" />
            <div className="flex items-center gap-1">
              {colorOptions.slice(0, 4).map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setSelectedColor(c.hex);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border border-white/30 cursor-pointer ${
                    selectedColor === c.hex ? 'scale-125 ring-2 ring-[#b23a2e]' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Font Selector in Context Menu */}
          <div className="px-1 py-1 border-b border-[#a68a5b]/20">
            <span className="text-[10px] text-[#a68a5b] uppercase font-bold tracking-wider block mb-1">
              Chọn Font Chữ Hán/Dao:
            </span>
            <div className="grid grid-cols-2 gap-1">
              {fontOptions.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setSelectedFont(f.value);
                  }}
                  className={`text-left text-[10px] px-1.5 py-1 rounded truncate border transition-all cursor-pointer ${
                    selectedFont === f.value
                      ? 'bg-[#b23a2e]/30 text-white border-[#b23a2e]'
                      : 'border-[#a68a5b]/20 hover:bg-white/5'
                  }`}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cut, Copy, Paste & Select All */}
          <button
            onClick={() => {
              const text = copySelectionText();
              if (text) navigator.clipboard.writeText(text);
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#b23a2e]/20 hover:text-white rounded-xl flex items-center justify-between cursor-pointer font-medium"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-[#a68a5b]" /> Sao chép (Copy)
            </span>
            <span className="text-[10px] text-[#8f8266] font-mono">Ctrl+C</span>
          </button>

          <button
            onClick={() => {
              const text = cutSelectionText();
              if (text) navigator.clipboard.writeText(text);
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#b23a2e]/20 hover:text-white rounded-xl flex items-center justify-between cursor-pointer font-medium"
          >
            <span className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-[#a68a5b]" /> Cắt (Cut)
            </span>
            <span className="text-[10px] text-[#8f8266] font-mono">Ctrl+X</span>
          </button>

          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) pasteText(text);
              } catch (err) {
                console.warn('Clipboard read failed:', err);
              }
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#b23a2e]/20 hover:text-white rounded-xl flex items-center justify-between cursor-pointer font-medium"
          >
            <span className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5 text-[#a68a5b]" /> Dán (Paste)
            </span>
            <span className="text-[10px] text-[#8f8266] font-mono">Ctrl+V</span>
          </button>

          <button
            onClick={() => {
              selectAll();
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#b23a2e]/20 hover:text-white rounded-xl flex items-center justify-between cursor-pointer font-medium border-b border-[#a68a5b]/20 pb-1.5"
          >
            <span className="flex items-center gap-2">
              <MousePointer className="w-3.5 h-3.5 text-[#a68a5b]" /> Chọn tất cả (Select All)
            </span>
            <span className="text-[10px] text-[#8f8266] font-mono">Ctrl+A</span>
          </button>

          {contextMenu.char && (
            <button
              onClick={() => {
                setLookupChar(contextMenu.char);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-[#b23a2e]/20 hover:text-white rounded-xl flex items-center gap-2 cursor-pointer font-medium"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#a68a5b]" />
              <span>Tra từ điển '{contextMenu.char}'</span>
            </button>
          )}

          <button
            onClick={() => {
              deleteSelection();
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#b23a2e]/30 text-[#b23a2e] rounded-xl flex items-center justify-between cursor-pointer font-medium"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Xoá các ô đã chọn
            </span>
            <span className="text-[10px] font-mono">Delete</span>
          </button>
        </div>
      )}

      {/* Hidden input for receiving keyboard events & clipboard paste */}
      <input
        ref={hiddenInputRef}
        type="text"
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="sr-only opacity-0 pointer-events-none fixed top-0 left-0"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
};
