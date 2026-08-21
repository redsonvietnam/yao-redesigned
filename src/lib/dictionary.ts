import { DictionaryEntry, Candidate } from '../types';
import { transform } from './imeEngine';

// Canonical dictionary raw data format
export type DictionaryRawData = Array<[string, Array<{ hanzi: string; weight: number; meaning: string; category?: string }>]>;

// Initial dictionary data — 37 hardcoded entries
export const INITIAL_DICT_RAW: DictionaryRawData = [
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

// Canonical identity rule: raw::hanzi::meaning
// Entries with same raw+hanzi+meaning are duplicates
function canonicalIdentity(raw: string, hanzi: string, meaning: string): string {
  return `${raw}::${hanzi}::${meaning || ''}`;
}

// Validate a single dictionary entry
export function validateDictionaryEntry(entry: unknown): entry is { raw: string; hanzi: string; weight: number; meaning: string; category?: string } {
  if (typeof entry !== 'object' || entry === null) return false;
  const obj = entry as Record<string, unknown>;
  if (typeof obj.raw !== 'string' || obj.raw.trim() === '') return false;
  if (typeof obj.hanzi !== 'string' || obj.hanzi.trim() === '') return false;
  if (typeof obj.meaning !== 'string') return false;
  if (obj.weight !== undefined && typeof obj.weight !== 'number') return false;
  if (obj.category !== undefined && typeof obj.category !== 'string') return false;
  return true;
}

// Validate a full import payload
export function validateImportPayload(data: unknown): data is DictionaryRawData {
  if (!Array.isArray(data)) return false;
  for (const item of data) {
    if (!Array.isArray(item) || item.length !== 2) return false;
    const [raw, cands] = item;
    if (typeof raw !== 'string' || raw.trim() === '') return false;
    if (!Array.isArray(cands)) return false;
    for (const c of cands) {
      if (!validateDictionaryEntry(c)) return false;
    }
  }
  return true;
}

// Deduplicate entries using canonical identity rule
// Preserves entries with different meanings (semantically distinct)
export function deduplicateEntries(entries: DictionaryRawData): DictionaryRawData {
  const seen = new Set<string>();
  const result: DictionaryRawData = [];

  for (const [raw, cands] of entries) {
    const uniqueCands: Array<{ hanzi: string; weight: number; meaning: string; category?: string }> = [];
    for (const c of cands) {
      const identity = canonicalIdentity(raw, c.hanzi, c.meaning);
      if (!seen.has(identity)) {
        seen.add(identity);
        uniqueCands.push(c);
      }
    }
    if (uniqueCands.length > 0) {
      result.push([raw, uniqueCands]);
    }
  }

  return result;
}

// Bulk load dictionary with custom entry preservation
// Returns deduplicated, deterministically ordered entries
export function bulkLoadDictionary(
  baseEntries: DictionaryRawData,
  customEntries?: Array<[string, Array<{ hanzi: string; weight: number; meaning: string; raw: string; category?: string }> ]>
): DictionaryRawData {
  // Start with base entries
  let loaded = [...baseEntries];

  // Merge custom entries
  if (customEntries && customEntries.length > 0) {
    const customMap = new Map<string, Array<{ hanzi: string; weight: number; meaning: string; raw: string; category?: string }>>();

    for (const [key, cands] of customEntries) {
      const existing = customMap.get(key) || [];
      customMap.set(key, [...cands, ...existing]);
    }

    // Append custom entries to loaded
    for (const [key, cands] of customMap) {
      const existingIdx = loaded.findIndex(([raw]) => transform(raw) === key);
      if (existingIdx >= 0) {
        // Prepend custom entries (higher priority)
        const existing = loaded[existingIdx];
        loaded[existingIdx] = [existing[0], [...cands, ...existing[1]]];
      } else {
        // New key from custom entries
        loaded.push([cands[0].raw, cands.map(c => ({ hanzi: c.hanzi, weight: c.weight, meaning: c.meaning, category: c.category }))]);
      }
    }
  }

  // Deduplicate across entire dataset
  return deduplicateEntries(loaded);
}

// Export dictionary as JSON
export function exportDictionary(entries: DictionaryRawData): string {
  return JSON.stringify(entries, null, 2);
}

// Import dictionary from JSON string
// Returns null if invalid, otherwise returns validated entries
export function importDictionary(jsonString: string): DictionaryRawData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!validateImportPayload(parsed)) return null;
    return deduplicateEntries(parsed);
  } catch {
    return null;
  }
}
