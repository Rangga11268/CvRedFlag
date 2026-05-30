import React from "react";
import {
  Sparkle,
  ArrowCounterClockwise,
  ArrowClockwise,
  CheckCircle,
  CaretRight,
  Info,
  TextB,
  TextItalic,
  Trash,
  MagicWand
} from "@phosphor-icons/react";
import { sectionsConfig } from "../utils/cvHelpers";

interface VisualEditorProps {
  editableCV: string;
  cvText: string;
  editorMode: "visual" | "raw";
  setEditorMode: (mode: "visual" | "raw") => void;
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
  parsedSections: Record<string, string>;
  handleSectionChange: (sectionKey: string, newContent: string, immediate?: boolean) => void;
  updateCV: (newText: string, immediate?: boolean) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  historyIndex: number;
  history: string[];
  hasDraft: boolean;
  handleRestoreDraft: () => void;
  handleClearDraft: () => void;
  handleDownloadPDF: () => void;
}

const VisualEditor: React.FC<VisualEditorProps> = ({
  editableCV,
  cvText,
  editorMode,
  setEditorMode,
  expandedSection,
  setExpandedSection,
  parsedSections,
  handleSectionChange,
  updateCV,
  handleUndo,
  handleRedo,
  historyIndex,
  history,
  hasDraft,
  handleRestoreDraft,
  handleClearDraft,
  handleDownloadPDF,
}) => {
  const applyFormatting = (key: string, format: "bold" | "italic") => {
    const textarea = document.querySelector(`textarea[data-section="${key}"]`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let replacement = "";
    let cursorOffset = 0;
    let selectionLength = 0;

    if (format === "bold") {
      replacement = `**${selectedText || "Tebal"}**`;
      cursorOffset = 2;
      selectionLength = selectedText ? selectedText.length : 5;
    } else if (format === "italic") {
      replacement = `*${selectedText || "Miring"}*`;
      cursorOffset = 1;
      selectionLength = selectedText ? selectedText.length : 6;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    handleSectionChange(key, newValue, true);

    // Refocus and select
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selectionLength);
    }, 50);
  };

  return (
    <div className="flex flex-col w-full min-h-[500px]">
      {/* Simplified Toolbar Header */}
      <div className="no-print p-2 px-3 sm:p-3 sm:px-4 border-b text-[11px] flex items-center justify-between font-medium bg-slate-50/80 text-slate-800 border-[var(--border)] gap-2">
        {/* Left Side: Undo / Redo Buttons */}
        <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg border border-slate-200/30">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 px-2 rounded-md text-[10px] font-bold tracking-wide transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-slate-650 hover:bg-white disabled:hover:bg-transparent"
            title="Kembalikan perubahan terakhir (Ctrl+Z)"
          >
            <ArrowCounterClockwise weight="bold" className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Undo</span>
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 px-2 rounded-md text-[10px] font-bold tracking-wide transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-slate-650 hover:bg-white disabled:hover:bg-transparent"
            title="Ulangi perubahan yang dibatalkan (Ctrl+Y)"
          >
            <ArrowClockwise weight="bold" className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Redo</span>
          </button>
        </div>

        {/* Right Side: Segmented Control Toggle */}
        <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg border border-slate-200/30">
          <button
            type="button"
            onClick={() => setEditorMode("visual")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all flex items-center gap-1 cursor-pointer ${
              editorMode === "visual"
                ? "bg-white text-indigo-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkle weight="bold" className="w-3 h-3" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("raw")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all flex items-center gap-1 cursor-pointer ${
              editorMode === "raw"
                ? "bg-white text-indigo-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MagicWand weight="bold" className="w-3 h-3" />
            <span>Markdown</span>
          </button>
        </div>
      </div>

      {hasDraft && (
        <div className="no-print mx-5 mt-3 p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-medium text-amber-800 animate-fade-in shadow-3xs">
          <span className="flex items-center gap-2">
            <Info weight="fill" className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Draf perubahan pengeditan CV sebelumnya terdeteksi. Apakah Anda ingin memulihkannya?</span>
          </span>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer font-sans text-[10px]"
            >
              Pulihkan Draf
            </button>
            <button
              type="button"
              onClick={handleClearDraft}
              className="px-2 py-1 rounded hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer font-sans text-[10px]"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {editorMode === "raw" ? (
        <textarea
          value={editableCV}
          onChange={(e) => updateCV(e.target.value, false)}
          className="w-full flex-1 p-5 text-xs leading-relaxed focus:outline-none resize-none min-h-[500px]"
          style={{ background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', border: 'none' }}
          placeholder="Ketik CV Anda di sini dalam format Markdown..."
        />
      ) : (
        <div className="flex flex-col gap-3.5 p-5 bg-slate-50/50 max-h-[600px] overflow-y-auto">
          {sectionsConfig.map((sec) => {
            const IconComponent = sec.icon;
            const sectionContent = (parsedSections[sec.key] || "").trim();
            const isExpanded = expandedSection === sec.key;
            const isFilled = sectionContent.length > 0;
            
            return (
              <div 
                key={sec.key} 
                id={`section-card-${sec.key}`}
                className={`border rounded-xl transition-all duration-200 bg-white ${
                  isExpanded 
                    ? "border-indigo-200 shadow-sm" 
                    : "border-[var(--border)] hover:border-slate-300 shadow-3xs"
                }`}
              >
                {/* Card Header */}
                <div 
                  onClick={() => setExpandedSection(isExpanded ? null : sec.key)}
                  className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      isExpanded 
                        ? "bg-indigo-50 text-indigo-600" 
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      <IconComponent weight={isExpanded ? "fill" : "bold"} className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${
                        isExpanded ? "text-indigo-600" : "text-slate-700"
                      }`}>
                        {sec.title}
                      </span>
                      {!isExpanded && (
                        <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[280px] sm:max-w-[400px]">
                          {isFilled ? sectionContent : sec.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isFilled ? (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <CheckCircle weight="fill" className="w-2.5 h-2.5" />
                        Terisi
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        Kosong
                      </span>
                    )}
                    <CaretRight 
                      weight="bold" 
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-90 text-indigo-500" : ""
                      }`} 
                    />
                  </div>
                </div>

                {/* Card Content (Accordion Body) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 animate-fade-in flex flex-col gap-2.5">
                    <p className="text-[11px] text-slate-500 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {sec.description}
                    </p>
                    <div className="relative">
                      <textarea
                        data-section={sec.key}
                        value={parsedSections[sec.key] || ""}
                        onChange={(e) => handleSectionChange(sec.key, e.target.value, false)}
                        placeholder={sec.placeholder}
                        className="w-full min-h-[140px] max-h-[300px] p-3 pb-12 text-xs leading-relaxed rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 text-slate-700 resize-y"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      />
                      {/* Action toolbar inside the textarea container */}
                      <div className="absolute left-2.5 bottom-2.5 right-2.5 flex items-center justify-between bg-white/95 px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-3xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Bold & Italic */}
                          <button
                            type="button"
                            onClick={() => applyFormatting(sec.key, "bold")}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors flex items-center justify-center cursor-pointer"
                            title="Tebalkan (Bold) - **Teks**"
                          >
                            <TextB weight="bold" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => applyFormatting(sec.key, "italic")}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-105 rounded transition-colors flex items-center justify-center cursor-pointer"
                            title="Miringkan (Italic) - *Teks*"
                          >
                            <TextItalic weight="bold" className="w-3.5 h-3.5" />
                          </button>

                          {sec.key !== "header" && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus/mengosongkan bagian "${sec.title}"? Bagian ini tidak akan tampil di pratinjau dan cetak PDF.`)) {
                                  handleSectionChange(sec.key, "", true);
                                }
                              }}
                              className="text-[9px] font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded border border-red-100 transition-colors flex items-center gap-1 cursor-pointer font-sans"
                              title="Hapus atau Kosongkan Seksi Ini"
                            >
                              <Trash weight="fill" className="w-3 h-3 text-red-650" />
                              <span>Hapus Seksi</span>
                            </button>
                          )}

                          {["experience", "projects", "skills", "education", "certifications"].includes(sec.key) && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentVal = parsedSections[sec.key] || "";
                                const newVal = currentVal + (currentVal ? "\n" : "") + "* ";
                                handleSectionChange(sec.key, newVal, true);
                              }}
                              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-100 transition-colors flex items-center gap-1 cursor-pointer font-sans"
                            >
                              <span>+ Poin Daftar (Bullet)</span>
                            </button>
                          )}
                          {sec.key === "experience" && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentVal = parsedSections[sec.key] || "";
                                const newVal = currentVal + (currentVal ? "\n" : "") + "### Jabatan | Nama Perusahaan (Bulan Tahun - Bulan Tahun)\n* Tanggung jawab utama atau pencapaian kerja...";
                                handleSectionChange(sec.key, newVal, true);
                              }}
                              className="text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer font-sans"
                            >
                              <span>+ Kerja Baru</span>
                            </button>
                          )}
                          {sec.key === "projects" && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentVal = parsedSections[sec.key] || "";
                                const newVal = currentVal + (currentVal ? "\n" : "") + "### Nama Proyek | Teknologi Yang Digunakan\n* Deskripsi proyek, peran Anda, dan hasil...";
                                handleSectionChange(sec.key, newVal, true);
                              }}
                              className="text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer font-sans"
                            >
                              <span>+ Proyek Baru</span>
                            </button>
                          )}
                          {sec.key === "education" && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentVal = parsedSections[sec.key] || "";
                                const newVal = currentVal + (currentVal ? "\n" : "") + "### Gelar / Jurusan | Nama Universitas (Tahun Mulai - Tahun Selesai)\n* IPK: X.XX / 4.00\n* Deskripsi singkat atau pencapaian...";
                                handleSectionChange(sec.key, newVal, true);
                              }}
                              className="text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer font-sans"
                            >
                              <span>+ Pendidikan</span>
                            </button>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {(parsedSections[sec.key] || "").length} Karakter
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VisualEditor;
