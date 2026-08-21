import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { COLOR_OPTIONS, FONT_OPTIONS, GRID_DENSITIES, MIN_ZOOM, MAX_ZOOM } from '../lib/constants';
import {
  Save,
  Plus,
  Undo2,
  Redo2,
  FolderOpen,
  FileDown,
  SlidersHorizontal,
  BookOpen,
  PanelLeft,
  Pencil,
  Sparkles,
  Layout,
  Eye,
  Type,
  Trash2,
  Bold,
  Italic,
  Underline,
  ZoomIn,
  Palette,
  Grid,
  Ruler,
  Layers,
  Keyboard,
  Search,
  Camera,
  Stamp,
} from 'lucide-react';
import { RibbonTab } from '../types';

interface HeaderBarProps {
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenExportModal,
  onOpenSettingsModal,
}) => {
  const {
    docId,
    docTitle,
    setDocTitle,
    ribbonTab,
    setRibbonTab,
    showSidePanel,
    toggleSidePanel,
    undo,
    redo,
    historyIdx,
    history,
    saveCurrentDocument,
    loadDocument,
    newDocument,
    deleteDocument,
    persistenceError,
    cellSize,
    setCellSize,
    isBold,
    toggleBold,
    isItalic,
    toggleItalic,
    isUnderline,
    toggleUnderline,
    selectedColor,
    setSelectedColor,
    selectedFont,
    setSelectedFont,
    insertChar,
    mode,
    setMode,
    textFlow,
    setTextFlow,
    inputMode,
    setInputMode,
    showGrid,
    setShowGrid,
    gridDensity,
    setGridDensity,
    showRuler,
    setShowRuler,
    paperTheme,
    setPaperTheme,
    setActiveTab,
    setShowSymbolPicker,
  } = useAppStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(docTitle);
  const [showDocMenu, setShowDocMenu] = useState(false);

  const savedDocs = useLiveQuery(() => db.documents.orderBy('updatedAt').reverse().toArray());

  useEffect(() => {
    setTempTitle(docTitle);
  }, [docTitle]);

  useEffect(() => {
    if (!showDocMenu) return;
    const close = () => setShowDocMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showDocMenu]);

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      setDocTitle(tempTitle.trim());
      await saveCurrentDocument();
    }
  };

  const tabs: { id: RibbonTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'insert', label: 'Insert', icon: <Plus className="w-3.5 h-3.5" /> },
    { id: 'layout', label: 'Layout', icon: <Layout className="w-3.5 h-3.5" /> },
    { id: 'tools', label: 'Tools', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'view', label: 'View', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  const daoSymbols = ['，', '。', '、', '；', '：', '「', '」', '『', '』', '〇', '※', '✦'];
  const sealStamps = ['印', '稿', '章', '壽', '福', '吉'];

  return (
    <header className="no-print w-full px-3 md:px-4 h-11 flex items-center gap-2 sticky top-0 z-40 shrink-0" style={{ background: 'var(--chrome-surface)', borderBottom: '1px solid var(--chrome-border)' }}>
      {/* Seal + Title + Document switcher */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#5CC8FF] to-[#8B7CFF] flex items-center justify-center shrink-0">
          <span className="font-['Noto_Serif_SC'] text-[#0B0F14] font-bold text-sm leading-none">稿</span>
        </div>

        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="chrome-field text-xs px-2 py-1 w-40"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-[13px] font-semibold text-[var(--chrome-text)] hover:text-white truncate max-w-[140px] md:max-w-[200px] cursor-pointer flex items-center gap-1 group/title"
            title="Đổi tên bản thảo"
          >
            <span className="truncate">{docTitle}</span>
            <Pencil className="w-3 h-3 opacity-0 group-hover/title:opacity-60 transition-opacity shrink-0" />
          </button>
        )}

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowDocMenu((v) => !v)}
            className="icon-btn"
            title="Kho bản thảo đã lưu"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          {showDocMenu && (
            <div className="absolute left-0 mt-2 w-72 chrome-panel shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between px-1.5 py-1 mb-1">
                <span className="eyebrow flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-[var(--chrome-accent)]" /> Saved drafts
                </span>
                <button
                  onClick={() => {
                    newDocument();
                    setShowDocMenu(false);
                  }}
                  className="text-[10px] bg-[var(--chrome-accent)] text-[#0B0F14] px-2 py-1 rounded-md hover:opacity-90 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {savedDocs && savedDocs.length > 0 ? (
                  savedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        loadDocument(doc.id, doc.title, doc.cells);
                        setShowDocMenu(false);
                      }}
                      className={`chrome-row w-full flex items-center justify-between ${
                        doc.id === docId ? 'bg-[var(--chrome-accent-dim)] text-[var(--chrome-text)]' : 'text-[var(--chrome-text-muted)]'
                      }`}
                    >
                      <span className="truncate text-xs flex-1 select-none">{doc.title}</span>
                      <span className="text-[10px] text-[var(--chrome-text-muted)] font-mono shrink-0 mr-1 select-none">{doc.cells?.length || 0} cells</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                        }}
                        className="p-1 hover:bg-[var(--chrome-danger)]/20 rounded transition-colors cursor-pointer shrink-0"
                        title="Xoá bản thảo"
                      >
                        <Trash2 className="w-3 h-3 text-[var(--chrome-text-muted)] hover:text-[var(--chrome-danger)]" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-[var(--chrome-text-muted)] py-4 text-center">No drafts yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chrome-divider" />

      {/* Undo / redo / save */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={undo} disabled={historyIdx <= 0} className="icon-btn" title="Hoàn tác (Ctrl+Z)">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={redo} disabled={historyIdx >= history.length - 1} className="icon-btn" title="Làm lại (Ctrl+Y)">
          <Redo2 className="w-4 h-4" />
        </button>
        <button onClick={saveCurrentDocument} className="icon-btn" title="Lưu bản thảo (Ctrl+S)">
          <Save className="w-4 h-4" />
        </button>
      </div>

      <div className="chrome-divider" />

      {/* Ribbon tabs — compact center */}
      <div className="flex items-center shrink-0">
        <div className="chrome-group overflow-x-auto max-w-full no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRibbonTab(tab.id)}
              className={`chrome-seg flex items-center gap-1 ${ribbonTab === tab.id ? 'is-active' : ''}`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="chrome-divider" />

      {/* Context-sensitive controls based on active ribbon tab */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar">

        {/* HOME tab controls */}
        {ribbonTab === 'home' && (
          <div className="flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar">
            <div className="chrome-group">
              <button onClick={() => setMode('vertical')} className={`chrome-seg ${mode === 'vertical' ? 'is-active' : ''}`} title="Dọc">Dọc</button>
              <button onClick={() => setMode('horizontal')} className={`chrome-seg ${mode === 'horizontal' ? 'is-active' : ''}`} title="Ngang">Ngang</button>
            </div>

            <div className="chrome-group">
              <button
                onClick={() => setTextFlow('top-to-bottom-rtl')}
                className={`chrome-seg flex items-center gap-1 ${textFlow === 'top-to-bottom-rtl' ? 'is-active' : ''}`}
                title="Cổ Phong"
              >
                <span className="font-mono opacity-70 text-[10px]">↓⬅</span>
                <span className="hidden md:inline">Cổ Phong</span>
              </button>
              <button
                onClick={() => setTextFlow('left-to-right-ttb')}
                className={`chrome-seg flex items-center gap-1 ${textFlow === 'left-to-right-ttb' ? 'is-active' : ''}`}
                title="Hiện Đại"
              >
                <span className="font-mono opacity-70 text-[10px]">➡↓</span>
                <span className="hidden md:inline">Hiện Đại</span>
              </button>
            </div>

            <div className="chrome-group">
              <button onClick={() => setInputMode('han')} className={`chrome-seg ${inputMode === 'han' ? 'is-active !bg-[var(--chrome-success)]! !text-[#0B0F14]!' : ''}`}>Hán</button>
              <button onClick={() => setInputMode('latin')} className={`chrome-seg ${inputMode === 'latin' ? 'is-active !bg-[var(--chrome-success)]! !text-[#0B0F14]!' : ''}`}>Latin</button>
            </div>

            <div className="chrome-divider hidden lg:block" />

            <div className="chrome-group">
              <button onClick={toggleBold} className={`icon-btn !p-1 ${isBold ? 'is-active' : ''}`} title="Bold"><Bold className="w-3.5 h-3.5" /></button>
              <button onClick={toggleItalic} className={`icon-btn !p-1 ${isItalic ? 'is-active' : ''}`} title="Italic"><Italic className="w-3.5 h-3.5" /></button>
              <button onClick={toggleUnderline} className={`icon-btn !p-1 ${isUnderline ? 'is-active' : ''}`} title="Underline"><Underline className="w-3.5 h-3.5" /></button>
            </div>

            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="chrome-field text-[11px] px-2 py-1 cursor-pointer font-medium"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 chrome-group px-2 py-1">
              <Palette className="w-3.5 h-3.5 text-[var(--chrome-text-muted)]" />
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                    selectedColor === c.hex ? 'ring-2 ring-offset-1 ring-offset-[var(--chrome-surface)] ring-[var(--chrome-accent)]' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 chrome-group px-2 py-1">
              <ZoomIn className="w-3.5 h-3.5 text-[var(--chrome-text-muted)]" />
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                value={cellSize}
                onChange={(e) => setCellSize(parseInt(e.target.value, 10))}
                className="w-16 h-1 accent-[var(--chrome-accent)] cursor-pointer"
              />
              <span className="text-[10px] font-mono text-[var(--chrome-text-muted)] w-7">{cellSize}px</span>
            </div>

            <button
              onClick={() => setShowSymbolPicker(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg chrome-group hover:bg-[var(--chrome-accent-dim)] transition-all cursor-pointer font-medium text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)]"
              title="Bảng kí tự & dấu câu đặc biệt"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Kí tự</span>
              <kbd className="px-1 py-0.5 text-[9px] font-mono bg-black/30 rounded">Ctrl+.</kbd>
            </button>
          </div>
        )}

        {/* INSERT tab controls */}
        {ribbonTab === 'insert' && (
          <div className="flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar">
            <button
              onClick={() => setShowSymbolPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--chrome-accent-dim)] hover:bg-[var(--chrome-accent)] text-[var(--chrome-text)] hover:text-[#0B0F14] transition-all cursor-pointer font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kí tự đặc biệt</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/30 rounded">Ctrl+.</kbd>
            </button>

            <div className="chrome-divider" />

            <div className="flex items-center gap-2">
              <span className="eyebrow flex items-center gap-1"><Stamp className="w-3 h-3 text-[var(--chrome-accent-2)]" /> Seal</span>
              <div className="flex items-center gap-1">
                {sealStamps.map((seal) => (
                  <button
                    key={seal}
                    onClick={() => insertChar(seal)}
                    className="w-7 h-7 rounded-md bg-[var(--chrome-accent-2)] text-white font-['Noto_Serif_SC'] font-bold text-xs flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                    title={`Chèn con dấu [${seal}]`}
                  >
                    {seal}
                  </button>
                ))}
              </div>
            </div>

            <div className="chrome-divider" />

            <div className="flex items-center gap-2">
              <span className="eyebrow">Punctuation</span>
              <div className="flex items-center gap-1 flex-wrap">
                {daoSymbols.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => insertChar(sym)}
                    className="w-7 h-7 rounded-md chrome-group hover:bg-[var(--chrome-accent-dim)] text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)] font-['Noto_Serif_SC'] text-xs flex items-center justify-center cursor-pointer transition-all"
                    title={`Chèn "${sym}"`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT tab controls */}
        {ribbonTab === 'layout' && (
          <div className="flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              <span className="eyebrow">Orientation</span>
              <div className="chrome-group">
                <button onClick={() => setMode('vertical')} className={`chrome-seg ${mode === 'vertical' ? 'is-active' : ''}`}>Dọc</button>
                <button onClick={() => setMode('horizontal')} className={`chrome-seg ${mode === 'horizontal' ? 'is-active' : ''}`}>Ngang</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="eyebrow">Direction</span>
              <div className="chrome-group">
                <button onClick={() => setTextFlow('top-to-bottom-rtl')} className={`chrome-seg ${textFlow === 'top-to-bottom-rtl' ? 'is-active' : ''}`}>Cổ Phong</button>
                <button onClick={() => setTextFlow('left-to-right-ttb')} className={`chrome-seg ${textFlow === 'left-to-right-ttb' ? 'is-active' : ''}`}>Hiện Đại</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="eyebrow flex items-center gap-1"><Layers className="w-3 h-3 text-[var(--chrome-accent-2)]" /> Density</span>
              <div className="chrome-group">
                {GRID_DENSITIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setGridDensity(d.id);
                      setCellSize(d.size);
                    }}
                    className={`chrome-seg ${gridDensity === d.id ? 'is-active' : ''}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 md:ml-auto">
              <span className="eyebrow">Paper</span>
              <div className="chrome-group">
                <button onClick={() => setPaperTheme('classic')} className={`chrome-seg ${paperTheme === 'classic' ? 'is-active !bg-[var(--brass-400)]! !text-[#15120e]!' : ''}`}>Cổ phong</button>
                <button onClick={() => setPaperTheme('white')} className={`chrome-seg ${paperTheme === 'white' ? 'is-active bg-white! text-black!' : ''}`}>Trắng</button>
                <button onClick={() => setPaperTheme('dark')} className={`chrome-seg ${paperTheme === 'dark' ? 'is-active' : ''}`}>Tối</button>
              </div>
            </div>
          </div>
        )}

        {/* TOOLS tab controls */}
        {ribbonTab === 'tools' && (
          <div className="flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar">
            {[
              { tab: 'dict' as const, icon: BookOpen, label: 'Từ điển' },
              { tab: 'rules' as const, icon: Keyboard, label: 'Telex' },
              { tab: 'lookup' as const, icon: Search, label: 'Tra tự' },
              { tab: 'ocr' as const, icon: Camera, label: 'OCR' },
            ].map(({ tab, icon: Icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 chrome-group hover:bg-[var(--chrome-accent-dim)] text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)] rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        )}

        {/* VIEW tab controls */}
        {ribbonTab === 'view' && (
          <div className="flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar">
            <button
              onClick={() => setShowRuler(!showRuler)}
              className={`icon-btn !p-1.5 flex items-center gap-1.5 !rounded-lg ${showRuler ? 'is-active' : ''}`}
            >
              <Ruler className="w-3.5 h-3.5" /> <span className="font-medium">Thước</span>
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`icon-btn !p-1.5 flex items-center gap-1.5 !rounded-lg ${showGrid ? 'is-active' : ''}`}
            >
              <Grid className="w-3.5 h-3.5" /> <span className="font-medium">Lưới</span>
            </button>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleSidePanel}
          className={`icon-btn ${showSidePanel ? 'is-active' : ''}`}
          title={showSidePanel ? 'Ẩn bảng phụ' : 'Hiện bảng tra cứu & từ điển'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExportModal}
          className="px-3 py-1.5 bg-[var(--chrome-accent)] hover:opacity-90 text-[#0B0F14] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-[0.97] transition-all"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Xuất</span>
        </button>

        <button onClick={onOpenSettingsModal} className="icon-btn" title="Cài đặt">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
