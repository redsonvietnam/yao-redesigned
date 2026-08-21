import React from 'react';
import { transform } from '../../lib/imeEngine';
import type { Candidate } from '../../types';

interface CandidatePopupProps {
  preedit: string;
  candidates: Candidate[];
  selectedCandIdx: number;
  chopPos: { top: number; left: number } | null;
  commitCandidate: (idx?: number) => void;
}

const tagLabel = (t?: string) => {
  switch (t) {
    case 'exact': return 'đúng';
    case 'prefix': return 'gần đúng';
    case 'abbrev': return 'gõ tắt';
    case 'meaning': return 'nghĩa';
    default: return '';
  }
};

export const CandidatePopup: React.FC<CandidatePopupProps> = ({
  preedit,
  candidates,
  selectedCandIdx,
  chopPos,
  commitCandidate,
}) => {
  if (!preedit || !chopPos) return null;

  return (
    <div
      className="chop animate-in fade-in zoom-in-95 duration-100 z-50"
      style={{ top: `${chopPos.top}px`, left: `${chopPos.left}px` }}
    >
      {candidates.length === 0 ? (
        <div className="text-xs p-1 text-[#fbe9df]/90">
          Không tìm thấy chữ khớp với "{transform(preedit)}"
        </div>
      ) : (
        candidates.slice(0, 9).map((c, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              commitCandidate(idx);
            }}
            className={`cand ${idx === selectedCandIdx ? 'selected' : ''}`}
          >
            <span className="num">{idx + 1}</span>
            <span className="glyph">{c.hanzi}</span>
            <span className="gloss">{c.meaning || ''}</span>
            <span className="tag">{tagLabel(c.matchType)}</span>
          </div>
        ))
      )}
    </div>
  );
};
