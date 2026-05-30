import React from "react";

interface CVControlsBarProps {
  currentStep: number;
  jobCategory: "software_engineer" | "general";
  cvLanguage: "auto" | "id" | "en" | "bilingual";
  selectedTemplate: "serif" | "sans" | "compact";
  forceSinglePage: boolean;
  onJobCategoryChange: (category: "software_engineer" | "general") => void;
  onCvLanguageChange: (lang: "auto" | "id" | "en" | "bilingual") => void;
  onTemplateChange: (template: "serif" | "sans" | "compact") => void;
  onForceSinglePageChange: (fit: boolean) => void;
  handleRecompile: (category: "software_engineer" | "general", lang: "auto" | "id" | "en" | "bilingual") => void;
}

const CVControlsBar: React.FC<CVControlsBarProps> = ({
  currentStep,
  jobCategory,
  cvLanguage,
  selectedTemplate,
  forceSinglePage,
  onJobCategoryChange,
  onCvLanguageChange,
  onTemplateChange,
  onForceSinglePageChange,
  handleRecompile,
}) => {
  if (currentStep <= 0) {
    return (
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <span>Workspace Pratinjau</span>
        <span className="text-[10px] uppercase font-bold text-slate-400">Belum Ada Analisis</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col xs:grid xs:grid-cols-2 sm:flex sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full">
      {/* Job Category Dropdown Select */}
      <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 hover:bg-slate-100/60 h-[38px] sm:h-[34px] px-3 rounded-xl sm:rounded-lg border border-slate-200 shadow-3xs transition-colors animate-fade-in w-full sm:w-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0" style={{ fontFamily: 'var(--font-jakarta)' }}>Role:</span>
        <select
          value={jobCategory}
          onChange={(e) => {
            const val = e.target.value as "software_engineer" | "general";
            onJobCategoryChange(val);
            if (currentStep === 3) {
              handleRecompile(val, cvLanguage);
            }
          }}
          className="bg-transparent h-full text-xs font-bold text-slate-700 focus:outline-none cursor-pointer border-none p-0 focus:ring-0 text-right sm:text-left"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <option value="general">Umum (Admin, Finance)</option>
          <option value="software_engineer">Developer (IT/Software)</option>
        </select>
      </div>

      {/* CV Language Dropdown Select */}
      <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 hover:bg-slate-100/60 h-[38px] sm:h-[34px] px-3 rounded-xl sm:rounded-lg border border-slate-200 shadow-3xs transition-colors animate-fade-in w-full sm:w-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0" style={{ fontFamily: 'var(--font-jakarta)' }}>Bahasa CV:</span>
        <select
          value={cvLanguage}
          onChange={(e) => {
            const val = e.target.value as "auto" | "id" | "en" | "bilingual";
            onCvLanguageChange(val);
            if (currentStep === 3) {
              handleRecompile(jobCategory, val);
            }
          }}
          className="bg-transparent h-full text-xs font-bold text-slate-700 focus:outline-none cursor-pointer border-none p-0 focus:ring-0 text-right sm:text-left"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <option value="auto">Bawaan (Auto)</option>
          <option value="id">Indonesia</option>
          <option value="en">English</option>
          <option value="bilingual">Bilingual (ID/EN)</option>
        </select>
      </div>

      {currentStep === 3 && (
        <>
          {/* Font Style Buttons */}
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 h-[38px] sm:h-[34px] px-3 sm:px-2 rounded-xl sm:rounded-lg border border-slate-200 shadow-3xs w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0" style={{ fontFamily: 'var(--font-jakarta)' }}>Style:</span>
            <div className="flex items-center gap-1">
              {(["serif", "sans", "compact"] as const).map((temp) => (
                <button key={temp} onClick={() => onTemplateChange(temp)}
                  className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-md cursor-pointer transition-all ${selectedTemplate === temp ? "bg-white text-indigo-600 shadow-3xs border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/30"}`}
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {temp}
                </button>
              ))}
            </div>
          </div>

          {/* Page Fit Mode */}
          <label className="flex items-center justify-between sm:justify-start gap-2 text-[10px] font-bold uppercase cursor-pointer select-none text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100/60 h-[38px] sm:h-[34px] px-3 rounded-xl sm:rounded-lg border border-slate-200 shadow-3xs transition-colors w-full sm:w-auto" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <span className="tracking-wider">Fit 1 Page</span>
            <input type="checkbox" checked={forceSinglePage} onChange={(e) => onForceSinglePageChange(e.target.checked)} className="w-3.5 h-3.5 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          </label>
        </>
      )}
    </div>
  );
};

export default CVControlsBar;
