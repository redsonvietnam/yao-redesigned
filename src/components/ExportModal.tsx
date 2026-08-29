import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { X, FileText, Printer, Check, Download } from 'lucide-react';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, "&quot;")
    .replace(/'/g, '&#39;');
}

export function generateExportHTML(
  docTitle: string,
  cells: { char: string }[],
  cellSize: number,
): string {
  const exportCellSize = cellSize;
  const exportGlyphSize = Math.round(exportCellSize * 0.61);

  const charsHtml = cells
    .map(
      (c) =>
        '<div style="width:' + exportCellSize + 'px;height:' + exportCellSize + 'px;border:1px solid #a68a5b;display:flex;align-items:center;justify-content:center;font-size:' + exportGlyphSize + 'px;font-family:\'Noto Serif SC\',serif;">' + escapeHtml(c.char) + '</div>'
    )
    .join('');

  return '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<title>' + escapeHtml(docTitle) + '</title>' +
    '<style>' +
    'body { background: #f2e7d0; color: #15120e; padding: 40px; font-family: sans-serif; }' +
    '.grid { display: flex; flex-wrap: wrap; gap: 4px; max-width: 600px; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<h1>' + escapeHtml(docTitle) + '</h1>' +
    '<div class="grid">' + charsHtml + '</div>' +
    '</body>' +
    '</html>';
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { docTitle, cells, cellSize } = useAppStore();
  const [exportedMsg, setExportedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportText = () => {
    const textContent = cells.map((c) => c.char).join('');
    const blob = new Blob(['T\xc3\xa0i li\xc3\xa7u: ' + docTitle + '\n\nV\xc4\x83n b\xc3\xa3n:\n' + textContent], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docTitle + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    setExportedMsg('\xc4\x90\xc3\xa3 xu\xc3\xa5t file v\xc4\x83n b\xc3\xa3n th\xc3\xa0nh c\xc3\xb4ng!');
  };

  const handleExportHTML = () => {
    const htmlStr = generateExportHTML(docTitle, cells, cellSize);

    const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docTitle + '.html';
    a.click();
    URL.revokeObjectURL(url);
    setExportedMsg('\xc4\x90\xc3\xa3 xu\xc3\xa5t file HTML b\xc3\xa3n th\xc3\xa3o!');
  };

  const handlePrint = () => {
    onClose();
    setTimeout(() => window.print(), 200);
  };

  const options = [
    { onClick: handleExportHTML, icon: FileText, accent: 'var(--chrome-accent)', title: 'Trang Web B\xc3\xa3n th\xc3\xa3o (.HTML)', desc: 'Gi\xc6\xb0 nguy\xc6\xb0n l\xc6\xb0\xc6\xb0i \xc3\xb4, n\xc3\xa9t ch\xc3\xa9t v\xc3\xa0 ph\xc6\xb0ng Noto Serif SC' },
    { onClick: handleExportText, icon: FileText, accent: 'var(--brass-400)', title: 'V\xc4\x83n b\xc3\xa3n thu\xc3\xa7n (.TXT)', desc: 'T\xc7\x8bp UTF-8 t\xc6\xb0\xc6\xb0ng th\xc3\xadch m\xc6\xb0\xc6\xb0i thi\xc3\xabt b\xc3\xab' },
    { onClick: handlePrint, icon: Printer, accent: 'var(--chrome-success)', title: '\xc4\x90\xc3\xa3n \xc3\xa5n ho\xc3\xa1c l\xc6\xb0u PDF', desc: 'Xu\xc3\xa5t ra kh\xc6\xb0 A4/Letter ho\xc3\xa1c l\xc6\xb0u PDF (Ctrl+P)' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="chrome-panel w-full max-w-sm p-5 shadow-2xl text-[var(--chrome-text)] space-y-4" style={{ background: 'var(--chrome-surface-elevated)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--chrome-accent)]" /> Xu\xc4\x91t & In b\xc3\xa3n th\xc3\xa3o
          </h2>
          <button onClick={onClose} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        {exportedMsg && (
          <div className="p-2.5 text-[11px] text-[var(--chrome-success)] rounded-lg flex items-center gap-2" style={{ background: 'var(--chrome-success-dim)' }}>
            <Check className="w-3.5 h-3.5 text-[var(--chrome-success)] shrink-0" /> {exportedMsg}
          </div>
        )}

        <div className="space-y-1.5">
          {options.map((opt) => (
            <button
              key={opt.title}
              onClick={opt.onClick}
              className="w-full p-2.5 chrome-group hover:bg-[var(--chrome-accent-dim)] rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: opt.accent + '22', color: opt.accent }}
              >
                <opt.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold">{opt.title}</div>
                <div className="text-[10px] text-[var(--chrome-text-muted)] truncate">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};