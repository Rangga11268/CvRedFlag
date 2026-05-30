import React from "react";
import { PencilSimple, FileText } from "@phosphor-icons/react";
import { renderCV, formatRawTextToMarkdown } from "../utils/cvHelpers";

interface A4PreviewProps {
  currentStep: number;
  isMultiPage: boolean;
  activePage: number;
  pageCount: number;
  previewScale: number;
  selectedTemplate: "serif" | "sans" | "compact";
  forceSinglePage: boolean;
  topPx: number;
  horizPx: number;
  cvText: string;
  editableCV: string;
  previewWrapperRef: React.RefObject<HTMLDivElement | null>;
  pdfPreviewRef: React.RefObject<HTMLDivElement | null>;
  measureRef: React.RefObject<HTMLDivElement | null>;
  handlePageChange: (page: number) => void;
}

const A4Preview: React.FC<A4PreviewProps> = ({
  currentStep,
  isMultiPage,
  activePage,
  pageCount,
  previewScale,
  selectedTemplate,
  forceSinglePage,
  topPx,
  horizPx,
  cvText,
  editableCV,
  previewWrapperRef,
  pdfPreviewRef,
  measureRef,
  handlePageChange,
}) => {
  return (
    <div className="w-full flex flex-col">
      {currentStep === 3 && (
        <div className="no-print p-3 border-b text-[11px] flex items-center gap-2 font-medium" style={{ background: 'rgba(79,70,229,0.03)', borderColor: 'rgba(79,70,229,0.1)', color: 'var(--accent)' }}>
          <PencilSimple weight="bold" className="w-3 h-3 shrink-0" />
          <span>Pratinjau Format — Pindah ke <strong>Editor CV</strong> untuk mengedit, menambah, atau menempelkan pengalaman baru.</span>
        </div>
      )}
      {isMultiPage && (
        <div className="no-print p-3 border-b text-[11px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-medium bg-amber-50/50 border-amber-200/50 text-amber-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="leading-relaxed">CV Anda melebihi 1 halaman A4. Gunakan navigasi di bawah untuk melihat Halaman {activePage === 1 ? '2' : '1'}.</span>
          </div>
          <button
            type="button"
            onClick={() => handlePageChange(activePage === 1 ? 2 : 1)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all self-start sm:self-auto shrink-0 cursor-pointer"
          >
            Lihat Halaman {activePage === 1 ? '2' : '1'} →
          </button>
        </div>
      )}

      {/* Scaler wrapper — measured by ResizeObserver */}
      <div className="w-full relative">
        <div
          ref={previewWrapperRef}
          className="w-full overflow-hidden bg-slate-100 py-4 px-6 flex justify-center items-start relative"
          style={{ height: `${1123 * previewScale + 32}px` }}
        >
          <div
            style={{
              width: "794px",
              height: "1123px",
              transformOrigin: "top center",
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: `translateX(-50%) scale(${previewScale})`,
              overflow: "hidden",
            }}
          >
            {currentStep > 0 && cvText ? (
              <>
                {/* Sliding track containing separate page sheets and the columned text layer */}
                <div
                  style={{
                    display: "flex",
                    width: `${pageCount * 794}px`,
                    height: "1123px",
                    transform: `translateX(-${(activePage - 1) * 794}px)`,
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    position: "relative",
                  }}
                >
                  {/* Render page backgrounds */}
                  {Array.from({ length: pageCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white shadow-lg border border-slate-200"
                      style={{
                        width: "794px",
                        height: "1123px",
                        flexShrink: 0,
                      }}
                    />
                  ))}

                  {/* Column-flow text overlay */}
                  <div
                    ref={pdfPreviewRef}
                    className={`pdf-canvas cv-template-${selectedTemplate} ${forceSinglePage ? "cv-single-page" : ""}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: `${pageCount * 794}px`,
                      height: "1123px",
                      fontFamily: selectedTemplate === "serif" ? "'Times New Roman','Garamond',serif" : selectedTemplate === "sans" ? "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif" : "'Calibri',sans-serif",
                      fontSize: forceSinglePage ? "9pt" : "10pt",
                      lineHeight: forceSinglePage ? 1.2 : (selectedTemplate === "compact" ? 1.25 : 1.4),
                      paddingTop: `${topPx}px`,
                      paddingBottom: `${topPx}px`,
                      paddingLeft: `${horizPx}px`,
                      paddingRight: `${horizPx}px`,
                      color: "#111",
                      columnWidth: isMultiPage ? `${794 - 2 * horizPx}px` : "auto",
                      columnGap: isMultiPage ? `${2 * horizPx}px` : "0px",
                      columnFill: "auto",
                      background: "transparent",
                      border: "none",
                      boxShadow: "none",
                      borderRadius: 0,
                    }}
                    dangerouslySetInnerHTML={{ __html: renderCV(currentStep === 3 ? editableCV : formatRawTextToMarkdown(cvText)) }}
                  />
                </div>

                {/* Hidden offscreen measurement element to compute layout height correctly */}
                <div
                  ref={measureRef}
                  style={{
                    position: "absolute",
                    visibility: "hidden",
                    pointerEvents: "none",
                    width: "794px",
                    fontFamily: selectedTemplate === "serif" ? "'Times New Roman','Garamond',serif" : selectedTemplate === "sans" ? "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif" : "'Calibri',sans-serif",
                    fontSize: forceSinglePage ? "9pt" : "10pt",
                    lineHeight: forceSinglePage ? 1.2 : (selectedTemplate === "compact" ? 1.25 : 1.4),
                    paddingTop: `${topPx}px`,
                    paddingBottom: `${topPx}px`,
                    paddingLeft: `${horizPx}px`,
                    paddingRight: `${horizPx}px`,
                    boxSizing: "border-box",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderCV(currentStep === 3 ? editableCV : formatRawTextToMarkdown(cvText)) }}
                />
              </>
            ) : (
              <div
                className="pdf-canvas shadow-lg bg-white w-full h-full overflow-auto p-6 flex flex-col items-center justify-center text-center text-slate-400"
              >
                <FileText weight="thin" className="w-16 h-16 mb-2" />
                <p className="text-xs font-semibold">Silakan unggah CV untuk melihat pratinjau</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Page Navigator Controls */}
        {isMultiPage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-3 select-none">
            <button
              type="button"
              disabled={activePage === 1}
              onClick={() => handlePageChange(activePage - 1)}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-bold text-slate-700"
            >
              ←
            </button>
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Halaman {activePage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={activePage === pageCount}
              onClick={() => handlePageChange(activePage + 1)}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-bold text-slate-700"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default A4Preview;
