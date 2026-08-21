import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { Sparkles, X, Search, Keyboard } from 'lucide-react';

interface SymbolCategory {
  title: string;
  symbols: { char: string; name: string }[];
}

const SYMBOL_CATEGORIES: SymbolCategory[] = [
  {
    title: 'Dấu Câu Cổ Truyền',
    symbols: [
      { char: '，', name: 'Phẩy cổ (Dấu đậu)' },
      { char: '。', name: 'Chấm khuyên (Dấu ngắt câu)' },
      { char: '、', name: 'Phẩy hất (Liệt kê)' },
      { char: '；', name: 'Chấm phẩy cổ' },
      { char: '：', name: 'Hai chấm' },
      { char: '「', name: 'Mở ngoặc đơn cổ' },
      { char: '」', name: 'Đóng ngoặc đơn cổ' },
      { char: '『', name: 'Mở ngoặc kép cổ' },
      { char: '』', name: 'Đóng ngoặc kép cổ' },
      { char: '《', name: 'Mở ngoặc sách' },
      { char: '》', name: 'Đóng ngoặc sách' },
      { char: '〈', name: 'Mở ngoặc nhỏ' },
      { char: '〉', name: 'Đóng ngoặc nhỏ' },
      { char: '【', name: 'Mở ngoặc vuông dày' },
      { char: '】', name: 'Đóng ngoặc vuông dày' },
      { char: '〔', name: 'Mở ngoặc rùa' },
      { char: '〕', name: 'Đóng ngoặc rùa' },
      { char: '？', name: 'Hỏi chấm fullwidth' },
      { char: '！', name: 'Cảm thán fullwidth' },
    ],
  },
  {
    title: 'Biểu Tượng & Hoa Văn Cổ Phong',
    symbols: [
      { char: '※', name: 'Dấu chú thích (Ghi chú)' },
      { char: '✦', name: 'Ngôi sao 4 cánh thẫm' },
      { char: '✧', name: 'Ngôi sao 4 cánh sáng' },
      { char: '☯', name: 'Thái Cực Âm Dương' },
      { char: '☸', name: 'Bát Chánh Đạo / Pháp Lân' },
      { char: '卍', name: 'Vạn tự (Mặt trời/Cát tường)' },
      { char: '卐', name: 'Vạn tự ngược' },
      { char: '⛩', name: 'Cổng Thần Đạo / Đền Cổ' },
      { char: '❖', name: 'Hoa văn kim cương' },
      { char: '◈', name: 'Kim cương khuyên' },
      { char: '○', name: 'Vòng tròn khuyên' },
      { char: '●', name: 'Vòng tròn thẫm' },
      { char: '□', name: 'Hình vuông khuyên' },
      { char: '■', name: 'Hình vuông thẫm' },
      { char: '△', name: 'Tam giác khuyên' },
      { char: '▲', name: 'Tam giác thẫm' },
      { char: '〓', name: 'Gạch đôi cổ' },
      { char: '¶', name: 'Đoạn văn tự' },
      { char: '꧁', name: 'Hoa văn đuôi trái' },
      { char: '꧂', name: 'Hoa văn đuôi phải' },
    ],
  },
];

export const SymbolPickerModal: React.FC = () => {
  const { showSymbolPicker, setShowSymbolPicker, toggleSymbolPicker, insertChar } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '.' || e.code === 'Period')) {
        e.preventDefault();
        e.stopPropagation();
        toggleSymbolPicker();
        return;
      }
      if (showSymbolPicker && e.key === 'Escape') {
        e.preventDefault();
        setShowSymbolPicker(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSymbolPicker, setShowSymbolPicker, toggleSymbolPicker]);

  if (!showSymbolPicker) return null;

  const handleInsert = (char: string) => insertChar(char);

  const filteredCategories = SYMBOL_CATEGORIES.map((cat) => {
    if (activeCategory !== 'Tất cả' && cat.title !== activeCategory) {
      return { title: cat.title, symbols: [] };
    }
    if (!searchTerm.trim()) return cat;
    const term = searchTerm.toLowerCase();
    const matched = cat.symbols.filter((s) => s.char.includes(term) || s.name.toLowerCase().includes(term));
    return { title: cat.title, symbols: matched };
  }).filter((cat) => cat.symbols.length > 0);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181410] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-[#f2e7d0]">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#b23a2e]/20 flex items-center justify-center text-[#b23a2e] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">Kí Tự Đặc Biệt & Dấu Câu Cổ Truyền</h3>
              <p className="text-[11px] text-[#8a7c5c] flex items-center gap-1.5">
                Nhấn để chèn.
                <kbd className="px-1.5 py-0.5 bg-black/40 font-mono rounded text-[10px]">Ctrl+.</kbd>
              </p>
            </div>
          </div>
          <button onClick={() => setShowSymbolPicker(false)} className="icon-btn shrink-0" title="Đóng (Escape)">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b6252]" />
            <input
              type="text"
              placeholder="Tìm kiếm ký hiệu, dấu câu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="chrome-field w-full pl-8 pr-3 py-1.5"
              autoFocus
            />
          </div>

          <div className="chrome-group overflow-x-auto max-w-full">
            {['Tất cả', ...SYMBOL_CATEGORIES.map((c) => c.title)].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`chrome-seg ${activeCategory === cat ? 'is-active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/[0.06] shrink-0" />

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-[#6b6252] text-xs">
              Không tìm thấy kí tự phù hợp với "{searchTerm}"
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.title} className="space-y-2">
                <h4 className="eyebrow flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#b23a2e]" />
                  {cat.title} · {cat.symbols.length}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                  {cat.symbols.map((item) => (
                    <button
                      key={item.char + item.name}
                      onClick={() => handleInsert(item.char)}
                      className="group flex flex-col items-center justify-center py-2 rounded-lg bg-black/20 hover:bg-[#b23a2e]/25 transition-all cursor-pointer"
                      title={`${item.char} — ${item.name}`}
                    >
                      <span className="text-lg font-['Noto_Serif_SC'] text-[#f2e7d0] group-hover:scale-110 transition-transform">
                        {item.char}
                      </span>
                      <span className="text-[9px] text-[#6b6252] group-hover:text-[#cdb996] truncate max-w-full px-1">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between text-[11px] text-[#8f8266] shrink-0 bg-black/20">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-[#8a7c5c]" />
            <span>Phím tắt: <strong className="text-[#e8dcc0]">Ctrl + .</strong></span>
          </div>
          <button onClick={() => setShowSymbolPicker(false)} className="px-3 py-1 hover:bg-white/[0.06] text-[#cdb996] rounded-lg cursor-pointer transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
