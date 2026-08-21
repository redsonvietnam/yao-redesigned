import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
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
  Sparkles,
  Layout,
  Eye,
  Type,
  Trash2,
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
    { id: 'home', label: 'Trang chủ', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'insert', label: 'Chèn', icon: <Plus className="w-3.5 h-3.5" /> },
    { id: 'layout', label: 'Trình bày', icon: <Layout className="w-3.5 h-3.5" /> },
    { id: 'tools', label: 'Tra cứu & AI', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'view', label: 'Hiển thị', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="no-print w-full bg-[#181410] px-3 md:px-4 h-12 flex items-center gap-3 shadow-[0_1px_0_rgba(255,255,255,0.06)] sticky top-0 z-40 shrink-0">
      {/* Seal + Title + Document switcher */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c24235] to-[#78221a] flex items-center justify-center shrink-0">
          <span className="font-['Noto_Serif_SC'] text-white font-bold text-sm leading-none">稿</span>
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
            className="text-[13px] font-semibold text-[#f2e7d0] hover:text-white truncate max-w-[140px] md:max-w-[200px] cursor-pointer"
            title="Đổi tên bản thảo"
          >
            {docTitle}
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
            <div className="absolute left-0 mt-2 w-72 chrome-panel bg-[#211c17] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between px-1.5 py-1 mb-1">
                <span className="eyebrow flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-[#b23a2e]" /> Bản thảo đã lưu
                </span>
                <button
                  onClick={() => {
                    newDocument();
                    setShowDocMenu(false);
                  }}
                  className="text-[10px] bg-[#b23a2e] text-white px-2 py-1 rounded-md hover:bg-[#8f2e24] flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Mới
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {savedDocs && savedDocs.length > 0 ? (
                  savedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`chrome-row w-full flex items-center ${
                        doc.id === docId ? 'bg-[#b23a2e]/15 text-[#f2e7d0]' : 'text-[#cdb996]'
                      }`}
                    >
                      <button
                        onClick={() => {
                          loadDocument(doc.id, doc.title, doc.cells);
                          setShowDocMenu(false);
                        }}
                        className="flex-1 text-left truncate text-xs"
                      >
                        <span className="truncate">{doc.title}</span>
                      </button>
                      <span className="text-[10px] text-[#8f8266] font-mono shrink-0 mr-1">{doc.cells?.length || 0} ô</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                        }}
                        className="p-1 hover:bg-[#b23a2e]/30 rounded transition-colors cursor-pointer"
                        title="Xoá bản thảo"
                      >
                        <Trash2 className="w-3 h-3 text-[#8f8266] hover:text-[#b23a2e]" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-[#8f8266] py-4 text-center">Chưa có bản thảo</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chrome-divider" />

      {/* Undo / redo / save */}
      <div className="flex items-center gap-0.5">
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

      {/* Ribbon tabs — centered */}
      <div className="flex-1 flex justify-center min-w-0">
        <div className="chrome-group overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRibbonTab(tab.id)}
              className={`chrome-seg flex items-center gap-1.5 ${ribbonTab === tab.id ? 'is-active' : ''}`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={toggleSidePanel}
          className={`icon-btn ${showSidePanel ? 'is-active' : ''}`}
          title={showSidePanel ? 'Ẩn bảng phụ' : 'Hiện bảng tra cứu & từ điển'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExportModal}
          className="px-3 py-1.5 bg-[#b23a2e] hover:bg-[#8f2e24] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-[0.97] transition-all"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Xuất / In</span>
        </button>

        <button onClick={onOpenSettingsModal} className="icon-btn" title="Cài đặt">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
