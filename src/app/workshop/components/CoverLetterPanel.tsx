import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowClockwise, MagicWand, FileArrowDown } from "@phosphor-icons/react";
import { renderCV } from "../utils/cvHelpers";

interface CoverLetterPanelProps {
  coverLetterFormat: "cover_letter" | "body_email_1" | "body_email_2";
  setCoverLetterFormat: (format: "cover_letter" | "body_email_1" | "body_email_2") => void;
  coverLetterLang: "id" | "en";
  setCoverLetterLang: (lang: "id" | "en") => void;
  loadingCoverLetter: boolean;
  cvText: string;
  jobDescription: string;
  coverLetter: string;
  selectedTemplate: "serif" | "sans" | "compact";
  handleGenerateCoverLetter: () => void;
  handleDownloadCoverLetterPDF: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const CoverLetterPanel: React.FC<CoverLetterPanelProps> = ({
  coverLetterFormat,
  setCoverLetterFormat,
  coverLetterLang,
  setCoverLetterLang,
  loadingCoverLetter,
  cvText,
  jobDescription,
  coverLetter,
  selectedTemplate,
  handleGenerateCoverLetter,
  handleDownloadCoverLetterPDF,
  showToast,
}) => {
  return (
    <div className="w-full min-h-[600px] p-6 bg-slate-50 flex flex-col gap-4 relative">
      {/* Control Panel for Cover Letter & Email generation */}
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-white rounded-2xl border border-[var(--border)] shadow-xs justify-between items-center z-10">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Format Selection */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pilih Format Dokumen</label>
            <select
              value={coverLetterFormat}
              onChange={(e) => setCoverLetterFormat(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
            >
              <option value="cover_letter">Cover Letter (Surat Lamaran)</option>
              <option value="body_email_1">Body Email (Formal & Lampiran)</option>
              <option value="body_email_2">Body Email (Tonjolkan Prestasi)</option>
            </select>
          </div>

          {/* Language Selection */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bahasa</label>
            <select
              value={coverLetterLang}
              onChange={(e) => setCoverLetterLang(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          disabled={loadingCoverLetter || !cvText || !jobDescription}
          onClick={handleGenerateCoverLetter}
          className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          {loadingCoverLetter ? (
            <>
              <ArrowClockwise weight="bold" className="w-3.5 h-3.5 animate-spin" />
              Memproses Dokumen...
            </>
          ) : (
            <>
              <MagicWand weight="bold" className="w-3.5 h-3.5" />
              {coverLetter ? "Regenerasi Dokumen" : "Buat Dokumen"}
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {loadingCoverLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-45 flex flex-col items-center justify-center p-8 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.95)' }}
          >
            <ArrowClockwise weight="bold" className="w-7 h-7 animate-spin mb-4" style={{ color: 'var(--accent)' }} />
            <p className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}>Drafting document...</p>
            <p className="text-[11px] mt-1.5 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Writing tailored matches · Please wait</p>
          </motion.div>
        )}
      </AnimatePresence>

      {coverLetter ? (
        <div className="flex flex-col gap-3 bg-[var(--bg-base)] rounded-2xl p-4 border border-[var(--border)] shadow-sm">
          <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {coverLetterFormat.startsWith("body_email") ? "AI Generated Body Email" : "AI Generated Cover Letter"}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(coverLetter);
                  showToast(coverLetterFormat.startsWith("body_email") ? "Email copied to clipboard!" : "Cover letter copied to clipboard!", "success");
                }}
                className="px-3 py-1.5 text-[9px] font-bold uppercase bg-indigo-50 border border-indigo-150/40 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer transition-all"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Copy to Clipboard
              </button>
              {!coverLetterFormat.startsWith("body_email") && (
                <button
                  onClick={handleDownloadCoverLetterPDF}
                  className="px-3 py-1.5 text-[9px] font-bold uppercase bg-emerald-50 border border-emerald-150/40 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  <FileArrowDown weight="bold" className="w-3.5 h-3.5" /> Download PDF
                </button>
              )}
            </div>
          </div>
          <div className="w-full flex justify-center py-4 bg-slate-100 overflow-x-auto max-h-[600px] rounded-xl border">
            <div
              className="bg-white shadow-md p-6 sm:p-8 text-slate-800 text-left w-full max-w-[794px]"
              style={{
                minHeight: coverLetterFormat.startsWith("body_email") ? "auto" : "1123px",
                fontFamily: selectedTemplate === "serif" ? "'Times New Roman','Garamond',serif" : selectedTemplate === "sans" ? "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif" : "'Calibri',sans-serif",
                fontSize: "10.5pt",
                lineHeight: 1.5,
                color: "#222",
              }}
              dangerouslySetInnerHTML={{ __html: renderCV(coverLetter) }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-[var(--border)] shadow-sm min-h-[400px]">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
            <MagicWand weight="bold" className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>Siapkan Cover Letter & Body Email Anda</h4>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-5">
            Pilih format bahasa dan tipe dokumen di atas, kemudian klik "Buat Dokumen" untuk menghasilkan draf yang disesuaikan secara dinamis dengan CV Anda dan Kriteria Pekerjaan.
          </p>
        </div>
      )}
    </div>
  );
};

export default CoverLetterPanel;
