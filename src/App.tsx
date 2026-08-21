import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { PaperArea } from './components/paper';
import { SidePanel } from './components/SidePanel';
import { StatusBar } from './components/StatusBar';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { SymbolPickerModal } from './components/SymbolPickerModal';
import { useAppStore } from './lib/store';
import { db } from './lib/db';
import { dictEngine, transform } from './lib/imeEngine';
import { INITIAL_DICT_RAW, bulkLoadDictionary } from './lib/dictionary';

export default function App() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load custom entries from Dexie into memory dictionary on mount
  useEffect(() => {
    const loadCustomDict = async () => {
      try {
        const customEntries = await db.customDict.toArray();
        const customMap = new Map<string, Array<{ hanzi: string; weight: number; meaning: string; raw: string; category?: string }>>();
        const seen = new Set<string>();
        for (const e of customEntries) {
          const key = transform(e.raw);
          const identity = `${e.raw}::${e.hanzi}::${e.meaning || ''}`;
          if (seen.has(identity)) continue;
          seen.add(identity);
          const existing = customMap.get(key) || [];
          existing.push({
            hanzi: e.hanzi,
            weight: e.weight || 90,
            meaning: e.meaning || 'Tùy chỉnh',
            raw: e.raw,
            category: e.category || 'Tùy chỉnh',
          });
          customMap.set(key, existing);
        }
        const loaded = bulkLoadDictionary(INITIAL_DICT_RAW);
        dictEngine.reload(loaded, Array.from(customMap.entries()));
      } catch (err) {
        console.error('Failed to load custom dictionary:', err);
      }
    };
    loadCustomDict();
  }, []);

  return (
    <div className="h-screen w-screen font-sans flex flex-col overflow-hidden select-none" style={{ background: 'var(--chrome-bg)', color: 'var(--chrome-text)' }}>
      {/* Unified top bar (header + toolbar merged) */}
      <HeaderBar
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden p-1.5 sm:p-2 gap-2 w-full max-w-[1920px] mx-auto">
        {/* Paper Canvas Grid Area with Word Ruler */}
        <PaperArea />

        {/* Side Task Pane for Dictionary, Telex rules, Lookup, OCR */}
        <SidePanel />
      </main>

      {/* 4. Microsoft Word Bottom Status Bar */}
      <StatusBar />

      {/* Modals */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SymbolPickerModal />
    </div>
  );
}
