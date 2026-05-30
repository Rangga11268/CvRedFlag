import React from "react";
import { motion } from "framer-motion";
import { Tag, CheckCircle, Warning, Briefcase, ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { AnalysisResult } from "../types";

interface ATSAnalyzerPanelProps {
  step1Result: AnalysisResult | null;
  scoreHistory: number[];
  selectedKeyword: string | null;
  keywordSuggestion: string;
  loadingKeywordSuggestion: boolean;
  jobDescription: string;
  currentCvText: string;
  setJobDescription: (jd: string) => void;
  onKeywordClick: (kw: string) => void;
  setSelectedKeyword: (kw: string | null) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const ATSAnalyzerPanel: React.FC<ATSAnalyzerPanelProps> = ({
  step1Result,
  scoreHistory,
  selectedKeyword,
  keywordSuggestion,
  loadingKeywordSuggestion,
  jobDescription,
  currentCvText,
  setJobDescription,
  onKeywordClick,
  setSelectedKeyword,
}) => {
  // Merge original keywords list
  const allKeywords = React.useMemo(() => {
    if (!step1Result) return [];
    const missing = step1Result.missingKeywords || [];
    const resolved = step1Result.resolvedKeywords || [];
    return Array.from(new Set([...missing, ...resolved]));
  }, [step1Result]);

  // Dynamically check which keywords are resolved based on current CV text
  const { currentMissing, currentResolved } = React.useMemo(() => {
    const text = (currentCvText || "").toLowerCase();
    const missing: string[] = [];
    const resolved: string[] = [];
    
    allKeywords.forEach(kw => {
      // Clean keyword check: strip common markdown formatting
      const cleanKw = kw.toLowerCase().trim();
      if (cleanKw && text.includes(cleanKw)) {
        resolved.push(kw);
      } else {
        missing.push(kw);
      }
    });
    return { currentMissing: missing, currentResolved: resolved };
  }, [allKeywords, currentCvText]);

  if (!step1Result) return null;

  const scoreColor = step1Result.score >= 80
    ? "text-[var(--success)]"
    : step1Result.score >= 60
    ? "text-[var(--gold)]"
    : "text-[var(--danger)]";

  const scoreRing = step1Result.score >= 80 ? "var(--success)" : step1Result.score >= 60 ? "var(--gold)" : "var(--danger)";

  const scoreLabel = step1Result.score >= 80
    ? "Excellent"
    : step1Result.score >= 60
    ? "Good"
    : "Needs Work";

  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 min-w-0">
      {/* Match Score */}
      <div className="premium-card p-5 flex flex-col items-center text-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jakarta)' }}>ATS Match Score</span>
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path strokeWidth="2" stroke="rgba(0,0,0,0.04)" fill="none" strokeLinecap="round"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <motion.path
              stroke={scoreRing} strokeWidth="2.8" strokeLinecap="round" fill="none"
              strokeDasharray={`${step1Result.score}, 100`}
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${step1Result.score}, 100` }}
              transition={{ duration: 1.4, ease: easeOut }}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              style={{ filter: `drop-shadow(0 0 8px ${scoreRing}15)` }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-3xl font-black tracking-tight ${scoreColor}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
              {step1Result.score}%
            </span>
            <span className="text-[9px] font-bold uppercase mt-0.5 px-2 py-0.5 rounded-md" style={{ color: scoreRing, background: `${scoreRing}10` }}>
              {scoreLabel}
            </span>
          </div>
        </div>

        {step1Result.breakdown && (
          <div className="w-full flex flex-col gap-2.5 mt-2 pt-3 border-t text-left" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ fontFamily: 'var(--font-jakarta)' }}>Keyword Matching</span>
                <span>{step1Result.breakdown.keywords}/40</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(step1Result.breakdown.keywords / 40) * 100}%` }}
                  className="h-full rounded-full" style={{ background: 'var(--accent)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ fontFamily: 'var(--font-jakarta)' }}>Impact & Action Verbs</span>
                <span>{step1Result.breakdown.impact}/25</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(step1Result.breakdown.impact / 25) * 100}%` }}
                  className="h-full rounded-full bg-amber-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ fontFamily: 'var(--font-jakarta)' }}>Structural Completeness</span>
                <span>{step1Result.breakdown.structure}/20</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(step1Result.breakdown.structure / 20) * 100}%` }}
                  className="h-full rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ fontFamily: 'var(--font-jakarta)' }}>Readability & Formatting</span>
                <span>{step1Result.breakdown.readability}/15</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(step1Result.breakdown.readability / 15) * 100}%` }}
                  className="h-full rounded-full bg-indigo-500" />
              </div>
            </div>
          </div>
        )}

        {scoreHistory.length >= 1 && (
          <div className="w-full flex flex-col gap-1.5 mt-2 pt-3 border-t text-left" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jakarta)' }}>Match Score Trend</span>
            <div className="h-10 w-full bg-[var(--bg-base)] rounded-xl border border-[var(--border)] p-1.5 flex items-center justify-between relative overflow-hidden">
              {scoreHistory.length === 1 ? (
                <div className="w-full text-center text-[9px] font-semibold text-[var(--text-muted)] flex items-center justify-center">
                  Initial Score: {scoreHistory[0]}%
                </div>
              ) : (
                <div className="w-full h-full flex items-end justify-between relative">
                  <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.0" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.15" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 0 24 ${scoreHistory.map((val, idx) => {
                        const x = (idx / (scoreHistory.length - 1)) * 100;
                        const y = 24 - (val / 100) * 20 - 2;
                        return `L ${x} ${y}`;
                      }).join(" ")} L 100 24 Z`}
                      fill="url(#trendGrad)"
                    />
                    <motion.path
                      d={scoreHistory.map((val, idx) => {
                        const x = (idx / (scoreHistory.length - 1)) * 100;
                        const y = 24 - (val / 100) * 20 - 2;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(" ")}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                  </svg>
                  <div className="absolute top-1 left-2 text-[9px] font-bold text-slate-400 bg-white/90 px-1 rounded border border-slate-100">{scoreHistory[0]}%</div>
                  <div className="absolute bottom-1 right-2 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-100">{scoreHistory[scoreHistory.length - 1]}%</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Missing Keywords */}
      <div className="premium-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Tag weight="fill" className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}>Keywords Checklist</span>
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {currentMissing.length} / {allKeywords.length} missing
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
          {currentMissing.map((kw, i) => (
            <motion.span key={`missing-${i}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}
              onClick={() => onKeywordClick(kw)}
              className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold cursor-pointer transition-all hover:bg-indigo-150/40 hover:border-indigo-400/30 ${selectedKeyword === kw ? "ring-2 ring-indigo-500/30 bg-indigo-100/50" : ""}`}
              style={{ background: 'var(--accent-glow)', border: selectedKeyword === kw ? '1px solid var(--accent)' : '1px solid rgba(79,70,229,0.12)', color: 'var(--text-secondary)' }}
            >
              {kw}
            </motion.span>
          ))}
          {currentResolved.map((kw, i) => (
            <motion.span key={`resolved-${i}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="px-2.5 py-1 text-[11px] rounded-lg font-semibold flex items-center gap-1 border border-emerald-250 bg-emerald-50 text-emerald-800"
            >
              <CheckCircle weight="fill" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="line-through opacity-75">{kw}</span>
            </motion.span>
          ))}
          {allKeywords.length === 0 && (
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>No keywords analyzed yet.</span>
          )}
        </div>

        {selectedKeyword && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="mt-2 p-3 rounded-xl border text-[11px] leading-relaxed flex flex-col gap-1.5"
            style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--accent)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                💡 AI Suggestion: {selectedKeyword}
              </span>
              <button onClick={() => setSelectedKeyword(null)} className="text-[10px] hover:opacity-100 opacity-60 text-slate-500 font-bold cursor-pointer">Close</button>
            </div>
            {loadingKeywordSuggestion ? (
              <div className="flex items-center gap-1.5 text-slate-400">
                <ArrowClockwise weight="bold" className="w-3 h-3 animate-spin" />
                <span>Generating suggestions...</span>
              </div>
            ) : (
              <p className="text-slate-600 font-medium">{keywordSuggestion}</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Red Flags */}
      <div className="premium-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Warning weight="fill" className="w-3.5 h-3.5 text-red-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--danger)', fontFamily: 'var(--font-jakarta)' }}>Red Flags</span>
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--danger-glow)', color: 'var(--danger)' }}>
            {step1Result.redFlags.length}
          </span>
        </div>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {step1Result.redFlags.map((flag, i) => (
            <div key={`flag-${i}`} className="flex items-start gap-2.5 p-3 rounded-lg text-xs" style={{ background: 'var(--danger-glow)', border: '1px solid rgba(220,38,38,0.06)' }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0" style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--danger)' }}>{i + 1}</div>
              <p className="leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>{flag}</p>
            </div>
          ))}
          {step1Result.resolvedRedFlags?.map((flag, i) => (
            <div key={`resolved-${i}`} className="flex items-start gap-2.5 p-3 rounded-lg text-xs" style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.15)' }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0" style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--success)' }}>
                <CheckCircle weight="fill" className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Resolved</span>
                <p className="leading-relaxed font-medium line-through text-slate-400">{flag}</p>
              </div>
            </div>
          ))}
          {step1Result.redFlags.length === 0 && (!step1Result.resolvedRedFlags || step1Result.resolvedRedFlags.length === 0) && (
            <div className="p-3 rounded-lg text-xs flex items-center gap-1.5" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)', color: 'var(--success)' }}>
              <CheckCircle weight="fill" className="w-3.5 h-3.5" /> Clean CV!
            </div>
          )}
        </div>
      </div>

      {/* Target Job Description Card */}
      <div className="premium-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Briefcase weight="fill" className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}>Target Job Description</span>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full h-24 p-2 text-[11px] leading-relaxed focus:outline-none resize-y rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]"
          placeholder="Target Job Description requirements..."
        />
        <p className="text-[9px] text-[var(--text-muted)] font-medium">You can update the requirements here and click "Re-scan / Get New Score" to recalculate your score.</p>
      </div>
    </div>
  );
};

export default ATSAnalyzerPanel;
