import React, { useState, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { dictEngine, TELEX_RULES, transform, stripDiacritics } from '../lib/imeEngine';
import { db } from '../lib/db';
import { performOcr } from '../lib/ocrService';
import {
  BookOpen,
  Keyboard,
  Search,
  Plus,
  Sparkles,
  Camera,
  Zap,
  Bookmark,
} from 'lucide-react';

export const SidePanel: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeLookupChar,
    setLookupChar,
    insertChar,
    showSidePanel,
  } = useAppStore();

  const [dictQuery, setDictQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRaw, setNewRaw] = useState('');
  const [newHanzi, setNewHanzi] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newCategory, setNewCategory] = useState('Gia đình');

  const [testInput, setTestInput] = useState('shoo shee maw faw');

  const [ocrText, setOcrText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!showSidePanel) return null;

  const categories = ['Tất cả', 'Gia đình', 'Tự nhiên', 'Ngũ hành', 'Thần thoại', 'Số đếm', 'Cơ thể', 'Thời gian'];

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaw.trim() || !newHanzi.trim()) return;

    dictEngine.addEntry(newRaw.trim(), newHanzi.trim(), newMeaning.trim() || 'Tùy chỉnh', newCategory);
    await db.customDict.add({
      raw: newRaw.trim(),
      key: transform(newRaw.trim()),
      hanzi: newHanzi.trim(),
      meaning: newMeaning.trim() || 'Tùy chỉnh',
      category: newCategory,
      weight: 90,
      isCustom: true,
    });

    setNewRaw('');
    setNewHanzi('');
    setNewMeaning('');
    setShowAddModal(false);
  };

  const allDictEntries = dictEngine.getAllEntries();
  const filteredDictEntries = allDictEntries.filter((entry) => {
    const matchesCategory = selectedCategory === 'Tất cả' || entry.category === selectedCategory;
    const normQ = stripDiacritics(dictQuery.toLowerCase());
    const matchesQuery =
      !normQ ||
      stripDiacritics(entry.key.toLowerCase()).includes(normQ) ||
      stripDiacritics(entry.raw.toLowerCase()).includes(normQ) ||
      stripDiacritics(entry.hanzi).includes(normQ) ||
      stripDiacritics((entry.meaning || '').toLowerCase()).includes(normQ);
    return matchesCategory && matchesQuery;
  });

  const lookupResults = activeLookupChar ? dictEngine.reverseLookup(activeLookupChar) : [];

  const handleSimulateOCR = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setOcrError(null);
    try {
      const result = await performOcr(selectedFile);
      setOcrText(result.text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setOcrError(message);
      setOcrText('');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setOcrError(null);
    setOcrText('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInsertOCRText = () => {
    ocrText.split('').forEach((ch) => {
      if (ch.trim()) insertChar(ch);
    });
  };

  const tabs = [
    { id: 'dict' as const, icon: BookOpen, label: 'Từ điển' },
    { id: 'rules' as const, icon: Keyboard, label: 'Telex' },
    { id: 'lookup' as const, icon: Search, label: 'Tra chữ' },
    { id: 'ocr' as const, icon: Sparkles, label: 'OCR' },
  ];

  return (
    <aside className="no-print w-full lg:w-80 flex flex-col shrink-0 h-full overflow-hidden" style={{ background: 'var(--chrome-surface)', borderLeft: '1px solid var(--chrome-border)' }}>
      {/* Tabs */}
      <div className="flex p-1.5 gap-1 shrink-0">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === id ? 'bg-[var(--chrome-accent)] text-[#0B0F14]' : 'text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)] hover:bg-[var(--chrome-accent-dim)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="h-px shrink-0" style={{ background: 'var(--chrome-border)' }} />

      <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
        {/* 1. DICTIONARY */}
        {activeTab === 'dict' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[var(--chrome-accent)]" /> Từ điển Dao — Hán
              </h2>
              <button
                onClick={() => setShowAddModal(!showAddModal)}
                className="text-[11px] bg-[var(--chrome-accent)] hover:opacity-90 text-[#0B0F14] px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </div>

            {showAddModal && (
              <form onSubmit={handleAddWord} className="chrome-panel p-3 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="font-semibold text-[var(--chrome-text)] flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-[var(--chrome-accent)]" /> Thêm từ mới
                </div>
                <div>
                  <label className="text-[var(--chrome-text-muted)] block text-[10px] mb-1">Phiên âm ASCII (vd: maw faw)</label>
                  <input
                    type="text"
                    value={newRaw}
                    onChange={(e) => setNewRaw(e.target.value)}
                    placeholder="gõ ASCII"
                    className="chrome-field w-full px-2.5 py-1.5"
                    required
                  />
                </div>
                <div>
                  <label className="text-[var(--chrome-text-muted)] block text-[10px] mb-1">Chữ Hán tương ứng</label>
                  <input
                    type="text"
                    value={newHanzi}
                    onChange={(e) => setNewHanzi(e.target.value)}
                    placeholder="vd: 父母"
                    className="chrome-field w-full px-2.5 py-1.5 font-['Noto_Serif_SC'] text-base"
                    required
                  />
                </div>
                <div>
                  <label className="text-[var(--chrome-text-muted)] block text-[10px] mb-1">Ý nghĩa tiếng Việt</label>
                  <input
                    type="text"
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder="nghĩa tiếng Việt"
                    className="chrome-field w-full px-2.5 py-1.5"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="flex-1 bg-[var(--chrome-success)] hover:opacity-90 text-[#0B0F14] py-1.5 rounded-lg cursor-pointer font-semibold transition-colors">Lưu từ</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-3 text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)] cursor-pointer">Hủy</button>
                </div>
              </form>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--chrome-text-muted)]" />
              <input
                type="text"
                value={dictQuery}
                onChange={(e) => setDictQuery(e.target.value)}
                placeholder="Lọc phím gõ, chữ Hán hoặc nghĩa..."
                className="chrome-field w-full py-2 pl-8 pr-3"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full shrink-0 cursor-pointer text-[10px] font-medium transition-all ${
                    selectedCategory === cat ? 'bg-[var(--brass-400)] text-[#15120e] font-semibold' : 'bg-black/25 text-[var(--chrome-text-muted)] hover:text-[var(--chrome-text)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-0.5 max-h-[430px] overflow-y-auto -mx-1 px-1">
              {filteredDictEntries.length === 0 ? (
                <div className="text-center py-8 text-[var(--chrome-text-muted)] text-xs">Không tìm thấy từ khớp</div>
              ) : (
                filteredDictEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    onClick={() => insertChar(entry.hanzi)}
                    className="chrome-row group"
                    title="Bấm để chèn chữ này vào văn bản"
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center font-['Noto_Serif_SC'] text-lg text-[var(--chrome-text)] shrink-0 group-hover:text-[var(--chrome-accent)] transition-colors">
                      {entry.hanzi}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] text-[var(--brass-400)] truncate">
                        {entry.raw} <span style={{ color: 'var(--chrome-text-muted)' }}>→</span> <span className="text-[var(--chrome-text)]">{entry.key}</span>
                      </div>
                      <div className="text-[11px] text-[var(--chrome-text-muted)] truncate">{entry.meaning}</div>
                    </div>
                    <span className="text-[9px] text-[var(--chrome-text-muted)] shrink-0">{entry.category || 'Chung'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. TELEX RULES */}
        {activeTab === 'rules' && (
          <div className="space-y-3">
            <div>
              <h2 className="eyebrow flex items-center gap-1.5 mb-1">
                <Keyboard className="w-3.5 h-3.5 text-[var(--chrome-accent)]" /> Quy tắc ghép Telex
              </h2>
              <p className="text-[11px] text-[var(--chrome-text-muted)]">
                Gõ nguyên âm lặp hoặc phím 'w' để tự động tạo nguyên âm ghép tiếng Dao.
              </p>
            </div>

            <div className="chrome-panel overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="text-[var(--chrome-text-muted)] text-[10px] uppercase tracking-wide">
                  <tr>
                    <th className="p-2.5 font-medium">Gõ</th>
                    <th className="p-2.5 font-medium">Kết quả</th>
                    <th className="p-2.5 font-medium">Ví dụ</th>
                  </tr>
                </thead>
                <tbody style={{ borderColor: 'var(--chrome-border)' }} className="divide-y divide-[var(--chrome-border)] text-[var(--chrome-text-muted)]">
                  {TELEX_RULES.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-2.5 font-mono text-[var(--chrome-text)] font-semibold">{r.from}</td>
                      <td className="p-2.5 font-bold text-[var(--chrome-accent)] text-sm">{r.to}</td>
                      <td className="p-2.5 text-[11px] font-mono text-[var(--chrome-text-muted)]">
                        {r.from === 'aw' && 'maw → mă'}
                        {r.from === 'ow' && 'shoo → shŏ'}
                        {r.from === 'ew' && 'kew → kĕ'}
                        {r.from === 'ee' && 'shee → shê'}
                        {r.from === 'oo' && 'boo → bô'}
                        {r.from === 'iy' && 'tiy → tĭ'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chrome-panel p-3 space-y-2">
              <div className="text-xs font-semibold text-[var(--chrome-text)] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[var(--chrome-accent)]" /> Thử nghiệm gõ Telex
              </div>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="chrome-field w-full px-2.5 py-2 font-mono"
              />
              <div className="text-[11px] text-[var(--chrome-text-muted)]">
                Kết quả: <span className="font-mono text-[var(--chrome-accent)] font-bold text-sm ml-1">{transform(testInput)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. LOOKUP */}
        {activeTab === 'lookup' && (
          <div className="space-y-3">
            <div>
              <h2 className="eyebrow flex items-center gap-1.5 mb-1">
                <Search className="w-3.5 h-3.5 text-[var(--chrome-accent)]" /> Tra cứu Hán → Dao
              </h2>
              <p className="text-[11px] text-[var(--chrome-text-muted)]">
                Chọn ô chữ trên trang hoặc gõ trực tiếp chữ Hán để tra phiên âm và ngữ nghĩa.
              </p>
            </div>

            <input
              type="text"
              value={activeLookupChar || ''}
              onChange={(e) => setLookupChar(e.target.value)}
              placeholder="Nhập chữ Hán (ví dụ: 盤)"
              className="chrome-field w-full p-2.5 text-sm font-['Noto_Serif_SC']"
            />

            {activeLookupChar ? (
              <div className="chrome-panel p-3.5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-black/30 border flex items-center justify-center font-['Noto_Serif_SC'] text-3xl text-[var(--chrome-text)]" style={{ borderColor: 'var(--chrome-accent)' }}>
                    {activeLookupChar}
                  </div>
                  <div>
                    <div className="eyebrow">Tự dạng</div>
                    <div className="text-lg font-bold text-[var(--chrome-text)] font-['Noto_Serif_SC']">{activeLookupChar}</div>
                  </div>
                </div>

                <div className="h-px" style={{ background: 'var(--chrome-border)' }} />

                <div className="space-y-2 text-xs">
                  {lookupResults.length > 0 ? (
                    lookupResults.map((res, i) => (
                      <div key={i} className="p-2.5 bg-black/25 rounded-lg space-y-1" style={{ border: '1px solid var(--chrome-border)' }}>
                        <div className="font-mono text-[var(--chrome-accent)] font-bold text-sm">
                          {res.raw} <span className="text-[var(--chrome-text)] font-normal">({res.key})</span>
                        </div>
                        <div className="text-[var(--chrome-text-muted)]">{res.meaning}</div>
                        {res.category && <div className="text-[10px] text-[var(--chrome-text-muted)]">{res.category}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-[var(--chrome-text-muted)]">Chưa có phiên âm chuẩn hóa trong từ điển mẫu. Từ này có thể chèn trực tiếp.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-[var(--chrome-text-muted)] text-xs chrome-panel">
                Nhấp chuột phải vào ô chữ trên trang giấy để tra cứu nhanh.
              </div>
            )}
          </div>
        )}

        {/* 4. OCR */}
        {activeTab === 'ocr' && (
          <div className="space-y-3">
            <div>
              <h2 className="eyebrow flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--chrome-accent)]" /> OCR quét văn bản cổ
              </h2>
              <p className="text-[11px] text-[var(--chrome-text-muted)]">
                Quét ảnh văn bản chữ Dao cổ hoặc trích xuất ký tự tự động vào ô lưới.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed rounded-xl p-5 text-center bg-black/15 space-y-2.5 hover:border-[var(--chrome-accent)]/50 transition-colors cursor-pointer" style={{ borderColor: 'var(--chrome-border)' }}
            >
              <Camera className="w-8 h-8 text-[var(--chrome-text-muted)] mx-auto" />
              {selectedFile ? (
                <div className="text-xs font-semibold text-[var(--chrome-text)]">{selectedFile.name}</div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-[var(--chrome-text)]">Tải ảnh bản thảo chữ Dao</div>
                  <div className="text-[10px] text-[var(--chrome-text-muted)]">Kéo thả hoặc bấm để chọn ảnh (JPG, PNG, WEBP, tối đa 10MB)</div>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSimulateOCR();
                }}
                disabled={isScanning || !selectedFile}
                className="mt-1 px-4 py-1.5 bg-[var(--chrome-success)] hover:opacity-90 text-[#0B0F14] rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60"
              >
                {isScanning ? 'Đang nhận dạng...' : 'Chạy Scanner OCR'}
              </button>
            </div>

            {ocrError && (
              <div className="chrome-panel p-3 text-xs text-[var(--chrome-danger)]" style={{ border: '1px solid var(--chrome-danger)' }}>
                {ocrError}
              </div>
            )}

            <div className="chrome-panel p-3 space-y-2">
              <div className="text-xs font-semibold text-[var(--chrome-text)]">Kết quả nhận dạng</div>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={3}
                placeholder="Kết quả OCR sẽ hiển thị ở đây..."
                className="chrome-field w-full p-2.5 text-base font-['Noto_Serif_SC']"
              />
              <button
                onClick={handleInsertOCRText}
                disabled={!ocrText.trim()}
                className="w-full py-2 bg-[var(--chrome-accent)] hover:opacity-90 text-[#0B0F14] rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60"
              >
                Chèn toàn bộ vào trang giấy
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};