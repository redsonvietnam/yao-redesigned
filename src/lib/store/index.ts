import { create } from 'zustand';
import { CellData } from '../../types';
import { DocumentSlice, createDocumentSlice } from './documentSlice';
import { IMESlice, createIMESlice } from './imeSlice';
import { ViewSlice, createViewSlice } from './viewSlice';
import { FormattingSlice, createFormattingSlice } from './formattingSlice';
import { HistorySlice, createHistorySlice } from './historySlice';
import { PersistenceSlice, createPersistenceSlice } from './persistenceSlice';
import { UISlice, createUISlice } from './uiSlice';

export type AppState = DocumentSlice & IMESlice & ViewSlice & FormattingSlice & HistorySlice & PersistenceSlice & UISlice;

const INITIAL_SAMPLE_CELLS: CellData[] = [
  { id: '1', char: '盤' },
  { id: '2', char: '王' },
  { id: '3', char: '天' },
  { id: '4', char: '地' },
  { id: '5', char: '山' },
  { id: '6', char: '水' },
  { id: '7', char: '人' },
  { id: '8', char: '好' },
  { id: '9', char: '家' },
  { id: '10', char: '母' },
  { id: '11', char: '父' },
  { id: '12', char: '子' },
];

export const useAppStore = create<AppState>()((...a) => ({
  ...createDocumentSlice(...a),
  ...createIMESlice(...a),
  ...createViewSlice(...a),
  ...createFormattingSlice(...a),
  ...createHistorySlice(...a),
  ...createPersistenceSlice(...a),
  ...createUISlice(...a),
  // Override initial document/history state with sample data
  cells: INITIAL_SAMPLE_CELLS,
  cursor: INITIAL_SAMPLE_CELLS.length,
  history: [INITIAL_SAMPLE_CELLS],
  historyIdx: 0,
}));
