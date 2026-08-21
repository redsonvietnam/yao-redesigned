import React from 'react';
import { useAppStore } from '../lib/store';
import { getGridCapacity } from '../lib/grid';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '../lib/constants';
import { FileText, ZoomIn, ZoomOut, PanelLeft, Keyboard, Layers } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const {
    cells,
    cursor,
    mode,
    textFlow,
    inputMode,
    gridDensity,
    showSidePanel,
    toggleSidePanel,
    cellSize,
    setCellSize,
    saveError,
    persistenceError,
  } = useAppStore();

  const cap = getGridCapacity(gridDensity, mode);
  const pageCount = Math.max(1, Math.ceil((cells.length + 1) / cap));
  const currentPage = Math.max(1, Math.ceil((cursor + 1) / cap));

  const handleZoomWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setCellSize(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cellSize + delta)));
  };

  return (
    <footer className="no-print w-full h-7 px-3 md:px-4 flex items-center justify-between text-[11px] select-none shrink-0 z-30 font-mono" style={{ background: 'var(--chrome-surface)', color: 'var(--chrome-text-muted)', borderTop: '1px solid var(--chrome-border)' }}>
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1 text-[var(--chrome-text)] font-medium">
          <FileText className="w-3 h-3 text-[var(--chrome-text-muted)]" />
          Trang {currentPage}/{pageCount}
        </span>

        <span style={{ color: 'var(--chrome-border)' }}>·</span>

        <span>
          <b className="text-[var(--chrome-text)]">{cells.length}</b> chữ ({Math.round((cells.length / cap) * 100)}%)
        </span>

        <span style={{ color: 'var(--chrome-border)' }} className="hidden sm:inline">·</span>

        <span className="hidden sm:inline-flex items-center gap-1 text-[var(--chrome-success)] font-medium">
          <Keyboard className="w-3 h-3" /> {inputMode === 'han' ? 'Hán Telex' : 'Latin'}
        </span>

        <span className="hidden md:inline-flex items-center gap-1 text-[var(--chrome-text-muted)]">
          <Layers className="w-3 h-3" /> {mode === 'vertical' ? 'Dọc' : 'Ngang'} · {textFlow === 'top-to-bottom-rtl' ? 'Cổ Phong' : 'Hiện Đại'}
        </span>

        {saveError && (
          <span className="text-[var(--chrome-danger)] font-medium" title={saveError}>
            ⚠ Lưu lỗi
          </span>
        )}

        {persistenceError && (
          <span className="text-[var(--chrome-danger)] font-medium" title={persistenceError}>
            ⚠ {persistenceError}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <div
          onWheel={handleZoomWheel}
          className="flex items-center gap-1 chrome-group px-2 py-0.5"
          title="Lăn chuột hoặc dùng slider để điều chỉnh cỡ ô"
        >
          <button onClick={() => setCellSize(Math.max(MIN_ZOOM, cellSize - 3))} className="text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)] cursor-pointer">
            <ZoomOut className="w-3 h-3" />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            value={cellSize}
            onChange={(e) => setCellSize(parseInt(e.target.value, 10))}
            className="w-14 h-1 accent-[var(--chrome-accent)] cursor-pointer"
          />
          <span className="text-[var(--chrome-text)] w-8 text-center">{cellSize}px</span>
          <button onClick={() => setCellSize(Math.min(MAX_ZOOM, cellSize + 3))} className="text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)] cursor-pointer">
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={toggleSidePanel}
          className={`flex items-center gap-1 cursor-pointer transition-colors ${showSidePanel ? 'text-[var(--chrome-accent)]' : 'text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)]'}`}
          title="Bật/Tắt bảng tra cứu & từ điển"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
