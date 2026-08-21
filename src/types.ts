export interface CellData {
  id: string;
  char: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  font?: string;
}

export type LayoutMode = 'vertical' | 'horizontal';
export type TextFlow = 'top-to-bottom-rtl' | 'left-to-right-ttb';
export type InputMode = 'han' | 'latin';
export type GridDensity = 'standard' | 'dense' | 'high' | 'ultra';
export type RibbonTab = 'home' | 'insert' | 'layout' | 'tools' | 'view';
export type MatchType = 'exact' | 'prefix' | 'abbrev' | 'meaning';

export interface Candidate {
  hanzi: string;
  weight: number;
  meaning: string;
  raw?: string;
  key?: string;
  matchType?: MatchType;
  category?: string;
}

export interface TelexRule {
  from: string;
  to: string;
}

export interface DictionaryEntry {
  id?: number;
  raw: string;
  key: string;
  hanzi: string;
  weight: number;
  meaning: string;
  category?: string;
  isCustom?: boolean;
}

export interface SavedDocument {
  id: string;
  title: string;
  cells: CellData[];
  mode: LayoutMode;
  showGrid: boolean;
  cellSize: number;
  updatedAt: number;
}
