import { Candidate, TelexRule, MatchType } from '../types';
import { DictionaryRawData, INITIAL_DICT_RAW } from './dictionary';

export { INITIAL_DICT_RAW } from './dictionary';

export const TELEX_RULES: TelexRule[] = [
  { from: 'aw', to: 'ă' },
  { from: 'ow', to: 'ŏ' },
  { from: 'ew', to: 'ĕ' },
  { from: 'ee', to: 'ê' },
  { from: 'oo', to: 'ô' },
  { from: 'iy', to: 'ĭ' },
];

export function transform(raw: string): string {
  let out = '';
  let i = 0;
  while (i < raw.length) {
    let hit: TelexRule | null = null;
    for (const r of TELEX_RULES) {
      if (raw.startsWith(r.from, i)) {
        hit = r;
        break;
      }
    }
    if (hit) {
      out += hit.to;
      i += hit.from.length;
    } else {
      out += raw[i];
      i += 1;
    }
  }
  return out;
}

export function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// In-memory master dictionary map
export class DaoDictionaryEngine {
  private map: Map<string, Array<{ hanzi: string; weight: number; meaning: string; raw: string; category?: string }>> = new Map();

  constructor() {
    this.reload(INITIAL_DICT_RAW);
  }

  public reload(
    entries: DictionaryRawData,
    customEntries?: Array<[string, Array<{ hanzi: string; weight: number; meaning: string; raw: string; category?: string }>]>,
  ) {
    this.map.clear();
    for (const [raw, cands] of entries) {
      const key = transform(raw);
      this.map.set(key, cands.map((c) => ({ ...c, raw })));
    }
    if (customEntries) {
      for (const [key, cands] of customEntries) {
        const existing = this.map.get(key) || [];
        this.map.set(key, [...cands, ...existing]);
      }
    }
  }

  public addEntry(raw: string, hanzi: string, meaning: string, category: string = 'Tùy chỉnh', weight: number = 80) {
    const key = transform(raw);
    const existing = this.map.get(key) || [];
    existing.unshift({ hanzi, weight, meaning, raw, category });
    this.map.set(key, existing);
  }

  public matchAbbrev(query: string, key: string): boolean {
    const syllables = key.split(' ');
    if (syllables.length < 2) return false;
    if (query.length < 1 || query.length > syllables.length) return false;
    for (let i = 0; i < query.length; i++) {
      if (!syllables[i] || syllables[i][0].toLowerCase() !== query[i].toLowerCase()) return false;
    }
    return true;
  }

  public matchCandidates(query: string): Candidate[] {
    if (!query) return [];
    const q = query.toLowerCase();
    const exact: Candidate[] = [];
    const prefix: Candidate[] = [];
    const abbrev: Candidate[] = [];

    for (const [key, cands] of this.map) {
      const k = key.toLowerCase();
      if (k === q) {
        exact.push(...cands.map((c) => ({ ...c, key, matchType: 'exact' as MatchType })));
      } else if (k.startsWith(q)) {
        prefix.push(...cands.map((c) => ({ ...c, key, matchType: 'prefix' as MatchType })));
      } else if (this.matchAbbrev(q, k)) {
        abbrev.push(...cands.map((c) => ({ ...c, key, matchType: 'abbrev' as MatchType })));
      }
    }

    let results = [...exact, ...prefix, ...abbrev];

    if (results.length === 0) {
      const normQ = stripDiacritics(q);
      if (normQ.length >= 2) {
        const meaning: Candidate[] = [];
        for (const [key, cands] of this.map) {
          for (const c of cands) {
            if (c.meaning && stripDiacritics(c.meaning.toLowerCase()).includes(normQ)) {
              meaning.push({ ...c, key, matchType: 'meaning' as MatchType });
            }
          }
        }
        results = meaning;
      }
    }

    return results.sort((a, b) => b.weight - a.weight).slice(0, 50);
  }

  // Reverse lookup: Given a Hanzi character, find all matching dictionary entries
  public reverseLookup(hanzi: string): Array<{ raw: string; key: string; meaning: string; category?: string }> {
    const matches: Array<{ raw: string; key: string; meaning: string; category?: string }> = [];
    for (const [key, cands] of this.map) {
      for (const c of cands) {
        if (c.hanzi === hanzi) {
          matches.push({ raw: c.raw, key, meaning: c.meaning, category: c.category });
        }
      }
    }
    return matches;
  }

  public getAllEntries(): Array<{ raw: string; key: string; hanzi: string; weight: number; meaning: string; category?: string }> {
    const list: Array<{ raw: string; key: string; hanzi: string; weight: number; meaning: string; category?: string }> = [];
    for (const [key, cands] of this.map) {
      for (const c of cands) {
        list.push({ raw: c.raw, key, hanzi: c.hanzi, weight: c.weight, meaning: c.meaning, category: c.category });
      }
    }
    return list;
  }
}

export const dictEngine = new DaoDictionaryEngine();
