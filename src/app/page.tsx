"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadSimple,
  FileText,
  Briefcase,
  Warning,
  Tag,
  CheckCircle,
  ArrowClockwise,
  DownloadSimple,
  CaretRight,
  Eye,
  Info,
  PencilSimple,
  ArrowRight,
  Sparkle,
  Lightning,
  Crosshair,
  TrendUp,
  X,
  WarningCircle,
  MagicWand,
  Star,
  Rocket,
  SealCheck,
  FileArrowDown,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";


interface AnalysisResult {
  score: number;
  missingKeywords: string[];
  redFlags: string[];
}

interface Toast {
  id: number;
  type: "error" | "success" | "info";
  message: string;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

let toastId = 0;

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [cvText, setCvText] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isJdParsing, setIsJdParsing] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>("");

  const [step1Result, setStep1Result] = useState<AnalysisResult | null>(null);
  const [step2Result, setStep2Result] = useState<string>("");
  const [step3Result, setStep3Result] = useState<string>("");

  const [editableCV, setEditableCV] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  const [toasts, setToasts] = useState<Toast[]>([]);

  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Dynamically scale A4 canvas to fit its wrapper column.
  // Runs whenever step OR tab changes (ref remounts when switching tabs).
  useEffect(() => {
    if (activeTab !== "preview") return;
    // Small delay so the DOM has fully rendered before measuring
    const timer = setTimeout(() => {
      const wrapper = previewWrapperRef.current;
      if (!wrapper) return;
      const A4_WIDTH_PX = 794; // 210mm @ 96dpi
      const observer = new ResizeObserver(([entry]) => {
        const available = entry.contentRect.width - 8;
        setPreviewScale(Math.min(1, available / A4_WIDTH_PX));
      });
      observer.observe(wrapper);
      // Store ref to disconnect on cleanup
      (wrapper as any)._resizeObserver = observer;
    }, 50);
    return () => {
      clearTimeout(timer);
      const wrapper = previewWrapperRef.current;
      if (wrapper && (wrapper as any)._resizeObserver) {
        (wrapper as any)._resizeObserver.disconnect();
      }
    };
  }, [currentStep, activeTab]);

  const showToast = (message: string, type: Toast["type"] = "error") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please upload a valid PDF file.", "error");
      return;
    }

    setPdfFile(file);
    setIsParsing(true);
    setCurrentStep(0);

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

  const runAnalysisStep = async (stepNum: number, customCvText?: string) => {
    const textToAnalyze = customCvText || cvText;
    if (!textToAnalyze || !jobDescription) {
      showToast("Please upload your CV and fill in the Job Description first.", "info");
      return;
    }

    setLoading(true);
    if (stepNum === 1) setLoadingMsg(customCvText ? "Re-scanning optimized CV..." : "Scanning CV for critical red flags...");
    else if (stepNum === 2) setLoadingMsg("Applying Google XYZ Formula...");
    else if (stepNum === 3) setLoadingMsg("Sculpting ATS optimized structure...");

    try {
      const payload: any = { step: stepNum, cvText: textToAnalyze, jobDescription };
      if (stepNum === 2 && step1Result) {
        payload.missingKeywords = step1Result.missingKeywords;
        payload.redFlags = step1Result.redFlags;
      }
      if (stepNum === 3) payload.rewrittenExperience = step2Result;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed to contact AI");

      const data = await res.json();

      if (stepNum === 1) {
        setStep1Result(data);
        if (customCvText) {
          showToast(`Re-evaluation complete! New score: ${data.score}%`, "success");
        } else {
          setCurrentStep(1);
          showToast(`Analysis complete! Match score: ${data.score}%`, "success");
        }
      } else if (stepNum === 2) {
        setStep2Result(data.result);
        setCurrentStep(2);
        showToast("Google XYZ rewrite applied!", "success");
      } else if (stepNum === 3) {
        setStep3Result(data.result);
        setEditableCV(data.result);
        setCurrentStep(3);
        showToast("ATS formatting complete. Ready to export!", "success");
      }
    } catch (err: any) {
      if (err.message.includes("429")) {
        showToast("AI Rate Limit reached. Please wait 10-15 seconds and try again.", "error");
      } else {
        showToast(err.message || "Error processing data.", "error");
      }
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setJobDescription("");
    setCvText("");
    setCurrentStep(0);
    setStep1Result(null);
    setStep2Result("");
    setStep3Result("");
    setEditableCV("");
  };

  // CV print/preview CSS — matches reference image exactly
  const CV_STYLES = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:'Calibri','Georgia',serif;
      font-size:10pt;line-height:1.4;
      color:#111;background:#fff;
    }
    h1{
      font-size:16pt;font-weight:700;
      text-align:center;text-transform:uppercase;
      letter-spacing:2px;margin-bottom:1mm;
    }
    /* Subtitle line (job title) — first <p> after h1 */
    h1 + p{
      text-align:center;font-size:10pt;
      font-weight:700;text-transform:uppercase;
      letter-spacing:1px;margin-bottom:1mm;
    }
    h2{
      font-size:9.5pt;font-weight:700;
      text-transform:uppercase;letter-spacing:1.5px;
      border-bottom:1.5px solid #111;
      padding-bottom:0.8mm;margin-top:4.5mm;margin-bottom:2mm;
    }
    h3{
      font-size:10pt;font-weight:700;
      margin-top:2.5mm;margin-bottom:0.5mm;
    }
    p{margin-bottom:1mm;font-size:10pt;}
    ul{padding-left:4mm;margin-bottom:1.5mm}
    li{margin-bottom:0.8mm;font-size:9.5pt;}
    strong{font-weight:700}
    em{font-style:italic}
    hr{border:none;border-top:0.5px solid #aaa;margin:2mm 0}
    a{color:#111;text-decoration:underline}
    @page{margin:12mm 16mm;size:A4}
    @media print{body{padding:0}}
  `;

  const renderCV = (md: string): string => {
    // Configure marked for clean output
    marked.setOptions({ gfm: true, breaks: true });
    return marked.parse(md) as string;
  };

  const handleDownloadPDF = () => {
    const content = editableCV || cvText;
    if (!content) {
      showToast("No CV content to export.", "error");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow pop-ups and try again.", "error");
      return;
    }

    const fileName = pdfFile ? pdfFile.name.replace(".pdf", "") : "Optimized_CV";
    const bodyHtml = renderCV(content);

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${fileName}</title>
  <style>${CV_STYLES}</style>
</head>
<body style="padding:0 18mm">
${bodyHtml}
<script>
  window.onload=function(){setTimeout(function(){window.print()},400)};
<\/script>
</body>
</html>`);

    printWindow.document.close();
    showToast("Print dialog opened — choose 'Save as PDF' in your browser.", "success");
  };

  const scoreColor = step1Result
    ? step1Result.score >= 80
      ? "text-[var(--success)]"
      : step1Result.score >= 60
      ? "text-[var(--gold)]"
      : "text-[var(--danger)]"
    : "text-[var(--accent)]";

  const scoreRing = step1Result
    ? step1Result.score >= 80 ? "var(--success)" : step1Result.score >= 60 ? "var(--gold)" : "var(--danger)"
    : "var(--accent)";

  const scoreLabel = step1Result
    ? step1Result.score >= 80
      ? "Excellent"
      : step1Result.score >= 60
      ? "Good"
      : "Needs Work"
    : "";

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] flex flex-col selection:bg-indigo-500/10 selection:text-indigo-900" style={{ color: 'var(--text-primary)', fontFamily: "var(--font-inter,'Inter',system-ui,sans-serif)" }}>

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
      <header className="no-print sticky top-0 z-40 backdrop-blur-xl border-b px-6 py-3.5 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,var(--accent),#818cf8)' }}>
            <FileArrowDown weight="bold" className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight" style={{ fontFamily: "var(--font-jakarta)", color: 'var(--text-primary)' }}>CVRedFlag</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Workspace</span>
          <CaretRight weight="bold" className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {pdfFile ? pdfFile.name.replace(".pdf", "") : "New Analysis Session"}
          </span>
          {pdfFile && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md" style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', color: 'var(--success)' }}>
              Ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-all hover:scale-[1.02]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowClockwise weight="bold" className="w-3.5 h-3.5" /> Start Over
            </button>
          )}
          {currentStep === 3 && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,var(--accent),#6366f1)', boxShadow: '0 4px 20px rgba(79,70,229,0.25)' }}
            >
              <FileArrowDown weight="bold" className="w-3.5 h-3.5" /> Export PDF
            </button>
          )}
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex-1 p-8 overflow-y-auto">

        {/* ── Progress Stepper ────────────────────────────────────── */}
        {currentStep >= 0 && (
          <div className="max-w-6xl mx-auto mb-6 no-print">
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]" style={{ fontFamily: 'var(--font-jakarta)' }}>Optimization Progress</span>
                <span className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                  {currentStep === 0 ? "Upload documents to begin scanner" : 
                   currentStep === 1 ? "Step 1/3: Senior Recruiter Review active" :
                   currentStep === 2 ? "Step 2/3: Google XYZ Experience Rewrite active" :
                   "Step 3/3: ATS Scroll-Stop formatting completed"}
                </span>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
                <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden relative border border-[var(--border)]">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#818cf8]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${currentStep === 0 ? 5 : currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-xs font-black min-w-[36px] text-right" style={{ color: 'var(--text-primary)' }}>
                  {currentStep === 0 ? "5%" : currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100%"}
                </span>
              </div>
            </div>
          </div>
        )}

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
                {/* Clean CPU-friendly SVG Spinner */}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto pt-8 pb-16"
          >
            <div className="lg:col-span-6 flex flex-col gap-6">
              <span className="px-3.5 py-1 text-[10px] font-bold uppercase rounded-full w-max tracking-wider" style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', color: 'var(--accent)', fontFamily: 'var(--font-jakarta)' }}>
                ✦ AI Optimizer
              </span>
              <h1 className="text-4xl font-black tracking-tight leading-tight" style={{ fontFamily: 'var(--font-jakarta)', color: 'var(--text-primary)' }}>
                AI Resume{" "}
                <span className="gradient-text">Builder</span>{" "}
                &amp; Analyzer
              </h1>
              <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
                Deteksi red flags dalam 10 detik, temukan missing keywords, dan optimalkan CV
                otomatis dengan Google XYZ formula agar lolos ATS.
              </p>

              {/* Upload Form */}
              <div className="p-6 rounded-2xl flex flex-col gap-5 mt-2 backdrop-blur-md relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.02)' }}>
                
                {/* Visual loading overlays for file extractions */}
                {(isParsing || isJdParsing) && (
                  <div className="absolute inset-0 bg-white/95 z-30 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <ArrowClockwise weight="bold" className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {isParsing ? "Extracting CV Resume text..." : "Parsing Target Job Requirements..."}
                    </span>
                  </div>
                )}

                {/* CV Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}>Upload Resume (PDF)</label>
                  <div className="relative group">
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" id="pdf-uploader" disabled={isParsing} />
                    <label
                      htmlFor="pdf-uploader"
                      className={`flex flex-col items-center justify-center text-center gap-2.5 border border-dashed rounded-xl p-7 cursor-pointer transition-all ${
                        pdfFile ? "" : ""
                      } ${isParsing ? "opacity-60 cursor-wait" : ""}`}
                      style={pdfFile
                        ? { borderColor: 'rgba(5,150,105,0.4)', background: 'rgba(5,150,105,0.02)' }
                        : { borderColor: 'var(--border)', background: 'var(--bg-base)' }
                      }
                    >
                      {isParsing ? (
                        <>
                          <ArrowClockwise weight="bold" className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Extracting text...</span>
                        </>
                      ) : pdfFile ? (
                        <>
                          <CheckCircle weight="fill" className="w-6 h-6" style={{ color: 'var(--success)' }} />
                          <span className="text-xs font-semibold truncate max-w-[260px]" style={{ color: 'var(--success)' }}>{pdfFile.name}</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Click to change file</span>
                        </>
                      ) : (
                        <>
                          <UploadSimple weight="regular" className="w-6 h-6 transition-colors group-hover:scale-110" style={{ color: 'var(--text-muted)' }} />
                          <span className="text-xs font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }}>Drop CV or click to browse</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PDF only · Max 10MB</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Job Description */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}>Target Job Description</label>
                    <div className="flex items-center gap-1.5">
                      <input type="file" accept=".pdf,image/*" onChange={handleJdPdfUpload} className="hidden" id="jd-pdf-uploader" disabled={isJdParsing} />
                      <label
                        htmlFor="jd-pdf-uploader"
                        className={`flex items-center gap-1.5 text-[9px] font-bold uppercase px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${isJdParsing ? "opacity-60 cursor-wait" : ""}`}
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      >
                        {isJdParsing ? <ArrowClockwise weight="bold" className="w-2.5 h-2.5 animate-spin" /> : <UploadSimple weight="bold" className="w-2.5 h-2.5" />}
                        {isJdParsing ? "Parsing..." : "PDF / Image"}
                      </label>
                    </div>
                  </div>
                  <textarea
                    placeholder="Paste target job requirements here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full h-28 p-3 rounded-xl text-xs focus:outline-none resize-none transition-all"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <button
                  disabled={!cvText || !jobDescription || loading || isParsing}
                  onClick={() => runAnalysisStep(1)}
                  className="relative w-full py-3.5 rounded-xl text-white text-sm font-bold cursor-pointer transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,var(--accent),#6366f1)', boxShadow: '0 8px 28px rgba(79,70,229,0.18)', fontFamily: 'var(--font-jakarta)', opacity: (!cvText || !jobDescription || loading || isParsing) ? 0.4 : 1 }}
                >
                  {!loading && <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />}
                  {loading ? (
                    <><ArrowClockwise weight="bold" className="w-4 h-4 animate-spin" /> Scanning CV...</>
                  ) : (
                    <><Sparkle weight="fill" className="w-4 h-4" /> Scan &amp; Optimize Resume <ArrowRight weight="bold" className="w-4 h-4" /></>
                  )}
                </button>
              </div>

              {/* Trusted Logos */}
              <div className="mt-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-3">
                  Trusted By Candidates At
                </span>
                <div className="flex items-center gap-6 opacity-40 grayscale">
                  {["Google", "Microsoft", "Airbnb", "Spotify", "Amazon"].map((co) => (
                    <span key={co} className="text-xs font-black text-slate-800">{co}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="lg:col-span-6 hidden lg:flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-amber-500/5 rounded-full blur-[100px]" />
              <div className="relative w-[380px] h-[480px] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-200">
                <img
                  src="/cv_mockup.webp"
                  alt="CV Mockup Illustration"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-transparent to-transparent opacity-40 pointer-events-none" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVE WORKSPACE — Responsive 3-Column Layout */}
        {currentStep >= 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6 items-start">

            {/* COL 1 — ATS Analyzer (left sidebar) */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">

              {/* Match Score */}
              {step1Result && (
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
                </div>
              )}

              {step1Result && (
                <div className="premium-card p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Tag weight="fill" className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}>Missing Keywords</span>
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{step1Result.missingKeywords.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {step1Result.missingKeywords.length > 0 ? (
                      step1Result.missingKeywords.map((kw, i) => (
                        <motion.span key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                          className="px-2.5 py-1 text-[11px] rounded-lg font-semibold"
                          style={{ background: 'var(--accent-glow)', border: '1px solid rgba(79,70,229,0.12)', color: 'var(--text-secondary)' }}
                        >{kw}</motion.span>
                      ))
                    ) : (
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>No missing keywords!</span>
                    )}
                  </div>
                </div>
              )}

              {step1Result && (
                <div className="premium-card p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Warning weight="fill" className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--danger)', fontFamily: 'var(--font-jakarta)' }}>Red Flags</span>
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--danger-glow)', color: 'var(--danger)' }}>{step1Result.redFlags.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {step1Result.redFlags.length > 0 ? (
                      step1Result.redFlags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg text-xs" style={{ background: 'var(--danger-glow)', border: '1px solid rgba(220,38,38,0.06)' }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0" style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--danger)' }}>{i + 1}</div>
                          <p className="leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>{flag}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-lg text-xs flex items-center gap-1.5" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)', color: 'var(--success)' }}>
                        <CheckCircle weight="fill" className="w-3.5 h-3.5" /> Clean CV!
                      </div>
                    )}
                  </div>
                </div>
              )}

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

            {/* COL 2 — CV Preview (center, takes priority on all screen sizes) */}
            <div className="lg:col-span-8 xl:col-span-5 order-first lg:order-none flex flex-col gap-3">

              <div className="flex items-center justify-between rounded-xl p-1.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1">
                  {(["preview", "raw"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                      style={activeTab === tab
                        ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }
                        : { color: 'var(--text-muted)', fontFamily: 'var(--font-jakarta)' }
                      }
                    >
                      {tab === "preview" ? "A4 Preview" : "Raw Editor"}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider pr-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jakarta)' }}>Workspace</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <AnimatePresence>
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="no-print absolute inset-0 z-40 flex flex-col items-center justify-center p-8 text-center rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.95)' }}
                    >
                      <ArrowClockwise weight="bold" className="w-7 h-7 animate-spin mb-4" style={{ color: 'var(--accent)' }} />
                      <p className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}>{loadingMsg}</p>
                      <p className="text-[11px] mt-1.5 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Orchestrating AI · Please wait</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {activeTab === "raw" ? (
                  <textarea
                    value={editableCV}
                    onChange={(e) => setEditableCV(e.target.value)}
                    className="w-full h-full min-h-[600px] p-5 text-xs leading-relaxed focus:outline-none"
                    style={{ background: 'transparent', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', border: 'none' }}
                  />
                ) : (
                  <div className="w-full flex flex-col">
                    {currentStep === 3 && (
                      <div className="no-print p-3 border-b text-[11px] flex items-center gap-2 font-medium" style={{ background: 'rgba(79,70,229,0.03)', borderColor: 'rgba(79,70,229,0.1)', color: 'var(--accent)' }}>
                        <PencilSimple weight="bold" className="w-3 h-3 shrink-0" />
                        Formatted preview — switch to Raw Editor to make changes.
                      </div>
                    )}

                    {/* Scaler wrapper — measured by ResizeObserver */}
                    <div
                      ref={previewWrapperRef}
                      className="w-full overflow-hidden bg-slate-100 flex justify-center py-4 relative"
                      style={{ height: `${1123 * previewScale + 32}px` }}
                    >
                      <div
                        style={{
                          width: "794px",
                          height: "1123px",
                          transform: `scale(${previewScale})`,
                          transformOrigin: "top center",
                          position: "absolute",
                          top: "16px",
                        }}
                      >
                        {currentStep === 3 ? (
                          <div
                            ref={pdfPreviewRef}
                            className="pdf-canvas shadow-lg bg-white w-full h-full"
                            dangerouslySetInnerHTML={{ __html: renderCV(editableCV) }}
                            style={{
                              fontFamily: "'Calibri','Georgia',serif",
                              fontSize: "10pt",
                              lineHeight: 1.4,
                              color: "#111",
                            }}
                          />
                        ) : (
                          <div
                            className="pdf-canvas shadow-lg bg-white w-full h-full overflow-auto p-6"
                          >
                            <div className="whitespace-pre-wrap text-[9pt] text-gray-700 font-mono">
                              <p className="text-sm font-bold border-b border-gray-200 pb-3 mb-4 text-gray-900 font-sans">Raw Extracted Text</p>
                              {editableCV || cvText}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COL 3 — AI Copilot (right sidebar) */}
            <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-4">

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
                  <button onClick={handleDownloadPDF}
                    className="w-full py-3 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', boxShadow: '0 8px 24px rgba(5,150,105,0.15)', fontFamily: 'var(--font-jakarta)' }}
                  >
                    <FileArrowDown weight="bold" className="w-4 h-4" /> Download ATS PDF
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
