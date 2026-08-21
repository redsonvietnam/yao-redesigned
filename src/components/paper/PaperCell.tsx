import React from 'react';
import { transform } from '../../lib/imeEngine';
import type { CellData } from '../../types';

interface PaperCellProps {
  globalIdx: number;
  cellData: CellData | undefined;
  isCursor: boolean;
  isSelected: boolean;
  preedit: string;
  paperTheme: string;
  onMouseDown: (idx: number, e: React.MouseEvent) => void;
  onMouseEnter: (idx: number) => void;
  onContextMenu: (idx: number, char: string, e: React.MouseEvent) => void;
}

export const PaperCell: React.FC<PaperCellProps> = React.memo(({
  globalIdx,
  cellData,
  isCursor,
  isSelected,
  preedit,
  paperTheme,
  onMouseDown,
  onMouseEnter,
  onContextMenu,
}) => {
  return (
    <div
      data-idx={globalIdx}
      onMouseDown={(e) => onMouseDown(globalIdx, e)}
      onMouseEnter={() => onMouseEnter(globalIdx)}
      onContextMenu={(e) => onContextMenu(globalIdx, cellData?.char || '', e)}
      className={`cell ${isCursor ? 'cursor' : ''} ${isSelected ? 'selected-cell ring-2 ring-[#b23a2e] bg-[#b23a2e]/20' : ''}`}
      style={{
        color: cellData?.color || (paperTheme === 'white' ? '#000000' : 'var(--ink-950)'),
        fontFamily: cellData?.font || 'Noto Serif SC',
        fontWeight: cellData?.bold ? '700' : '400',
        fontStyle: cellData?.italic ? 'italic' : 'normal',
        textDecoration: cellData?.underline ? 'underline' : 'none',
      }}
    >
      {isCursor && preedit ? (
        <span className="preedit">{transform(preedit)}</span>
      ) : (
        cellData?.char || ''
      )}
    </div>
  );
});

PaperCell.displayName = 'PaperCell';
