import React from "react";
import {
  MagicWand,
  Crosshair,
  Lightning,
  SealCheck,
  CheckCircle,
  TrendUp,
  ArrowClockwise,
  FileArrowDown
} from "@phosphor-icons/react";

interface CopilotPanelProps {
  currentStep: number;
  loading: boolean;
  runAnalysisStep: (step: number, content?: string) => void;
  step2Result: string;
  cvText: string;
  editableCV: string;
  handleReoptimize: () => void;
  handleDownloadPDF: () => void;
}

const CopilotPanel: React.FC<CopilotPanelProps> = ({
  currentStep,
  loading,
  runAnalysisStep,
  step2Result,
  cvText,
  editableCV,
  handleReoptimize,
  handleDownloadPDF,
}) => {
  return (
    <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-4 min-w-0">
      {/* AI Steps */}
      <div className="p-5 flex flex-col gap-4 rounded-2xl" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(79,70,229,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <MagicWand weight="fill" className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}>AI Optimization Steps</span>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { num: 1, label: "Scan & Match CV", icon: <Crosshair weight="bold" className="w-3 h-3" /> },
            { num: 2, label: "Apply Google XYZ", icon: <Lightning weight="bold" className="w-3 h-3" /> },
            { num: 3, label: "ATS Formatting", icon: <SealCheck weight="bold" className="w-3 h-3" /> },
          ].map(({ num, label, icon }) => {
            const done = currentStep >= num;
            const canRun = (num === 2 && currentStep === 1) || (num === 3 && currentStep === 2);
            return (
              <div key={num} className="flex items-center justify-between p-3 rounded-xl transition-all"
                style={{ background: done ? 'rgba(5,150,105,0.04)' : 'var(--bg-card)', border: `1px solid ${done ? 'rgba(5,150,105,0.15)' : 'var(--border)'}` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: done ? 'rgba(5,150,105,0.1)' : 'var(--bg-elevated)', color: done ? 'var(--success)' : 'var(--text-muted)' }}
                  >{icon}</div>
                  <span className="text-[11px] font-semibold" style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'var(--font-jakarta)' }}>{label}</span>
                </div>
                {done ? (
                  <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
                ) : canRun ? (
                  <button disabled={loading} onClick={() => runAnalysisStep(num)}
                    className="px-3 py-1 text-[10px] font-bold uppercase rounded-lg text-white cursor-pointer transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,var(--accent),#6366f1)' }}
                  >Run</button>
                ) : (
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Locked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* XYZ Comparison */}
      {step2Result && (
        <div className="premium-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Lightning weight="fill" className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}>Google XYZ Rewriter</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Before</span>
              <div className="p-3 rounded-xl text-xs leading-relaxed line-clamp-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {cvText.slice(0, 280)}...
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">AI Output</span>
              <div className="p-3 rounded-xl text-xs leading-relaxed max-h-48 overflow-y-auto" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(79,70,229,0.12)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {step2Result}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Panel */}
      {currentStep === 3 && (
        <div className="p-5 flex flex-col gap-3 rounded-2xl relative overflow-hidden"
          style={{ background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.12)' }}
        >
          <div className="absolute -top-4 -right-4 opacity-[0.04]">
            <SealCheck weight="fill" className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <SealCheck weight="fill" className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}>Export Document</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <TrendUp weight="bold" className="w-4 h-4 shrink-0 text-emerald-600" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}>Resume Optimized!</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Ready to upload to portals.</span>
            </div>
          </div>
          <button onClick={() => runAnalysisStep(1, editableCV)} disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 border border-emerald-600/20 bg-emerald-650/5 hover:bg-emerald-600/10 text-emerald-700 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <ArrowClockwise weight="bold" className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Re-scan / Get New Score
          </button>
          <button onClick={handleReoptimize} disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 border border-indigo-600/20 bg-indigo-50 hover:bg-indigo-100/60 text-indigo-700 disabled:opacity-50 animate-pulse-subtle"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <MagicWand weight="bold" className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Re-optimize / Refine Added Text
          </button>
          <p className="text-[9px] text-[var(--text-muted)] font-medium leading-relaxed text-center" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Jika Anda mengedit/menambah pengalaman di <strong>Editor CV</strong>, klik <strong>Re-scan</strong> untuk menilai ulang skor ATS atau <strong>Re-optimize</strong> untuk memformat penulisan Anda dengan AI.
          </p>
          <button onClick={handleDownloadPDF}
            className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', boxShadow: '0 8px 24px rgba(5,150,105,0.15)', fontFamily: 'var(--font-jakarta)' }}
          >
            <FileArrowDown weight="bold" className="w-4 h-4" /> Download ATS PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;
