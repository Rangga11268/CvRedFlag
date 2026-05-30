"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  WarningCircle,
  CheckCircle,
  Info,
  X,
  ArrowClockwise,
} from "@phosphor-icons/react";

// Component imports
import InitialSplash from "./components/InitialSplash";
import StepTracker from "./components/StepTracker";
import VisualEditor from "./components/VisualEditor";
import A4Preview from "./components/A4Preview";
import DiffViewPanel from "./components/DiffViewPanel";
import CoverLetterPanel from "./components/CoverLetterPanel";
import CopilotPanel from "./components/CopilotPanel";

import WorkshopHeader from "./components/WorkshopHeader";
import UploadPage from "./components/UploadPage";
import ATSAnalyzerPanel from "./components/ATSAnalyzerPanel";
import CVControlsBar from "./components/CVControlsBar";

// Custom Hooks
import { useToast } from "./hooks/useToast";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { usePagePreview } from "./hooks/usePagePreview";
import { usePDFExport } from "./hooks/usePDFExport";
import { useCVAnalysis } from "./hooks/useCVAnalysis";

// Utils
import {
  parseMarkdownToSections,
  formatRawTextToMarkdown,
} from "./utils/cvHelpers";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [cvText, setCvText] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isJdParsing, setIsJdParsing] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"preview" | "raw" | "diff" | "coverletter">("preview");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [coverLetterLang, setCoverLetterLang] = useState<"id" | "en">("id");
  const [coverLetterFormat, setCoverLetterFormat] = useState<"cover_letter" | "body_email_1" | "body_email_2">("cover_letter");
  const [coverLetterTone, setCoverLetterTone] = useState<"formal" | "confident" | "collaborative">("formal");
  const [loadingCoverLetter, setLoadingCoverLetter] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"serif" | "sans" | "compact">("serif");
  const [forceSinglePage, setForceSinglePage] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [editorMode, setEditorMode] = useState<"visual" | "raw">("visual");
  const [expandedSection, setExpandedSection] = useState<string | null>("header");
  const [showFinishAlert, setShowFinishAlert] = useState<boolean>(false);

  const { toasts, showToast, removeToast } = useToast();

  const {
    editableCV,
    setEditableCV,
    history,
    historyIndex,
    hasDraft,
    updateCV,
    handleUndo,
    handleRedo,
    handleRestoreDraft,
    handleClearDraft,
  } = useUndoRedo(cvText, activeTab, showToast);

  const {
    loading,
    loadingMsg,
    step1Result,
    setStep1Result,
    step2Result,
    setStep2Result,
    step3Result,
    setStep3Result,
    currentStep,
    setCurrentStep,
    jobCategory,
    setJobCategory,
    cvLanguage,
    setCvLanguage,
    selectedKeyword,
    setSelectedKeyword,
    keywordSuggestion,
    loadingKeywordSuggestion,
    scoreHistory,
    setScoreHistory,
    runAnalysisStep,
    handleReoptimize,
    handleRecompile,
    handleKeywordClick,
    handleReset: analysisReset,
  } = useCVAnalysis({
    cvText,
    jobDescription,
    editableCV,
    setEditableCV,
    showToast,
  });

  const {
    canvasHeight,
    previewScale,
    activePage,
    pdfUrl,
    pdfPreviewRef,
    measureRef,
    previewWrapperRef,
    pageCount,
    isMultiPage,
    topPx,
    horizPx,
    handlePageChange,
  } = usePagePreview({
    editableCV,
    cvText,
    selectedTemplate,
    forceSinglePage,
    currentStep,
    activeTab,
    pdfFile,
  });

  const { handleDownloadPDF, handleDownloadCoverLetterPDF } = usePDFExport({
    editableCV,
    cvText,
    coverLetter,
    selectedTemplate,
    forceSinglePage,
    pdfFile,
    showToast,
  });

  // Smooth scroll to active section card
  useEffect(() => {
    if (expandedSection && editorMode === "visual" && activeTab === "raw") {
      const timer = setTimeout(() => {
        const activeEl = document.getElementById(`section-card-${expandedSection}`);
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [expandedSection, editorMode, activeTab]);

  // Load backup from localStorage or pre-filled data from sessionStorage if redirected from landing page
  useEffect(() => {
    let hasSessionData = false;
    if (typeof window !== "undefined") {
      const storedCvText = sessionStorage.getItem("cvText");
      const storedJd = sessionStorage.getItem("jobDescription");
      const storedFileName = sessionStorage.getItem("fileName");
      
      if (storedCvText) {
        setCvText(storedCvText);
        setEditableCV(storedCvText);
        hasSessionData = true;
      }
      if (storedJd) {
        setJobDescription(storedJd);
        hasSessionData = true;
      }
      if (storedFileName) {
        setPdfFile(new File([], storedFileName, { type: "application/pdf" }));
      }
      
      if (storedCvText && storedJd) {
        runAnalysisStep(1, storedCvText);
      }
      
      sessionStorage.removeItem("cvText");
      sessionStorage.removeItem("jobDescription");
      sessionStorage.removeItem("fileName");

      // Only load localStorage backup if we don't have fresh sessionStorage upload
      if (!hasSessionData) {
        try {
          const saved = localStorage.getItem("cv_redflag_workshop_backup");
          if (saved) {
            const backup = JSON.parse(saved);
            if (backup.cvText) setCvText(backup.cvText);
            if (backup.editableCV) setEditableCV(backup.editableCV);
            if (backup.jobDescription) setJobDescription(backup.jobDescription);
            if (backup.selectedTemplate) setSelectedTemplate(backup.selectedTemplate);
            if (backup.coverLetter) setCoverLetter(backup.coverLetter);
            if (backup.coverLetterLang) setCoverLetterLang(backup.coverLetterLang);
            if (backup.coverLetterFormat) setCoverLetterFormat(backup.coverLetterFormat);
            if (backup.coverLetterTone) setCoverLetterTone(backup.coverLetterTone);
            if (backup.forceSinglePage) setForceSinglePage(backup.forceSinglePage);
            if (backup.activeTab) setActiveTab(backup.activeTab);
            if (backup.currentStep) setCurrentStep(backup.currentStep);
            if (backup.scoreHistory) setScoreHistory(backup.scoreHistory);
            if (backup.jobCategory) setJobCategory(backup.jobCategory);
            if (backup.cvLanguage) setCvLanguage(backup.cvLanguage);
            if (backup.step1Result) setStep1Result(backup.step1Result);
            if (backup.step2Result) setStep2Result(backup.step2Result);
            if (backup.step3Result) setStep3Result(backup.step3Result);
          }
        } catch (err) {
          console.warn("Failed to restore local workshop backup:", err);
        }
      }
    }

    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Auto-save state changes to localStorage
  useEffect(() => {
    if (isInitializing) return;
    try {
      const backup = {
        cvText,
        editableCV,
        jobDescription,
        selectedTemplate,
        coverLetter,
        coverLetterLang,
        coverLetterFormat,
        coverLetterTone,
        forceSinglePage,
        activeTab,
        currentStep,
        scoreHistory,
        jobCategory,
        cvLanguage,
        step1Result,
        step2Result,
        step3Result,
      };
      localStorage.setItem("cv_redflag_workshop_backup", JSON.stringify(backup));
    } catch (err) {
      console.warn("Failed to auto-save local workshop backup:", err);
    }
  }, [
    isInitializing,
    cvText,
    editableCV,
    jobDescription,
    selectedTemplate,
    coverLetter,
    coverLetterLang,
    coverLetterFormat,
    coverLetterTone,
    forceSinglePage,
    activeTab,
    currentStep,
    scoreHistory,
    jobCategory,
    cvLanguage,
    step1Result,
    step2Result,
    step3Result,
  ]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please upload a valid PDF file.", "error");
      return;
    }

    setPdfFile(file);
    setIsParsing(true);
    analysisReset();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to extract PDF text");
      }
      const data = await res.json();
      setCvText(data.text);
      setEditableCV(data.text);
      showToast(`CV extracted successfully! (${data.numPages} page${data.numPages > 1 ? "s" : ""})`, "success");
    } catch (err: any) {
      showToast(err.message || "Error reading PDF file.", "error");
      setPdfFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleJdPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsJdParsing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to extract JD PDF text");
      }
      const data = await res.json();
      setJobDescription(data.text);
      showToast("Job description extracted!", "success");
    } catch (err: any) {
      showToast(err.message || "Error reading JD PDF file.", "error");
    } finally {
      setIsJdParsing(false);
    }
  };

  const handleGenerateCoverLetter = async (
    lang?: "id" | "en",
    fmt?: "cover_letter" | "body_email_1" | "body_email_2",
    tOption?: "formal" | "confident" | "collaborative"
  ) => {
    setLoadingCoverLetter(true);
    const requestLang = lang || coverLetterLang;
    const requestFmt = fmt || coverLetterFormat;
    const requestTone = tOption || coverLetterTone;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 5,
          cvText: editableCV || cvText,
          jobDescription,
          language: requestLang,
          format: requestFmt,
          jobCategory,
          tone: requestTone,
        })
      });
      if (!res.ok) throw new Error("Failed to generate cover letter");
      const data = await res.json();
      setCoverLetter(data.result);
      showToast(requestFmt.startsWith("body_email") ? "Body Email generated successfully!" : "Cover Letter generated successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to generate Cover Letter/Email", "error");
    } finally {
      setLoadingCoverLetter(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setJobDescription("");
    setCvText("");
    setEditableCV("");
    setCoverLetter("");
    setForceSinglePage(false);
    analysisReset();
    try {
      localStorage.removeItem("cv_redflag_workshop_backup");
    } catch (e) {}
  };

  const handleSectionChange = (sectionKey: string, newContent: string, immediate: boolean = false) => {
    const currentSections = parseMarkdownToSections(editableCV || cvText);
    currentSections[sectionKey] = newContent;
    
    let md = "";
    
    if (currentSections.header) {
      md += currentSections.header + "\n\n";
    }

    const getOriginalHeading = (key: string) => {
      const lines = (editableCV || cvText).split("\n");
      for (const line of lines) {
        if (line.startsWith("##")) {
          const trimmed = line.trim();
          const heading = trimmed.toLowerCase();
          if (key === "summary" && (heading.includes("summary") || heading.includes("tentang saya") || heading.includes("ringkasan"))) return trimmed;
          if (key === "skills" && (heading.includes("skill") || heading.includes("keahlian") || heading.includes("kemampuan"))) return trimmed;
          if (key === "experience" && (heading.includes("experience") || heading.includes("kerja") || heading.includes("magang") || heading.includes("employment"))) return trimmed;
          if (key === "projects" && (heading.includes("project") || heading.includes("proyek"))) return trimmed;
          if (key === "education" && (heading.includes("education") || heading.includes("pendidikan"))) return trimmed;
          if (key === "certifications" && (heading.includes("cert") || heading.includes("sertifikasi") || heading.includes("prestasi"))) return trimmed;
        }
      }
      
      const isIndo = cvLanguage === "id" || (cvLanguage === "auto" && (editableCV || cvText).toLowerCase().includes("pengalaman"));
      if (key === "summary") return isIndo ? "## TENTANG SAYA" : "## PROFESSIONAL SUMMARY";
      if (key === "skills") return isIndo ? "## KEAHLIAN TEKNIS" : "## TECHNICAL SKILLS";
      if (key === "experience") return isIndo ? "## PENGALAMAN KERJA" : "## WORK EXPERIENCE";
      if (key === "projects") return isIndo ? "## PROYEK UTAMA" : "## PROJECTS";
      if (key === "education") return isIndo ? "## PENDIDIKAN" : "## EDUCATION";
      if (key === "certifications") return isIndo ? "## SERTIFIKASI" : "## CERTIFICATIONS";
      return "";
    };

    const keys = ["summary", "skills", "experience", "projects", "education", "certifications"];
    for (const key of keys) {
      if (currentSections[key] !== undefined && currentSections[key].trim() !== "") {
        const heading = getOriginalHeading(key);
        md += heading + "\n" + currentSections[key] + "\n\n";
      }
    }

    updateCV(md.trim(), immediate);
  };

  const parsedSections = parseMarkdownToSections(editableCV || cvText);

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] flex flex-col selection:bg-indigo-500/10 selection:text-indigo-900" style={{ color: 'var(--text-primary)', fontFamily: "var(--font-inter,'Inter',system-ui,sans-serif)" }}>
      {/* ── Initial Splash Screen Loader ───────────────────────── */}
      <InitialSplash isInitializing={isInitializing} />

      {/* ── Toast Notifications ─────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl border min-w-[280px] max-w-[380px] backdrop-blur-xl ${
                toast.type === "error"
                  ? "bg-white/95 border-red-200 text-red-950 shadow-red-100/10"
                  : toast.type === "success"
                  ? "bg-white/95 border-emerald-200 text-emerald-950 shadow-emerald-100/10"
                  : "bg-white/95 border-indigo-200 text-slate-900 shadow-indigo-100/10"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "error" ? (
                  <WarningCircle weight="fill" className="w-4 h-4 text-red-600" />
                ) : toast.type === "success" ? (
                  <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Info weight="fill" className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <p className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
              >
                <X weight="bold" className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Sticky Header ───────────────────────────────────────── */}
      <WorkshopHeader
        pdfFile={pdfFile}
        currentStep={currentStep}
        handleReset={handleReset}
        handleDownloadPDF={handleDownloadPDF}
        onFinishClick={() => setShowFinishAlert(true)}
      />

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">

        {/* ── Progress Stepper ────────────────────────────────────── */}
        <StepTracker currentStep={currentStep} />

         {/* ── Full-screen loading overlay for step 0 → 1 transition ── */}
        <AnimatePresence>
          {loading && currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/98"
            >
              <div className="relative flex flex-col items-center mb-6">
                <svg className="animate-spin h-12 w-12 text-[var(--accent)] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-12" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>

              <motion.p
                key={loadingMsg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-center px-8 mb-2"
                style={{ fontFamily: 'var(--font-jakarta)', color: 'var(--text-primary)' }}
              >
                {loadingMsg || "Analyzing your CV..."}
              </motion.p>
              <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Powered by AI · Please wait</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 0 — Landing / Upload */}
        {currentStep === 0 && (
          <UploadPage
            cvText={cvText}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            pdfFile={pdfFile}
            isParsing={isParsing}
            isJdParsing={isJdParsing}
            loading={loading}
            handlePdfUpload={handlePdfUpload}
            handleJdPdfUpload={handleJdPdfUpload}
            runAnalysisStep={runAnalysisStep}
          />
        )}

        {/* ACTIVE WORKSPACE — Responsive 3-Column Layout */}
        {currentStep >= 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6 items-start">

            {/* COL 1 — ATS Analyzer (left sidebar) */}
            <ATSAnalyzerPanel
              step1Result={step1Result}
              scoreHistory={scoreHistory}
              selectedKeyword={selectedKeyword}
              keywordSuggestion={keywordSuggestion}
              loadingKeywordSuggestion={loadingKeywordSuggestion}
              jobDescription={jobDescription}
              currentCvText={editableCV || cvText}
              setJobDescription={setJobDescription}
              onKeywordClick={handleKeywordClick}
              setSelectedKeyword={setSelectedKeyword}
            />

            {/* COL 2 — CV Preview (center, takes priority on all screen sizes) */}
            <div className="lg:col-span-8 xl:col-span-5 order-first lg:order-none flex flex-col gap-3 min-w-0">

              <div className="flex flex-col rounded-xl p-3 gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {/* Row 1: Navigation Tabs & Score Badge */}
                <div className="flex items-center justify-between gap-3 border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 flex-1">
                    {(["preview", "raw", "diff", "coverletter"] as const).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                          activeTab === tab
                            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-3xs"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {tab === "preview" ? "A4 Preview" : tab === "raw" ? "Editor CV" : tab === "diff" ? "Diff View" : "Cover Letter"}
                      </button>
                    ))}
                  </div>
                  {step1Result && (
                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-bold shadow-3xs bg-indigo-50 border-indigo-100 text-indigo-700" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      <span>Score:</span>
                      <span className="text-xs font-extrabold">{step1Result.score}%</span>
                    </div>
                  )}
                </div>

                {/* Row 2: CV Configuration Controls */}
                {activeTab === "preview" && (
                  <CVControlsBar
                    currentStep={currentStep}
                    jobCategory={jobCategory}
                    cvLanguage={cvLanguage}
                    selectedTemplate={selectedTemplate}
                    forceSinglePage={forceSinglePage}
                    onJobCategoryChange={setJobCategory}
                    onCvLanguageChange={setCvLanguage}
                    onTemplateChange={setSelectedTemplate}
                    onForceSinglePageChange={setForceSinglePage}
                    handleRecompile={handleRecompile}
                  />
                )}
              </div>

              <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <AnimatePresence>
                  {loading && activeTab !== "coverletter" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="no-print absolute inset-0 z-40 flex flex-col items-center justify-center p-8 text-center rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.95)' }}
                    >
                      <ArrowClockwise weight="bold" className="w-7 h-7 animate-spin mb-4" style={{ color: 'var(--accent)' }} />
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}>{loadingMsg || "Processing..."}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {activeTab === "raw" ? (
                  <VisualEditor
                    editableCV={editableCV}
                    cvText={cvText}
                    editorMode={editorMode}
                    setEditorMode={setEditorMode}
                    expandedSection={expandedSection}
                    setExpandedSection={setExpandedSection}
                    parsedSections={parsedSections}
                    handleSectionChange={handleSectionChange}
                    updateCV={updateCV}
                    handleUndo={handleUndo}
                    handleRedo={handleRedo}
                    historyIndex={historyIndex}
                    history={history}
                    hasDraft={hasDraft}
                    handleRestoreDraft={handleRestoreDraft}
                    handleClearDraft={handleClearDraft}
                    handleDownloadPDF={handleDownloadPDF}
                  />
                ) : activeTab === "diff" ? (
                  <DiffViewPanel
                    cvText={cvText}
                    editableCV={editableCV}
                    step1Result={step1Result}
                  />
                ) : activeTab === "coverletter" ? (
                  <CoverLetterPanel
                    coverLetterFormat={coverLetterFormat}
                    setCoverLetterFormat={setCoverLetterFormat}
                    coverLetterLang={coverLetterLang}
                    setCoverLetterLang={setCoverLetterLang}
                    coverLetterTone={coverLetterTone}
                    setCoverLetterTone={setCoverLetterTone}
                    loadingCoverLetter={loadingCoverLetter}
                    cvText={cvText}
                    jobDescription={jobDescription}
                    coverLetter={coverLetter}
                    setCoverLetter={setCoverLetter}
                    selectedTemplate={selectedTemplate}
                    handleGenerateCoverLetter={handleGenerateCoverLetter}
                    handleDownloadCoverLetterPDF={handleDownloadCoverLetterPDF}
                    showToast={showToast}
                  />
                ) : (
                  <A4Preview
                    currentStep={currentStep}
                    isMultiPage={isMultiPage}
                    activePage={activePage}
                    pageCount={pageCount}
                    previewScale={previewScale}
                    selectedTemplate={selectedTemplate}
                    forceSinglePage={forceSinglePage}
                    topPx={topPx}
                    horizPx={horizPx}
                    cvText={cvText}
                    editableCV={editableCV}
                    previewWrapperRef={previewWrapperRef}
                    pdfPreviewRef={pdfPreviewRef}
                    measureRef={measureRef}
                    handlePageChange={handlePageChange}
                  />
                )}
              </div>
            </div>

            {/* COL 3 — AI Copilot (right sidebar) */}
            <CopilotPanel
              currentStep={currentStep}
              loading={loading}
              runAnalysisStep={runAnalysisStep}
              step2Result={step2Result}
              cvText={cvText}
              editableCV={editableCV}
              handleReoptimize={handleReoptimize}
              handleDownloadPDF={handleDownloadPDF}
            />

          </div>
        )}

      </div>

      {/* ── Custom Finish Alert Modal ────────────────────────────── */}
      <AnimatePresence>
        {showFinishAlert && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFinishAlert(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Modal Alert Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden relative z-10 flex flex-col p-6 text-center"
            >
              {/* Animated Celebration Icon */}
              <div className="mx-auto w-14 h-14 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center mb-4">
                <CheckCircle weight="fill" className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h3 className="text-base font-extrabold text-slate-800 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Sesi Selesai! 🎉
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Selamat! CV Anda telah berhasil dioptimalkan menjadi ATS-friendly. Semoga sukses melamar pekerjaan impian Anda!
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowFinishAlert(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer text-center"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  Tetap di Sini
                </button>
                <button
                  onClick={() => { window.location.href = "/"; }}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer text-center"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  Kembali ke Beranda
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
