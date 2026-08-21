import React from 'react';
import { useAppStore } from '../lib/store';
import { X, Settings as SettingsIcon, Keyboard, Trash2, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { clearAll } = useAppStore();

  if (!isOpen) return null;

  const shortcuts = [
    { action: 'Chọn ứng viên khi gõ Telex', keys: '1–9 / Space / Enter' },
    { action: 'Đổi vị trí ứng viên', keys: '↑ / ↓' },
    { action: 'Di chuyển con trỏ ô', keys: '← → ↑ ↓' },
    { action: 'Chọn dải nhiều ô', keys: 'Shift + Click' },
    { action: 'Hoàn tác / Làm lại', keys: 'Ctrl+Z / Ctrl+Y' },
  ];

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="chrome-panel w-full max-w-sm p-5 shadow-2xl text-[var(--chrome-text)] space-y-4" style={{ background: 'var(--chrome-surface-elevated)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-[var(--chrome-accent)]" /> Cài đặt & phím tắt
          </h2>
          <button onClick={onClose} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="eyebrow flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" /> Phím tắt soạn thảo
          </div>
          <div className="chrome-panel divide-y text-xs" style={{ borderColor: 'var(--chrome-border)' }}>
            {shortcuts.map((s) => (
              <div key={s.action} className="flex justify-between items-center gap-3 px-3 py-2">
                <span className="text-[var(--chrome-text-muted)]">{s.action}</span>
                <span className="font-mono text-[10px] text-[var(--chrome-text)] bg-black/30 px-1.5 py-0.5 rounded shrink-0">{s.keys}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--chrome-border)' }}>
          <Info className="w-3.5 h-3.5 text-[var(--chrome-accent)] shrink-0 mt-0.5" />
          <p className="text-[var(--chrome-text-muted)] leading-relaxed">
            Web app chuyên biệt dành cho việc bảo tồn và soạn thảo văn bản chữ Hán Nôm / Hán Dao bằng bộ gõ phiên âm Telex.
          </p>
        </div>

        <div className="flex justify-between items-center pt-1">
          <button
            onClick={() => {
              if (window.confirm('Xoá toàn bộ văn bản hiện tại?')) {
                clearAll();
                onClose();
              }
            }}
            className="text-xs text-[var(--chrome-danger)] hover:opacity-80 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xoá trang
          </button>
          <button onClick={onClose} className="px-3.5 py-1.5 bg-[var(--chrome-accent)] hover:opacity-90 text-[#0B0F14] text-xs rounded-lg cursor-pointer font-medium transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};