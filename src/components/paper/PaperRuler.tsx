import React from 'react';

interface RulerProps {
  rows: number;
  cols: number;
}

export const HorizontalRuler: React.FC<Pick<RulerProps, 'cols'>> = ({ cols }) => (
  <div className="flex items-center mb-1 text-[9px] font-mono text-[#a68a5b]/70 select-none border-b border-[#a68a5b]/30 pb-0.5">
    <span className="w-6 text-center text-[#b23a2e]">Cột:</span>
    <div className="flex justify-between flex-1 px-1">
      {Array.from({ length: cols }).map((_, c) => (
        <span key={c} className="w-4 text-center">{c + 1}</span>
      ))}
    </div>
  </div>
);

export const VerticalRuler: React.FC<Pick<RulerProps, 'rows'>> = ({ rows }) => (
  <div className="flex flex-col justify-between text-[9px] font-mono text-[#a68a5b]/70 select-none border-r border-[#a68a5b]/30 pr-0.5 py-1">
    {Array.from({ length: rows }).map((_, r) => (
      <span key={r} className="h-4 text-center leading-4">{r + 1}</span>
    ))}
  </div>
);

export const PaperRuler: React.FC<RulerProps> = ({ rows, cols }) => (
  <>
    <HorizontalRuler cols={cols} />
    <VerticalRuler rows={rows} />
  </>
);
