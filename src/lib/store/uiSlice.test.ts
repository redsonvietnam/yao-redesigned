import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

describe('uiSlice', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeTab: 'dict',
      activeLookupChar: null,
      showSymbolPicker: false,
      saveError: null,
      persistenceError: null,
    });
  });

  describe('setActiveTab', () => {
    it('updates active tab', () => {
      useAppStore.getState().setActiveTab('rules');
      expect(useAppStore.getState().activeTab).toBe('rules');
    });

    it('sets to each valid tab', () => {
      for (const tab of ['rules', 'dict', 'lookup', 'ocr', 'settings'] as const) {
        useAppStore.getState().setActiveTab(tab);
        expect(useAppStore.getState().activeTab).toBe(tab);
      }
    });
  });

  describe('setLookupChar', () => {
    it('sets lookup char and switches to lookup tab', () => {
      useAppStore.getState().setLookupChar('盤');
      const state = useAppStore.getState();
      expect(state.activeLookupChar).toBe('盤');
      expect(state.activeTab).toBe('lookup');
    });

    it('sets null to clear lookup', () => {
      useAppStore.setState({ activeLookupChar: '盤', activeTab: 'lookup' });
      useAppStore.getState().setLookupChar(null);
      expect(useAppStore.getState().activeLookupChar).toBeNull();
    });
  });

  describe('setShowSymbolPicker', () => {
    it('sets symbol picker visibility', () => {
      useAppStore.getState().setShowSymbolPicker(true);
      expect(useAppStore.getState().showSymbolPicker).toBe(true);
    });
  });

  describe('toggleSymbolPicker', () => {
    it('toggles symbol picker', () => {
      useAppStore.getState().toggleSymbolPicker();
      expect(useAppStore.getState().showSymbolPicker).toBe(true);
      useAppStore.getState().toggleSymbolPicker();
      expect(useAppStore.getState().showSymbolPicker).toBe(false);
    });
  });

  describe('setSaveError', () => {
    it('sets save error', () => {
      useAppStore.getState().setSaveError('Lưu thất bại');
      expect(useAppStore.getState().saveError).toBe('Lưu thất bại');
    });

    it('clears save error', () => {
      useAppStore.setState({ saveError: 'error' });
      useAppStore.getState().setSaveError(null);
      expect(useAppStore.getState().saveError).toBeNull();
    });
  });

  describe('setPersistenceError', () => {
    it('sets persistence error', () => {
      useAppStore.getState().setPersistenceError('Không thể tải tài liệu');
      expect(useAppStore.getState().persistenceError).toBe('Không thể tải tài liệu');
    });

    it('clears persistence error', () => {
      useAppStore.setState({ persistenceError: 'error' });
      useAppStore.getState().setPersistenceError(null);
      expect(useAppStore.getState().persistenceError).toBeNull();
    });
  });
});
