export const MAX_HISTORY_ENTRIES = 200;

export const MIN_ZOOM = 20;
export const MAX_ZOOM = 110;
export const ZOOM_STEP = 2;

export const COLOR_OPTIONS = [
  { label: 'Thâm Mực (Đen)', hex: '#15120e' },
  { label: 'Chu Thần (Đỏ)', hex: '#b23a2e' },
  { label: 'Trúc Lục (Xanh)', hex: '#4f6a52' },
  { label: 'Kim Đồng (Vàng)', hex: '#a68a5b' },
  { label: 'Chàm Thẫm (Lam)', hex: '#23324d' },
  { label: 'Tử Cấm (Tím)', hex: '#58325a' },
] as const;

export const FONT_OPTIONS = [
  { label: 'Tống Thể (Chữ In Cổ)', value: 'Noto Serif SC' },
  { label: 'Thư Pháp Mã Sơn', value: 'Ma Shan Zheng' },
  { label: 'Bút Tháp Cương Bút', value: 'Zhi Mang Xing' },
  { label: 'Hành Thư Long Cang', value: 'Long Cang' },
  { label: 'Thảo Thư Liễu Kiến', value: 'Liu Jian Mao Cao' },
  { label: 'Hắc Thể (Nét Đều Rõ)', value: 'Noto Sans SC' },
] as const;

export const GRID_DENSITIES = [
  { id: 'standard' as const, label: 'Tiêu chuẩn', size: 48 },
  { id: 'dense' as const, label: 'Dày', size: 42 },
  { id: 'high' as const, label: 'Cao', size: 36 },
  { id: 'ultra' as const, label: 'Tối đa', size: 30 },
];
