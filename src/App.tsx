import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { Toolbar } from './components/Toolbar';
import { PaperArea } from './components/paper';
import { SidePanel } from './components/SidePanel';
import { StatusBar } from './components/StatusBar';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { SymbolPickerModal } from './components/SymbolPickerModal';
import { useAppStore } from './lib/store';
import { db } from './lib/db';
import { dictEngine, INITIAL_DICT_RAW, transform } from './lib/imeEngine';

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
        dictEngine.reload(INITIAL_DICT_RAW, Array.from(customMap.entries()));
      } catch (err) {
        console.error('Failed to load custom dictionary:', err);
      }
    };
    loadCustomDict();
  }, []);

  return (
    <div className="h-screen w-screen bg-[#15120e] text-[#cdb996] font-sans flex flex-col overflow-hidden select-none">
      {/* 1. Microsoft Word Top Header Bar */}
      <HeaderBar
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* 2. Microsoft Word Ribbon Sub-Toolbar */}
      <Toolbar />

      {/* 3. Main Workspace Stage - Maximized Height */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden p-2 sm:p-3 gap-3 w-full max-w-[1920px] mx-auto">
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
