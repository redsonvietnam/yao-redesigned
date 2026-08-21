import React from 'react';
import { COLOR_OPTIONS, FONT_OPTIONS } from '../../lib/constants';
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

interface PaperContextMenuProps {
  contextMenu: { x: number; y: number; cellIndex: number; char: string };
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  selectedColor: string;
  selectedFont: string;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  setSelectedColor: (hex: string) => void;
  setSelectedFont: (font: string) => void;
  copySelectionText: () => string;
  cutSelectionText: () => string;
  pasteText: (text: string) => void;
  selectAll: () => void;
  deleteSelection: () => void;
  setLookupChar: (char: string) => void;
  onClose: () => void;
}

export const PaperContextMenu: React.FC<PaperContextMenuProps> = ({
  contextMenu,
  isBold,
  isItalic,
  isUnderline,
  selectedColor,
  selectedFont,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setSelectedColor,
  setSelectedFont,
  copySelectionText,
  cutSelectionText,
  pasteText,
  selectAll,
  deleteSelection,
  setLookupChar,
  onClose,
}) => {
  return (
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
          {COLOR_OPTIONS.slice(0, 4).map((c) => (
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
          {FONT_OPTIONS.map((f) => (
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
          onClose();
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
          onClose();
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
          onClose();
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
          onClose();
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
            onClose();
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
          onClose();
        }}
        className="w-full text-left px-2.5 py-1.5 hover:bg-[#b23a2e]/30 text-[#b23a2e] rounded-xl flex items-center justify-between cursor-pointer font-medium"
      >
        <span className="flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5" /> Xoá các ô đã chọn
        </span>
        <span className="text-[10px] font-mono">Delete</span>
      </button>
    </div>
  );
};
