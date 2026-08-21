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
      <div className="bg-[#181410] rounded-2xl w-full max-w-sm p-5 shadow-2xl text-[#f2e7d0] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-[#a68a5b]" /> Cài đặt & phím tắt
          </h2>
          <button onClick={onClose} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="eyebrow flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" /> Phím tắt soạn thảo
          </div>
          <div className="chrome-panel bg-black/25 divide-y divide-white/[0.05] text-xs">
            {shortcuts.map((s) => (
              <div key={s.action} className="flex justify-between items-center gap-3 px-3 py-2">
                <span className="text-[#cdb996]">{s.action}</span>
                <span className="font-mono text-[10px] text-[#e8dcc0] bg-black/40 px-1.5 py-0.5 rounded shrink-0">{s.keys}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 p-3 bg-black/25 rounded-xl text-xs">
          <Info className="w-3.5 h-3.5 text-[#b23a2e] shrink-0 mt-0.5" />
          <p className="text-[#8f8266] leading-relaxed">
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
            className="text-xs text-[#c4544a] hover:text-[#e0655a] cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xoá trang
          </button>
          <button onClick={onClose} className="px-3.5 py-1.5 bg-[#b23a2e] hover:bg-[#8f2e24] text-white text-xs rounded-lg cursor-pointer font-medium transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
