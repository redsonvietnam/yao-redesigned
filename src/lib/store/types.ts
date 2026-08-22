import { CellData, LayoutMode, TextFlow, InputMode, Candidate, GridDensity, RibbonTab } from '../../types';

export interface DocumentState {
  docId: string;
  docTitle: string;
  cells: CellData[];
  cursor: number;
  selectedCellIndices: number[];
}

export interface IMEState {
  preedit: string;
  candidates: Candidate[];
  selectedCandIdx: number;
}

export interface ViewState {
  mode: LayoutMode;
  textFlow: TextFlow;
  inputMode: InputMode;
  showGrid: boolean;
  cellSize: number;
  gridDensity: GridDensity;
  customRows: number;
  customCols: number;
  showRuler: boolean;
  showSidePanel: boolean;
  ribbonTab: RibbonTab;
  zoomLevel: number;
  paperTheme: 'classic' | 'white' | 'dark';
  ribbonRow2Expanded: boolean;
}

export interface FormattingState {
  selectedColor: string;
  selectedFont: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}

export interface HistoryState {
  history: CellData[][];
  historyIdx: number;
}

export interface UIState {
  activeTab: 'rules' | 'dict' | 'lookup' | 'ocr' | 'settings';
  activeLookupChar: string | null;
  showSymbolPicker: boolean;
  saveError: string | null;
  persistenceError: string | null;
}
