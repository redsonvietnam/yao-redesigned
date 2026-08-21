import { describe, it, expect, beforeEach } from 'vitest';
import { dictEngine, transform, stripDiacritics, TELEX_RULES } from './imeEngine';
import {
  validateCandidate,
  validatePersistedEntry,
  validateImportPayload,
  deduplicateEntries,
  bulkLoadDictionary,
  exportDictionary,
  importDictionary,
  DictionaryRawData,
} from './dictionary';

describe('transform (Telex rules)', () => {
  it('converts "aw" to "ă"', () => {
    expect(transform('aw')).toBe('ă');
  });

  it('converts "ow" to "ŏ"', () => {
    expect(transform('ow')).toBe('ŏ');
  });

  it('converts "ew" to "ĕ"', () => {
    expect(transform('ew')).toBe('ĕ');
  });

  it('converts "ee" to "ê"', () => {
    expect(transform('ee')).toBe('ê');
  });

  it('converts "oo" to "ô"', () => {
    expect(transform('oo')).toBe('ô');
  });

  it('converts "iy" to "ĭ"', () => {
    expect(transform('iy')).toBe('ĭ');
  });

  it('leaves unmatched characters as-is', () => {
    expect(transform('maw')).toBe('mă');
  });

  it('handles multiple rule applications', () => {
    expect(transform('maw')).toBe('mă');
    expect(transform('shoo')).toBe('shô');
  });

  it('handles empty string', () => {
    expect(transform('')).toBe('');
  });

  it('handles single character with no match', () => {
    expect(transform('a')).toBe('a');
  });
});

describe('stripDiacritics', () => {
  it('removes Vietnamese diacritics', () => {
    expect(stripDiacritics('ă')).toBe('a');
    expect(stripDiacritics('ê')).toBe('e');
    expect(stripDiacritics('ô')).toBe('o');
  });

  it('handles multi-character strings', () => {
    expect(stripDiacritics('mẹ')).toBe('me');
  });

  it('handles empty string', () => {
    expect(stripDiacritics('')).toBe('');
  });
});

describe('DaoDictionaryEngine', () => {
  beforeEach(() => {
    dictEngine.reload([
      ['maw', [{ hanzi: '母', weight: 100, meaning: 'mẹ, bà' }]],
      ['faw', [{ hanzi: '父', weight: 100, meaning: 'cha, bố' }]],
      ['low dow', [{ hanzi: '天地', weight: 100, meaning: 'trời đất' }]],
    ]);
  });

  describe('exact matching', () => {
    it('returns candidates for exact match', () => {
      const results = dictEngine.matchCandidates('mă');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].hanzi).toBe('母');
      expect(results[0].matchType).toBe('exact');
    });

    it('returns empty for no match', () => {
      const results = dictEngine.matchCandidates('xyz');
      expect(results).toHaveLength(0);
    });
  });

  describe('prefix matching', () => {
    it('returns candidates for prefix match', () => {
      const results = dictEngine.matchCandidates('m');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.hanzi === '母')).toBe(true);
      expect(results[0].matchType).toBe('prefix');
    });
  });

  describe('abbreviation matching', () => {
    it('matches abbreviation for multi-syllable key', () => {
      const results = dictEngine.matchCandidates('ld');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].hanzi).toBe('天地');
      expect(results[0].matchType).toBe('abbrev');
    });
  });

  describe('meaning matching', () => {
    it('matches when no other match type works', () => {
      const results = dictEngine.matchCandidates('cha');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchType).toBe('meaning');
    });

    it('requires at least 2 characters for meaning match', () => {
      const results = dictEngine.matchCandidates('a');
      expect(results).toHaveLength(0);
    });
  });

  describe('candidate ranking', () => {
    it('sorts by weight descending', () => {
      dictEngine.reload([
        ['maw', [
          { hanzi: '低', weight: 30, meaning: 'low weight' },
          { hanzi: '高', weight: 100, meaning: 'high weight' },
          { hanzi: '中', weight: 60, meaning: 'mid weight' },
        ]],
      ]);
      const results = dictEngine.matchCandidates('mă');
      expect(results).toHaveLength(3);
      expect(results[0].hanzi).toBe('高');
      expect(results[1].hanzi).toBe('中');
      expect(results[2].hanzi).toBe('低');
    });
  });

  describe('reverseLookup', () => {
    it('finds entries by hanzi character', () => {
      const results = dictEngine.reverseLookup('母');
      expect(results).toHaveLength(1);
      expect(results[0].raw).toBe('maw');
      expect(results[0].meaning).toBe('mẹ, bà');
    });

    it('returns empty for non-existent hanzi', () => {
      const results = dictEngine.reverseLookup('龘');
      expect(results).toHaveLength(0);
    });
  });

  describe('matchCandidates returns max 50 results', () => {
    it('caps results at 50', () => {
      const entries: DictionaryRawData = [];
      for (let i = 0; i < 100; i++) {
        entries.push([`test${i}`, [{ hanzi: `字${i}`, weight: i, meaning: `word${i}` }]]);
      }
      dictEngine.reload(entries);
      const results = dictEngine.matchCandidates('t');
      expect(results.length).toBeLessThanOrEqual(50);
    });
  });
});

