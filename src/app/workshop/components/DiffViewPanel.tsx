import React from "react";
import { AnalysisResult } from "../types";
import { highlightWords, getRedFlagKeyTerms } from "../utils/cvHelpers";

interface DiffViewPanelProps {
  cvText: string;
  editableCV: string;
  step1Result: AnalysisResult | null;
}

const DiffViewPanel: React.FC<DiffViewPanelProps> = ({
  cvText,
  editableCV,
  step1Result,
}) => {
  return (
    <div className="w-full min-h-[600px] grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50">
      <div className="flex flex-col gap-2 bg-white rounded-xl p-4 border border-[var(--border)]">
        <div className="flex items-center gap-1.5 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-jakarta)' }}>Original CV (Red Flags)</span>
        </div>
        <div className="flex-1 overflow-auto max-h-[500px] text-xs font-mono whitespace-pre-wrap leading-relaxed pt-2 text-slate-600"
          dangerouslySetInnerHTML={{
            __html: highlightWords(
              cvText,
              getRedFlagKeyTerms([...(step1Result?.redFlags || []), ...(step1Result?.resolvedRedFlags || [])]),
              "diff-removed"
            )
          }}
        />
      </div>
      <div className="flex flex-col gap-2 bg-white rounded-xl p-4 border border-[var(--border)]">
        <div className="flex items-center gap-1.5 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-jakarta)' }}>Optimized CV (Added Keywords)</span>
        </div>
        <div className="flex-1 overflow-auto max-h-[500px] text-xs font-mono whitespace-pre-wrap leading-relaxed pt-2 text-slate-600"
          dangerouslySetInnerHTML={{
            __html: highlightWords(
              editableCV || cvText,
              [...(step1Result?.missingKeywords || []), ...(step1Result?.resolvedKeywords || [])],
              "diff-added",
              true
            )
          }}
        />
      </div>
    </div>
  );
};

export default DiffViewPanel;
