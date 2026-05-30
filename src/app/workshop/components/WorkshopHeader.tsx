import React from "react";
import { CaretRight, ArrowClockwise, FileArrowDown } from "@phosphor-icons/react";

interface WorkshopHeaderProps {
  pdfFile: File | null;
  currentStep: number;
  handleReset: () => void;
  handleDownloadPDF: () => void;
}

const WorkshopHeader: React.FC<WorkshopHeaderProps> = ({
  pdfFile,
  currentStep,
  handleReset,
  handleDownloadPDF,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 backdrop-blur-xl border-b px-3 sm:px-6 py-3 flex sm:py-3.5 items-center justify-between" style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 mr-2">
        {/* Logo */}
        <a href="/" className="flex items-center gap-1.5 sm:gap-2.5 hover:opacity-80 transition-opacity shrink-0">
          <img src="/logo.png" alt="CVRedFlag Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="hidden xs:inline font-extrabold text-sm sm:text-base tracking-tight text-slate-900" style={{ fontFamily: "var(--font-jakarta)" }}>CVRedFlag<span className="text-indigo-600">.ai</span></span>
        </a>
        <span className="hidden md:inline text-xs font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>Workspace</span>
        <CaretRight weight="bold" className="hidden md:inline w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span className="hidden sm:inline-block text-xs sm:text-sm font-semibold truncate max-w-[100px] sm:max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
          {pdfFile ? pdfFile.name.replace(".pdf", "") : "New Analysis Session"}
        </span>
        {pdfFile && (
          <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md shrink-0" style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', color: 'var(--success)' }}>
            Ready
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <a
          href="/"
          className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-all hover:scale-[1.02]"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}
        >
          <span>←</span>
          <span className="hidden xs:inline">Kembali</span>
        </a>
        {currentStep > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold rounded-xl cursor-pointer border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-all hover:scale-[1.02]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowClockwise weight="bold" className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Start Over</span>
          </button>
        )}
        {currentStep === 3 && (
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold rounded-xl text-white cursor-pointer transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg,var(--accent),#6366f1)', boxShadow: '0 4px 20px rgba(79,70,229,0.25)' }}
          >
            <FileArrowDown weight="bold" className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Export</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default WorkshopHeader;
