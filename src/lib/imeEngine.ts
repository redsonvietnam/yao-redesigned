import { Candidate, TelexRule, DictionaryEntry, MatchType } from '../types';

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

// Full Initial Dao Dictionary Database
export const INITIAL_DICT_RAW: Array<[string, Array<{ hanzi: string; weight: number; meaning: string; category?: string }>]> = [
  ['maw', [{ hanzi: '母', weight: 100, meaning: 'mẹ, bà', category: 'Gia đình' }, { hanzi: '姥', weight: 60, meaning: 'bà ngoại', category: 'Gia đình' }]],
  ['faw', [{ hanzi: '父', weight: 100, meaning: 'cha, bố', category: 'Gia đình' }, { hanzi: '爺', weight: 70, meaning: 'ông nội', category: 'Gia đình' }]],
  ['kaw', [{ hanzi: '家', weight: 95, meaning: 'nhà, gia đình', category: 'Gia đình' }, { hanzi: '加', weight: 50, meaning: 'thêm vào', category: 'Chung' }]],
  ['shoo', [{ hanzi: '山', weight: 100, meaning: 'núi, càn', category: 'Tự nhiên' }, { hanzi: '生', weight: 70, meaning: 'sinh ra, sống', category: 'Cuộc sống' }]],
  ['shee', [{ hanzi: '水', weight: 95, meaning: 'nước, sông', category: 'Tự nhiên' }, { hanzi: '世', weight: 60, meaning: 'thế giới, đời', category: 'Chung' }]],
  ['hoo', [{ hanzi: '火', weight: 90, meaning: 'lửa, nhiệt', category: 'Ngũ hành' }]],
  ['boo', [{ hanzi: '木', weight: 90, meaning: 'cây, gỗ', category: 'Ngũ hành' }, { hanzi: '本', weight: 65, meaning: 'gốc, vốn', category: 'Chung' }]],
  ['tiy', [{ hanzi: '田', weight: 85, meaning: 'ruộng, nương', category: 'Nông nghiệp' }, { hanzi: '天', weight: 80, meaning: 'trời', category: 'Tự nhiên' }]],
  ['kew', [{ hanzi: '心', weight: 85, meaning: 'tim, lòng, tâm', category: 'Con người' }]],
  ['low', [{ hanzi: '天', weight: 95, meaning: 'trời, ngày', category: 'Tự nhiên' }, { hanzi: '老', weight: 80, meaning: 'già, lâu', category: 'Con người' }]],
  ['dow', [{ hanzi: '地', weight: 90, meaning: 'đất, đai', category: 'Tự nhiên' }, { hanzi: '道', weight: 85, meaning: 'đạo, đường', category: 'Thần thoại' }]],
  ['nhan', [{ hanzi: '人', weight: 100, meaning: 'người', category: 'Con người' }, { hanzi: '仁', weight: 40, meaning: 'nhân nghĩa', category: 'Triết lý' }]],
  ['haw', [{ hanzi: '好', weight: 90, meaning: 'tốt, đẹp, hay', category: 'Đặc tính' }]],
  ['daw', [{ hanzi: '大', weight: 90, meaning: 'to, lớn', category: 'Đặc tính' }]],
  ['nyaw', [{ hanzi: '女', weight: 90, meaning: 'phụ nữ, con gái', category: 'Con người' }]],
  ['tsaw', [{ hanzi: '子', weight: 85, meaning: 'con, trẻ em', category: 'Gia đình' }]],
  ['moo', [{ hanzi: '目', weight: 70, meaning: 'mắt', category: 'Cơ thể' }, { hanzi: '木', weight: 60, meaning: 'gỗ', category: 'Tự nhiên' }]],
  ['koo', [{ hanzi: '口', weight: 70, meaning: 'miệng, lối vào', category: 'Cơ thể' }]],
  ['shew', [{ hanzi: '手', weight: 70, meaning: 'tay', category: 'Cơ thể' }, { hanzi: '首', weight: 60, meaning: 'đầu, đứng đầu', category: 'Chung' }]],
  ['chiy', [{ hanzi: '小', weight: 85, meaning: 'nhỏ, bé', category: 'Đặc tính' }]],
  ['yut', [{ hanzi: '月', weight: 95, meaning: 'mặt trăng, tháng', category: 'Tự nhiên' }]],
  ['nyiet', [{ hanzi: '日', weight: 95, meaning: 'mặt trời, ngày', category: 'Tự nhiên' }]],
  ['pwo', [{ hanzi: '風', weight: 90, meaning: 'gió', category: 'Tự nhiên' }]],
  ['yoon', [{ hanzi: '雲', weight: 90, meaning: 'mây', category: 'Tự nhiên' }]],
  ['low dow', [{ hanzi: '天地', weight: 100, meaning: 'trời đất, vũ trụ', category: 'Từ ghép' }]],
  ['maw faw', [{ hanzi: '父母', weight: 100, meaning: 'cha mẹ, phụ mẫu', category: 'Gia đình' }]],
  ['shoo shee', [{ hanzi: '山水', weight: 95, meaning: 'phong cảnh núi sông', category: 'Tự nhiên' }]],
  ['daw kaw', [{ hanzi: '大家', weight: 90, meaning: 'mọi người, đại gia', category: 'Từ ghép' }]],
  ['ban voo', [{ hanzi: '盤古', weight: 100, meaning: 'Bàn Cổ (Thủy tổ truyền thuyết)', category: 'Thần thoại' }]],
  ['ban hoong', [{ hanzi: '盤王', weight: 100, meaning: 'Bàn Vương (Vua tổ của người Dao)', category: 'Thần thoại' }]],
  ['tzao', [{ hanzi: '早', weight: 80, meaning: 'sớm, buổi sáng', category: 'Thời gian' }]],
  ['maan', [{ hanzi: '晚', weight: 80, meaning: 'muộn, buổi tối', category: 'Thời gian' }]],
  ['yut nyiet', [{ hanzi: '年月', weight: 90, meaning: 'năm tháng, thời gian', category: 'Thời gian' }]],
  ['it', [{ hanzi: '一', weight: 100, meaning: 'số 1, một', category: 'Số đếm' }]],
  ['nyie', [{ hanzi: '二', weight: 100, meaning: 'số 2, hai', category: 'Số đếm' }]],
  ['sam', [{ hanzi: '三', weight: 100, meaning: 'số 3, ba', category: 'Số đếm' }]],
  ['see', [{ hanzi: '四', weight: 100, meaning: 'số 4, bốn', category: 'Số đếm' }]],
  ['ngwu', [{ hanzi: '五', weight: 100, meaning: 'số 5, năm', category: 'Số đếm' }]],
  ['look', [{ hanzi: '六', weight: 100, meaning: 'số 6, sáu', category: 'Số đếm' }]],
  ['tsiet', [{ hanzi: '七', weight: 100, meaning: 'số 7, bảy', category: 'Số đếm' }]],
  ['baat', [{ hanzi: '八', weight: 100, meaning: 'số 8, tám', category: 'Số đếm' }]],
  ['kiow', [{ hanzi: '九', weight: 100, meaning: 'số 9, chín', category: 'Số đếm' }]],
  ['ship', [{ hanzi: '十', weight: 100, meaning: 'số 10, mười', category: 'Số đếm' }]],
];

// In-memory master dictionary map
export class DaoDictionaryEngine {
  private map: Map<string, Array<{ hanzi: string; weight: number; meaning: string; raw: string; category?: string }>> = new Map();

  constructor() {
    this.reload(INITIAL_DICT_RAW);
  }

  public reload(entries: Array<[string, Array<{ hanzi: string; weight: number; meaning: string; category?: string }>]>) {
    this.map.clear();
    for (const [raw, cands] of entries) {
      const key = transform(raw);
      this.map.set(key, cands.map((c) => ({ ...c, raw })));
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
