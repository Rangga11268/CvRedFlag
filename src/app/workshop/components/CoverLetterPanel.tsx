import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowClockwise,
  MagicWand,
  FileArrowDown,
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  Broom
} from "@phosphor-icons/react";
import { renderCV } from "../utils/cvHelpers";

interface CoverLetterPanelProps {
  coverLetterFormat: "cover_letter" | "body_email_1" | "body_email_2";
  setCoverLetterFormat: (format: "cover_letter" | "body_email_1" | "body_email_2") => void;
  coverLetterLang: "id" | "en";
  setCoverLetterLang: (lang: "id" | "en") => void;
  coverLetterTone: "formal" | "confident" | "collaborative";
  setCoverLetterTone: (tone: "formal" | "confident" | "collaborative") => void;
  loadingCoverLetter: boolean;
  cvText: string;
  jobDescription: string;
  coverLetter: string;
  setCoverLetter: (text: string) => void;
  selectedTemplate: "serif" | "sans" | "compact";
  handleGenerateCoverLetter: () => void;
  handleDownloadCoverLetterPDF: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const htmlToPlainText = (html: string) => {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lines: string[] = [];
  
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      lines.push(node.textContent || "");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();
      
      if (tagName === "BR") {
        lines.push("\n");
      } else if (tagName === "P" || tagName === "DIV" || tagName === "LI") {
        if (lines.length > 0 && !lines[lines.length - 1].endsWith("\n")) {
          lines.push("\n");
        }
        if (tagName === "LI") {
          lines.push("• ");
        }
        for (let i = 0; i < el.childNodes.length; i++) {
          walk(el.childNodes[i]);
        }
        lines.push("\n");
      } else {
        for (let i = 0; i < el.childNodes.length; i++) {
          walk(el.childNodes[i]);
        }
      }
    }
  };
  
  for (let i = 0; i < doc.body.childNodes.length; i++) {
    walk(doc.body.childNodes[i]);
  }
  
  return lines.join("").replace(/\n{3,}/g, "\n\n").trim();
};

const copyRichText = async (html: string) => {
  const plainText = htmlToPlainText(html);
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([html], { type: "text/html" });
      const blobPlain = new Blob([plainText], { type: "text/plain" });
      const item = new ClipboardItem({
        "text/html": blobHtml,
        "text/plain": blobPlain,
      });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(plainText);
    }
    return true;
  } catch (err) {
    console.error("Rich text copy failed, falling back to text copy:", err);
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch (e) {
      return false;
    }
  }
};