describe('dictionary.ts validators', () => {
  describe('validateCandidate', () => {
    it('accepts valid candidate', () => {
      expect(validateCandidate({ hanzi: '母', weight: 100, meaning: 'mẹ' })).toBe(true);
    });

    it('accepts candidate with category', () => {
      expect(validateCandidate({ hanzi: '母', weight: 100, meaning: 'mẹ', category: 'Gia đình' })).toBe(true);
    });

    it('rejects null', () => {
      expect(validateCandidate(null)).toBe(false);
    });

    it('rejects missing hanzi', () => {
      expect(validateCandidate({ weight: 100, meaning: 'test' })).toBe(false);
    });

    it('rejects empty hanzi', () => {
      expect(validateCandidate({ hanzi: '', weight: 100, meaning: 'test' })).toBe(false);
    });

    it('rejects non-number weight', () => {
      expect(validateCandidate({ hanzi: '母', weight: '100', meaning: 'test' })).toBe(false);
    });

    it('rejects NaN weight', () => {
      expect(validateCandidate({ hanzi: '母', weight: NaN, meaning: 'test' })).toBe(false);
    });

    it('rejects Infinity weight', () => {
      expect(validateCandidate({ hanzi: '母', weight: Infinity, meaning: 'test' })).toBe(false);
    });
  });

  describe('validatePersistedEntry', () => {
    it('accepts valid persisted entry', () => {
      expect(validatePersistedEntry({
        raw: 'maw', key: 'mă', hanzi: '母', weight: 100, meaning: 'mẹ',
      })).toBe(true);
    });

    it('rejects missing raw', () => {
      expect(validatePersistedEntry({ key: 'mă', hanzi: '母', weight: 100, meaning: 'mẹ' })).toBe(false);
    });

    it('rejects empty raw', () => {
      expect(validatePersistedEntry({ raw: '', key: 'mă', hanzi: '母', weight: 100, meaning: 'mẹ' })).toBe(false);
    });
  });

  describe('validateImportPayload', () => {
    it('accepts valid payload', () => {
      const payload: DictionaryRawData = [
        ['maw', [{ hanzi: '母', weight: 100, meaning: 'mẹ' }]],
      ];
      expect(validateImportPayload(payload)).toBe(true);
    });

    it('rejects non-array', () => {
      expect(validateImportPayload('not an array')).toBe(false);
    });

    it('rejects non-string raw', () => {
      expect(validateImportPayload([[123, [{ hanzi: '母', weight: 100, meaning: 'mẹ' }]]])).toBe(false);
    });

    it('rejects invalid candidates', () => {
      expect(validateImportPayload([['maw', [{ hanzi: '', weight: 100, meaning: 'mẹ' }]]])).toBe(false);
    });
  });

  describe('deduplicateEntries', () => {
    it('removes exact duplicates', () => {
      const input: DictionaryRawData = [
        ['maw', [
          { hanzi: '母', weight: 100, meaning: 'mẹ' },
          { hanzi: '母', weight: 100, meaning: 'mẹ' },
        ]],
      ];
      const result = deduplicateEntries(input);
      expect(result[0][1]).toHaveLength(1);
    });

    it('preserves entries with different meanings', () => {
      const input: DictionaryRawData = [
        ['maw', [
          { hanzi: '母', weight: 100, meaning: 'mẹ' },
          { hanzi: '母', weight: 60, meaning: 'bà ngoại' },
        ]],
      ];
      const result = deduplicateEntries(input);
      expect(result[0][1]).toHaveLength(2);
    });

    it('preserves entries with different hanzi', () => {
      const input: DictionaryRawData = [
        ['maw', [
          { hanzi: '母', weight: 100, meaning: 'mẹ' },
          { hanzi: '姥', weight: 60, meaning: 'bà ngoại' },
        ]],
      ];
      const result = deduplicateEntries(input);
      expect(result[0][1]).toHaveLength(2);
    });
  });

  describe('bulkLoadDictionary', () => {
    it('deduplicates entries', () => {
      const input: DictionaryRawData = [
        ['maw', [
          { hanzi: '母', weight: 100, meaning: 'mẹ' },
          { hanzi: '母', weight: 100, meaning: 'mẹ' },
        ]],
      ];
      const result = bulkLoadDictionary(input);
      expect(result[0][1]).toHaveLength(1);
    });
  });

  describe('export → import round trip', () => {
    it('preserves data through export/import', () => {
      const input: DictionaryRawData = [
        ['maw', [{ hanzi: '母', weight: 100, meaning: 'mẹ', category: 'Gia đình' }]],
        ['faw', [{ hanzi: '父', weight: 100, meaning: 'cha', category: 'Gia đình' }]],
      ];
      const json = exportDictionary(input);
      const imported = importDictionary(json);
      expect(imported).toEqual(input);
    });

    it('deduplicates on import', () => {
      const input: DictionaryRawData = [
        ['maw', [
          { hanzi: '母', weight: 100, meaning: 'mẹ' },
          { hanzi: '母', weight: 100, meaning: 'mẹ' },
        ]],
      ];
      const json = exportDictionary(input);
      const imported = importDictionary(json);
      expect(imported![0][1]).toHaveLength(1);
    });
  });

  describe('malformed import payloads', () => {
    it('returns null for invalid JSON', () => {
      expect(importDictionary('not json')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(importDictionary('')).toBeNull();
    });

    it('returns null for array of wrong shape', () => {
      expect(importDictionary('[[1,2,3]]')).toBeNull();
    });

    it('returns null for missing required fields', () => {
      expect(importDictionary('[["raw"]]')).toBeNull();
    });
  });
});
