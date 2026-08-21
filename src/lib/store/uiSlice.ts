import { StateCreator } from 'zustand';
import { UIState } from './types';

export interface UISlice extends UIState {
  setActiveTab: (tab: 'rules' | 'dict' | 'lookup' | 'ocr' | 'settings') => void;
  setLookupChar: (char: string | null) => void;
  setShowSymbolPicker: (show: boolean) => void;
  toggleSymbolPicker: () => void;
  setSaveError: (error: string | null) => void;
  setPersistenceError: (error: string | null) => void;
}

export const createUISlice: StateCreator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  [],
  [],
  UISlice
> = (set) => ({
  activeTab: 'dict',
  activeLookupChar: null,
  showSymbolPicker: false,
  saveError: null,
  persistenceError: null,

  setActiveTab: (activeTab) => set({ activeTab }),

  setLookupChar: (activeLookupChar) => {
    set({ activeLookupChar, activeTab: 'lookup' });
  },

  setShowSymbolPicker: (showSymbolPicker) => set({ showSymbolPicker }),
  toggleSymbolPicker: () => set((state) => ({ showSymbolPicker: !state.showSymbolPicker })),
  setSaveError: (saveError) => set({ saveError }),
  setPersistenceError: (persistenceError) => set({ persistenceError }),
});
