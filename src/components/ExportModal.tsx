import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { X, FileText, Printer, Check, Download } from 'lucide-react';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { docTitle, cells } = useAppStore();
  const [exportedMsg, setExportedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportText = () => {
    const textContent = cells.map((c) => c.char).join('');
    const blob = new Blob([`Tài liệu: ${docTitle}\n\nVăn bản:\n${textContent}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExportedMsg('Đã xuất file văn bản thành công!');
  };

  const handleExportHTML = () => {
    const charsHtml = cells
      .map(
        (c) =>
          `<div style="width:52px;height:52px;border:1px solid #a68a5b;display:flex;align-items:center;justify-content:center;font-size:32px;font-family:'Noto Serif SC',serif;">${escapeHtml(c.char)}</div>`
      )
      .join('');

    const htmlStr = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(docTitle)}</title>
<style>
body { background: #f2e7d0; color: #15120e; padding: 40px; font-family: sans-serif; }
.grid { display: flex; flex-wrap: wrap; gap: 4px; max-width: 600px; }
</style>
</head>
<body>
<h1>${escapeHtml(docTitle)}</h1>
<div class="grid">${charsHtml}</div>
</body>
</html>`;

    const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setExportedMsg('Đã xuất file HTML bản thảo!');
  };

  const handlePrint = () => {
    onClose();
    setTimeout(() => window.print(), 200);
  };

  const options = [
    { onClick: handleExportHTML, icon: FileText, accent: 'var(--chrome-accent)', title: 'Trang Web Bản thảo (.HTML)', desc: 'Giữ nguyên lưới ô, nét chữ và phông Noto Serif SC' },
    { onClick: handleExportText, icon: FileText, accent: 'var(--brass-400)', title: 'Văn bản thuần (.TXT)', desc: 'Tệp UTF-8 tương thích mọi thiết bị' },
    { onClick: handlePrint, icon: Printer, accent: 'var(--chrome-success)', title: 'In ấn hoặc lưu PDF', desc: 'Xuất ra khổ A4/Letter hoặc lưu PDF (Ctrl+P)' },
  ];

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="chrome-panel w-full max-w-sm p-5 shadow-2xl text-[var(--chrome-text)] space-y-4" style={{ background: 'var(--chrome-surface-elevated)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--chrome-accent)]" /> Xuất & In bản thảo
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
                style={{ backgroundColor: `${opt.accent}22`, color: opt.accent }}
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