const CoverLetterPanel: React.FC<CoverLetterPanelProps> = ({
  coverLetterFormat,
  setCoverLetterFormat,
  coverLetterLang,
  setCoverLetterLang,
  coverLetterTone,
  setCoverLetterTone,
  loadingCoverLetter,
  cvText,
  jobDescription,
  coverLetter,
  setCoverLetter,
  selectedTemplate,
  handleGenerateCoverLetter,
  handleDownloadCoverLetterPDF,
  showToast,
}) => {
  const editableRef = useRef<HTMLDivElement>(null);

  // Sync state into contentEditable innerHTML ONLY when the document is first generated
  // or regenerated to prevent cursor jumping issues during active editing.
  useEffect(() => {
    if (editableRef.current && coverLetter) {
      // Check if the current visible HTML matches the cover letter HTML.
      // If coverLetter contains markdown formatting, we render it via renderCV.
      const isHtml = coverLetter.trim().startsWith("<") || coverLetter.includes("</p>") || coverLetter.includes("<br>") || coverLetter.includes("</strong>") || coverLetter.includes("</b>");
      const targetHtml = isHtml ? coverLetter : renderCV(coverLetter);

      if (editableRef.current.innerHTML !== targetHtml) {
        editableRef.current.innerHTML = targetHtml;
      }
    }
  }, [coverLetter, loadingCoverLetter]);

  const handleCommand = (command: string) => {
    document.execCommand(command, false, undefined);
    // Trigger state sync after formatting
    if (editableRef.current) {
      setCoverLetter(editableRef.current.innerHTML);
    }
  };

  return (
    <div className="w-full min-h-[600px] p-6 bg-slate-50 flex flex-col gap-4 relative">
      {/* Control Panel for Cover Letter & Email generation */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-2xl border border-[var(--border)] shadow-xs justify-between items-stretch lg:items-end z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto flex-1">
          {/* Format Selection */}
          <div className="flex flex-col gap-1 text-left w-full">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pilih Format Dokumen</label>
            <select
              value={coverLetterFormat}
              onChange={(e) => setCoverLetterFormat(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 sm:py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold w-full"
            >
              <option value="cover_letter">Cover Letter (Surat Lamaran)</option>
              <option value="body_email_1">Body Email (Formal & Lampiran)</option>
              <option value="body_email_2">Body Email (Tonjolkan Prestasi)</option>
            </select>
          </div>

          {/* Language Selection */}
          <div className="flex flex-col gap-1 text-left w-full">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bahasa</label>
            <select
              value={coverLetterLang}
              onChange={(e) => setCoverLetterLang(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 sm:py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold w-full"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Tone Selection */}
          <div className="flex flex-col gap-1 text-left w-full">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Gaya Bahasa (Tone)</label>
            <select
              value={coverLetterTone}
              onChange={(e) => setCoverLetterTone(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 sm:py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold w-full"
            >
              <option value="formal">Formal & Sopan (Formal)</option>
              <option value="confident">Percaya Diri & Sukses (Confident)</option>
              <option value="collaborative">Kerja Sama & Antusias (Collaborative)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          disabled={loadingCoverLetter || !cvText || !jobDescription}
          onClick={() => handleGenerateCoverLetter()}
          className="w-full lg:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 h-[38px] lg:h-[34px] shrink-0 lg:mb-[1px]"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {coverLetterFormat.startsWith("body_email") ? "AI Generated Body Email" : "AI Generated Cover Letter"}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={async () => {
                  const success = await copyRichText(coverLetter);
                  if (success) {
                    showToast(coverLetterFormat.startsWith("body_email") ? "Email copied to clipboard with styles!" : "Cover letter copied to clipboard with styles!", "success");
                  } else {
                    showToast("Failed to copy text.", "error");
                  }
                }}
                className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 text-[9px] font-bold uppercase bg-indigo-50 border border-indigo-150/40 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer transition-all"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Copy to Clipboard
              </button>
              {!coverLetterFormat.startsWith("body_email") && (
                <button
                  onClick={handleDownloadCoverLetterPDF}
                  className="flex-1 sm:flex-initial text-center justify-center px-3 py-1.5 text-[9px] font-bold uppercase bg-emerald-50 border border-emerald-150/40 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  <FileArrowDown weight="bold" className="w-3.5 h-3.5" /> Download PDF
                </button>
              )}
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs w-full sm:w-max self-start mb-1">
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200">
              <button
                type="button"
                onClick={() => handleCommand("bold")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Tebalkan Teks (Bold)"
              >
                <TextB weight="bold" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand("italic")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Miringkan Teks (Italic)"
              >
                <TextItalic weight="bold" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand("underline")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Garis Bawah (Underline)"
              >
                <TextUnderline weight="bold" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 px-1.5 border-r border-slate-200">
              <button
                type="button"
                onClick={() => handleCommand("justifyLeft")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Rata Kiri"
              >
                <TextAlignLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand("justifyCenter")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Rata Tengah"
              >
                <TextAlignCenter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand("justifyRight")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Rata Kanan"
              >
                <TextAlignRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 px-1.5 border-r border-slate-200">
              <button
                type="button"
                onClick={() => handleCommand("insertUnorderedList")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Bullet List"
              >
                <ListBullets className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCommand("insertOrderedList")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Numbered List"
              >
                <ListNumbers className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCommand("removeFormat")}
              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 active:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer ml-auto sm:ml-0"
              title="Hapus Format (Clear Formatting)"
            >
              <Broom className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex flex-col items-center gap-2 py-4 bg-slate-100 overflow-x-auto max-h-[650px] rounded-xl border relative">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">💡 Klik pada kertas di bawah untuk mengedit & memformat secara langsung</span>
            <div className="relative w-full max-w-[794px]">
              <div
                ref={editableRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  setCoverLetter(e.currentTarget.innerHTML);
                }}
                className="bg-white shadow-md p-6 sm:p-8 text-slate-800 text-left w-full focus:outline-none border border-transparent focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xs relative z-10"
                style={{
                  minHeight: coverLetterFormat.startsWith("body_email") ? "auto" : "1123px",
                  fontFamily: selectedTemplate === "serif" ? "'Times New Roman','Garamond',serif" : selectedTemplate === "sans" ? "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif" : "'Calibri',sans-serif",
                  fontSize: "10.5pt",
                  lineHeight: 1.6,
                  color: "#222",
                  whiteSpace: "pre-wrap",
                }}
              />
              {/* Visual Page Break Guides (Dashed line overlay showing where PDF pages split) */}
              {!coverLetterFormat.startsWith("body_email") && (
                <>
                  <div className="absolute left-0 right-0 border-t-2 border-dashed border-slate-350 pointer-events-none z-20" style={{ top: '1123px' }}>
                    <span className="absolute right-4 -top-2.5 bg-slate-100 text-[8px] font-extrabold text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-widest shadow-3xs" style={{ fontFamily: 'var(--font-jakarta)' }}>Batas Halaman 1 / 2 (PDF)</span>
                  </div>
                  <div className="absolute left-0 right-0 border-t-2 border-dashed border-slate-350 pointer-events-none z-20" style={{ top: '2246px' }}>
                    <span className="absolute right-4 -top-2.5 bg-slate-100 text-[8px] font-extrabold text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-widest shadow-3xs" style={{ fontFamily: 'var(--font-jakarta)' }}>Batas Halaman 2 / 3 (PDF)</span>
                  </div>
                </>
              )}
            </div>
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
