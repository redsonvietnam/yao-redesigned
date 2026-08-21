import React from 'react';
import { useAppStore } from '../lib/store';
import {
  Bold,
  Italic,
  Underline,
  ZoomIn,
  Palette,
  Grid,
  Ruler,
  Sparkles,
  Layers,
  BookOpen,
  Keyboard,
  Search,
  Camera,
  Stamp,
} from 'lucide-react';
import { GridDensity } from '../types';

export const Toolbar: React.FC = () => {
  const {
    cellSize,
    setCellSize,
    isBold,
    toggleBold,
    isItalic,
    toggleItalic,
    isUnderline,
    toggleUnderline,
    selectedColor,
    setSelectedColor,
    selectedFont,
    setSelectedFont,
    insertChar,
    mode,
    setMode,
    textFlow,
    setTextFlow,
    inputMode,
    setInputMode,
    showGrid,
    setShowGrid,
    ribbonTab,
    gridDensity,
    setGridDensity,
    showRuler,
    setShowRuler,
    paperTheme,
    setPaperTheme,
    setActiveTab,
    setShowSymbolPicker,
  } = useAppStore();

  const colors = [
    { label: 'Thâm Mực', hex: '#15120e' },
    { label: 'Chu Thần', hex: '#b23a2e' },
    { label: 'Trúc Lục', hex: '#4f6a52' },
    { label: 'Kim Đồng', hex: '#a68a5b' },
    { label: 'Chàm Thẫm', hex: '#23324d' },
    { label: 'Tử Cấm', hex: '#58325a' },
  ];

  const daoSymbols = ['，', '。', '、', '；', '：', '「', '」', '『', '』', '〇', '※', '✦'];
  const sealStamps = ['印', '稿', '章', '壽', '福', '吉'];

  const densities: { id: GridDensity; label: string; size: number }[] = [
    { id: 'standard', label: 'Tiêu chuẩn', size: 48 },
    { id: 'dense', label: 'Dày', size: 42 },
    { id: 'high', label: 'Cao', size: 36 },
    { id: 'ultra', label: 'Tối đa', size: 30 },
  ];

  return (
    <div className="no-print w-full bg-[#211c17] px-3 md:px-4 py-1.5 flex flex-wrap items-center gap-2 text-xs min-h-11 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
      {/* 1. HOME */}
      {ribbonTab === 'home' && (
        <div className="flex items-center gap-2 flex-wrap w-full">
          <div className="chrome-group">
            <button onClick={() => setMode('vertical')} className={`chrome-seg ${mode === 'vertical' ? 'is-active' : ''}`} title="Khổ giấy Dọc">Dọc</button>
            <button onClick={() => setMode('horizontal')} className={`chrome-seg ${mode === 'horizontal' ? 'is-active' : ''}`} title="Khổ giấy Ngang">Ngang</button>
          </div>

          <div className="chrome-group">
            <button
              onClick={() => setTextFlow('top-to-bottom-rtl')}
              className={`chrome-seg flex items-center gap-1 ${textFlow === 'top-to-bottom-rtl' ? 'is-active' : ''}`}
              title="Cổ Phong: chữ dọc, Trên→Dưới, cột Phải→Trái"
            >
              <span className="font-mono opacity-70">↓⬅</span> Cổ Phong
            </button>
            <button
              onClick={() => setTextFlow('left-to-right-ttb')}
              className={`chrome-seg flex items-center gap-1 ${textFlow === 'left-to-right-ttb' ? 'is-active' : ''}`}
              title="Hiện Đại: chữ ngang, Trái→Phải, dòng Trên→Dưới"
            >
              <span className="font-mono opacity-70">➡↓</span> Hiện Đại
            </button>
          </div>

          <div className="chrome-group">
            <button onClick={() => setInputMode('han')} className={`chrome-seg ${inputMode === 'han' ? 'is-active bg-[#4f6a52]!' : ''}`}>Gõ Hán Telex</button>
            <button onClick={() => setInputMode('latin')} className={`chrome-seg ${inputMode === 'latin' ? 'is-active bg-[#4f6a52]!' : ''}`}>La-tinh</button>
          </div>

          <div className="chrome-divider hidden md:block" />

          <div className="chrome-group">
            <button onClick={toggleBold} className={`icon-btn !p-1 ${isBold ? 'is-active !text-[#b23a2e] !bg-[#b23a2e]/15' : ''}`} title="Đậm (Bold)"><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={toggleItalic} className={`icon-btn !p-1 ${isItalic ? 'is-active !text-[#b23a2e] !bg-[#b23a2e]/15' : ''}`} title="Nghiêng (Italic)"><Italic className="w-3.5 h-3.5" /></button>
            <button onClick={toggleUnderline} className={`icon-btn !p-1 ${isUnderline ? 'is-active !text-[#b23a2e] !bg-[#b23a2e]/15' : ''}`} title="Gạch chân (Underline)"><Underline className="w-3.5 h-3.5" /></button>
          </div>

          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
            className="chrome-field text-[11px] px-2 py-1.5 cursor-pointer font-medium"
          >
            <option value="Noto Serif SC">Tống Thể (Chuẩn Cổ)</option>
            <option value="Ma Shan Zheng">Thư Pháp Mã Sơn</option>
            <option value="Zhi Mang Xing">Bút Tháp Cương Bút</option>
            <option value="Long Cang">Hành Thư Long Cang</option>
            <option value="Liu Jian Mao Cao">Thảo Thư Liễu Kiến</option>
            <option value="Noto Sans SC">Hắc Thể (Nét Đều)</option>
          </select>

          <div className="flex items-center gap-1 bg-black/25 px-2 py-1 rounded-lg">
            <Palette className="w-3.5 h-3.5 text-[#8a7c5c]" />
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c.hex)}
                className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                  selectedColor === c.hex ? 'ring-2 ring-offset-1 ring-offset-[#211c17] ring-[#b23a2e]' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-lg">
            <ZoomIn className="w-3.5 h-3.5 text-[#8a7c5c]" />
            <input
              type="range"
              min="24"
              max="110"
              value={cellSize}
              onChange={(e) => setCellSize(parseInt(e.target.value, 10))}
              className="w-16 h-1 accent-[#b23a2e] cursor-pointer"
            />
            <span className="text-[10px] font-mono text-[#cdb996] w-7">{cellSize}px</span>
          </div>

          <button
            onClick={() => setShowSymbolPicker(true)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/25 hover:bg-[#b23a2e]/25 text-[#cdb996] hover:text-white transition-all cursor-pointer font-medium"
            title="Bảng kí tự & dấu câu đặc biệt"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8a7c5c]" />
            <span className="hidden lg:inline">Kí tự đặc biệt</span>
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-black/40 text-[#8a7c5c] rounded">Ctrl+.</kbd>
          </button>
        </div>
      )}

      {/* 2. INSERT */}
      {ribbonTab === 'insert' && (
        <div className="flex items-center gap-4 flex-wrap w-full">
          <button
            onClick={() => setShowSymbolPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/25 hover:bg-[#b23a2e] text-[#f2e7d0] transition-all cursor-pointer font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kí tự & dấu câu đặc biệt</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/40 rounded">Ctrl+.</kbd>
          </button>

          <div className="chrome-divider" />

          <div className="flex items-center gap-2">
            <span className="eyebrow flex items-center gap-1"><Stamp className="w-3 h-3 text-[#b23a2e]" /> Con dấu</span>
            <div className="flex items-center gap-1">
              {sealStamps.map((seal) => (
                <button
                  key={seal}
                  onClick={() => insertChar(seal)}
                  className="w-7 h-7 rounded-md bg-[#b23a2e] text-white font-['Noto_Serif_SC'] font-bold text-xs flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                  title={`Chèn con dấu [${seal}]`}
                >
                  {seal}
                </button>
              ))}
            </div>
          </div>

          <div className="chrome-divider" />

          <div className="flex items-center gap-2">
            <span className="eyebrow">Dấu câu nhanh</span>
            <div className="flex items-center gap-1 flex-wrap">
              {daoSymbols.map((sym) => (
                <button
                  key={sym}
                  onClick={() => insertChar(sym)}
                  className="w-7 h-7 rounded-md bg-black/25 hover:bg-[#a68a5b]/25 text-[#cdb996] hover:text-white font-['Noto_Serif_SC'] text-xs flex items-center justify-center cursor-pointer transition-all"
                  title={`Chèn "${sym}"`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. LAYOUT */}
      {ribbonTab === 'layout' && (
        <div className="flex items-center gap-4 flex-wrap w-full">
          <div className="flex items-center gap-2">
            <span className="eyebrow">Khổ giấy</span>
            <div className="chrome-group">
              <button onClick={() => setMode('vertical')} className={`chrome-seg ${mode === 'vertical' ? 'is-active' : ''}`}>Dọc</button>
              <button onClick={() => setMode('horizontal')} className={`chrome-seg ${mode === 'horizontal' ? 'is-active' : ''}`}>Ngang</button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="eyebrow">Hướng chữ</span>
            <div className="chrome-group">
              <button onClick={() => setTextFlow('top-to-bottom-rtl')} className={`chrome-seg ${textFlow === 'top-to-bottom-rtl' ? 'is-active' : ''}`}>Cổ Phong</button>
              <button onClick={() => setTextFlow('left-to-right-ttb')} className={`chrome-seg ${textFlow === 'left-to-right-ttb' ? 'is-active' : ''}`}>Hiện Đại</button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="eyebrow flex items-center gap-1"><Layers className="w-3 h-3 text-[#b23a2e]" /> Mật độ</span>
            <div className="chrome-group">
              {densities.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setGridDensity(d.id);
                    setCellSize(d.size);
                  }}
                  className={`chrome-seg ${gridDensity === d.id ? 'is-active' : ''}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 md:ml-auto">
            <span className="eyebrow">Chất liệu giấy</span>
            <div className="chrome-group">
              <button onClick={() => setPaperTheme('classic')} className={`chrome-seg ${paperTheme === 'classic' ? 'is-active bg-[#a68a5b]! text-[#15120e]!' : ''}`}>Cổ phong</button>
              <button onClick={() => setPaperTheme('white')} className={`chrome-seg ${paperTheme === 'white' ? 'is-active bg-white! text-black!' : ''}`}>Giấy trắng</button>
              <button onClick={() => setPaperTheme('dark')} className={`chrome-seg ${paperTheme === 'dark' ? 'is-active' : ''}`}>Gấm tối</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TOOLS */}
      {ribbonTab === 'tools' && (
        <div className="flex items-center gap-1.5 flex-wrap w-full">
          {[
            { tab: 'dict' as const, icon: BookOpen, label: 'Từ điển Dao — Hán' },
            { tab: 'rules' as const, icon: Keyboard, label: 'Quy tắc Telex' },
            { tab: 'lookup' as const, icon: Search, label: 'Tra tự dạng' },
            { tab: 'ocr' as const, icon: Camera, label: 'OCR quét văn bản' },
          ].map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 bg-black/25 hover:bg-[#a68a5b]/20 text-[#cdb996] hover:text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Icon className="w-3.5 h-3.5 text-[#8a7c5c]" /> {label}
            </button>
          ))}
        </div>
      )}

      {/* 5. VIEW */}
      {ribbonTab === 'view' && (
        <div className="flex items-center gap-2 flex-wrap w-full">
          <button
            onClick={() => setShowRuler(!showRuler)}
            className={`icon-btn !p-1.5 flex items-center gap-1.5 !rounded-lg ${showRuler ? 'is-active' : 'bg-black/25'}`}
          >
            <Ruler className="w-3.5 h-3.5" /> <span className="font-medium">Thước đo lề</span>
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`icon-btn !p-1.5 flex items-center gap-1.5 !rounded-lg ${showGrid ? 'is-active' : 'bg-black/25'}`}
          >
            <Grid className="w-3.5 h-3.5" /> <span className="font-medium">Lưới ô kẻ</span>
          </button>
        </div>
      )}
    </div>
  );
};
