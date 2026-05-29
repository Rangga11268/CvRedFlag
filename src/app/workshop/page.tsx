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
  resolvedKeywords?: string[];
  resolvedRedFlags?: string[];
  breakdown?: {
    keywords: number;
    impact: number;
    structure: number;
    readability: number;
  };
}

interface Toast {
  id: number;
  type: "error" | "success" | "info";
  message: string;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

let toastId = 0;

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const highlightWords = (text: string, searchWords: string[], className: string, highlightMetrics: boolean = false) => {
  if (!text) return "";
  let html = escapeHtml(text);
  
  if (searchWords && searchWords.length > 0) {
    const words = Array.from(new Set(searchWords.filter(w => w && w.trim().length > 0)));
    if (words.length > 0) {
      const escaped = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
      // Match words case-insensitively with boundary check
      const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
      html = html.replace(regex, `<mark class="${className}">$1</mark>`);
    }
  }
  
  if (highlightMetrics) {
    // Highlight percentages, pluses, dollar values, and numeric quantities
    const metricRegex = /(\b\d+(?:\.\d+)?%|\b\d+\+|\$\d+(?:\.\d+)?[kK]?)/g;
    html = html.replace(metricRegex, `<mark class="diff-added">$1</mark>`);
  }
  
  return html;
};

const getRedFlagKeyTerms = (flags: string[]) => {
  if (!flags) return [];
  const stopWords = new Set(["about", "above", "after", "again", "against", "along", "already", "would", "could", "should", "other", "under", "where", "there", "their", "these", "those", "using", "through", "during", "before", "after", "experience", "traditional", "certification", "government", "institutions"]);
  const terms: string[] = [];
  flags.forEach(flag => {
    flag.split(/\s+/).forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (clean.length > 4 && !stopWords.has(clean)) {
        terms.push(clean);
      }
    });
  });
  return Array.from(new Set(terms));
};

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
  const [activeTab, setActiveTab] = useState<"preview" | "raw" | "diff" | "coverletter">("preview");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [loadingCoverLetter, setLoadingCoverLetter] = useState<boolean>(false);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [keywordSuggestion, setKeywordSuggestion] = useState<string>("");
  const [loadingKeywordSuggestion, setLoadingKeywordSuggestion] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"serif" | "sans" | "compact">("serif");
  const [forceSinglePage, setForceSinglePage] = useState<boolean>(false);
  const [canvasHeight, setCanvasHeight] = useState<number>(1123);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Generate object URL for PDF file preview if available
  useEffect(() => {
    if (pdfFile && pdfFile.size > 0) {
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [pdfFile]);

  const [activePage, setActivePage] = useState<number>(1);

  const handlePageChange = (targetPage: number) => {
    if (targetPage < 1 || targetPage > pageCount) return;
    setActivePage(targetPage);
  };

  // Measure natural scrollHeight of A4 cv preview and set height to fit pages
  useEffect(() => {
    if (currentStep === 0 || activeTab !== "preview") return;

    const timer = setTimeout(() => {
      const el = measureRef.current;
      if (!el) return;
      
      const innerHeight = el.scrollHeight;
      
      // A4 height 1123px minus typical vertical padding (~100px) leaves ~1023px printable height
      const pageContentThreshold = 1000;
      const pages = Math.max(1, Math.ceil(innerHeight / pageContentThreshold));
      const targetHeight = forceSinglePage ? 1123 : pages * 1123;
      if (canvasHeight !== targetHeight) {
        setCanvasHeight(targetHeight);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [editableCV, cvText, selectedTemplate, forceSinglePage, currentStep, activeTab, canvasHeight]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
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
      if (stepNum === 1 && customCvText) {
        payload.isReanalysis = true;
        payload.originalRedFlags = step1Result?.redFlags || [];
        payload.originalKeywords = step1Result?.missingKeywords || [];
      }
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
          setScoreHistory((prev) => [...prev, data.score]);
        } else {
          setCurrentStep(1);
          showToast(`Analysis complete! Match score: ${data.score}%`, "success");
          setScoreHistory([data.score]);
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

  // Load pre-filled data from sessionStorage if redirected from landing page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCvText = sessionStorage.getItem("cvText");
      const storedJd = sessionStorage.getItem("jobDescription");
      const storedFileName = sessionStorage.getItem("fileName");
      
      if (storedCvText) {
        setCvText(storedCvText);
        setEditableCV(storedCvText);
      }
      if (storedJd) {
        setJobDescription(storedJd);
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
    }

    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleReoptimize = async () => {
    if (!editableCV || !step1Result) {
      showToast("No resume text or scan results to refine.", "info");
      return;
    }

    setLoading(true);
    setLoadingMsg("Refining experience bullets...");
    try {
      // Step 2 refinement: Send the current editable CV as text to rewrite
      const payload2 = {
        step: 2,
        cvText: editableCV,
        jobDescription,
        missingKeywords: step1Result.missingKeywords,
        redFlags: step1Result.redFlags
      };

      const res2 = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload2),
      });
      if (!res2.ok) throw new Error((await res2.json()).error || "Failed Step 2 refinement");
      const data2 = await res2.json();
      const newStep2Result = data2.result;
      setStep2Result(newStep2Result);

      // Step 3 layout compilation
      setLoadingMsg("Compiling refined ATS resume...");
      const payload3 = {
        step: 3,
        cvText: editableCV,
        jobDescription,
        rewrittenExperience: newStep2Result
      };
      const res3 = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload3),
      });
      if (!res3.ok) throw new Error((await res3.json()).error || "Failed Step 3 refinement");
      const data3 = await res3.json();
      setStep3Result(data3.result);
      setEditableCV(data3.result);

      // Re-evaluate the new score on the refined CV
      setLoadingMsg("Re-evaluating refined score...");
      const payload1 = {
        step: 1,
        cvText: data3.result,
        jobDescription,
        isReanalysis: true,
        originalRedFlags: step1Result.redFlags,
        originalKeywords: step1Result.missingKeywords
      };
      const res1 = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload1),
      });
      if (res1.ok) {
        const data1 = await res1.json();
        setStep1Result(data1);
        setScoreHistory((prev) => [...prev, data1.score]);
        showToast(`Refinement complete! Score: ${data1.score}%`, "success");
      } else {
        showToast("Refinement complete, but score evaluation failed.", "info");
      }
    } catch (err: any) {
      if (err.message.includes("429")) {
        showToast("AI Rate Limit reached during refinement. Please wait 10-15 seconds and try again.", "error");
      } else {
        showToast(err.message || "Error refining CV", "error");
      }
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const handleKeywordClick = async (kw: string) => {
    setSelectedKeyword(kw);
    setKeywordSuggestion("");
    setLoadingKeywordSuggestion(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 4,
          keyword: kw,
          cvText: editableCV || cvText,
          jobDescription
        })
      });
      if (!res.ok) throw new Error("Failed to get suggestion");
      const data = await res.json();
      setKeywordSuggestion(data.result);
    } catch (e: any) {
      setKeywordSuggestion("Failed to load placement suggestion. Please try again.");
    } finally {
      setLoadingKeywordSuggestion(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setLoadingCoverLetter(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 5,
          cvText: editableCV || cvText,
          jobDescription
        })
      });
      if (!res.ok) throw new Error("Failed to generate cover letter");
      const data = await res.json();
      setCoverLetter(data.result);
      showToast("Cover Letter generated successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to generate Cover Letter", "error");
    } finally {
      setLoadingCoverLetter(false);
    }
  };

  const handleDownloadCoverLetterPDF = () => {
    if (!coverLetter) {
      showToast("No cover letter content to export.", "error");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow pop-ups and try again.", "error");
      return;
    }

    const fileName = pdfFile ? `${pdfFile.name.replace(".pdf", "")}_Cover_Letter` : "Cover_Letter";
    const bodyHtml = renderCV(coverLetter);

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${fileName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:${selectedTemplate === "serif" ? "'Times New Roman','Garamond',serif" : selectedTemplate === "sans" ? "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif" : "'Calibri',sans-serif"};
      font-size:11pt;line-height:1.5;
      color:#111;background:#fff;
    }
    p{margin-bottom:4mm;}
    h1, h2, h3, h4{
      margin-bottom:4mm;font-family:${selectedTemplate === "serif" ? "'Times New Roman','Garamond',serif" : selectedTemplate === "sans" ? "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif" : "'Calibri',sans-serif"};
    }
    h1{font-size:18pt;text-align:center;text-transform:uppercase;margin-bottom:6mm;}
    @page{margin:20mm 25mm;size:A4}
    @media print{body{padding:0}}
  </style>
</head>
<body style="padding:0 20mm">
${bodyHtml}
<script>
  window.onload=function(){setTimeout(function(){window.print()},400)};
<\/script>
</body>
</html>`);

    printWindow.document.close();
    showToast("Print dialog opened — choose 'Save as PDF' to export Cover Letter.", "success");
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
    setScoreHistory([]);
    setSelectedKeyword(null);
    setKeywordSuggestion("");
    setCoverLetter("");
    setForceSinglePage(false);
  };

  const getCVStyles = (temp: "serif" | "sans" | "compact", force1Page: boolean = false) => {
    let font = "'Calibri','Georgia',serif";
    let bodyFont = "'Calibri','Georgia',serif";
    let h1Font = "'Calibri','Georgia',serif";
    let pageMargin = force1Page ? "8mm 10mm" : "12mm 16mm";
    let lineGap = force1Page ? "1.2" : "1.4";
    let spacingTop = force1Page ? "3mm" : "4.5mm";
    let bodyFontSize = force1Page ? "9pt" : "10pt";
    let h1FontSize = force1Page ? "14pt" : "16pt";
    let h2FontSize = force1Page ? "9pt" : "9.5pt";
    let h3FontSize = force1Page ? "9pt" : "10pt";
    let liFontSize = force1Page ? "9pt" : "9.5pt";
    
    if (temp === "serif") {
      font = "'Times New Roman','Garamond',serif";
      bodyFont = font;
      h1Font = font;
    } else if (temp === "sans") {
      font = "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif";
      bodyFont = font;
      h1Font = font;
    } else if (temp === "compact") {
      font = "'Calibri',sans-serif";
      bodyFont = font;
      h1Font = font;
      if (!force1Page) {
        pageMargin = "8mm 10mm";
        lineGap = "1.25";
        spacingTop = "3.2mm";
      }
    }

    return `
      *{box-sizing:border-box;margin:0;padding:0}
      body{
        font-family:${bodyFont};
        font-size:${bodyFontSize};line-height:${lineGap};
        color:#111;background:#fff;
      }
      h1{
        font-family:${h1Font};
        font-size:${h1FontSize};font-weight:700;
        text-align:center;text-transform:uppercase;
        letter-spacing:2px;margin-bottom:1mm;
        break-after:avoid;page-break-after:avoid;
      }
      /* Subtitle line (job title) — first <p> after h1 */
      h1 + p{
        text-align:center;font-size:10pt;
        font-weight:700;text-transform:uppercase;
        letter-spacing:1px;margin-bottom:1mm;
        break-inside:avoid;page-break-inside:avoid;
      }
      h2{
        font-family:${h1Font};
        font-size:${h2FontSize};font-weight:700;
        text-transform:uppercase;letter-spacing:1.5px;
        border-bottom:1.5px solid #111;
        padding-bottom:0.8mm;margin-top:${spacingTop};margin-bottom:2mm;
        break-after:avoid;page-break-after:avoid;
      }
      h3{
        font-family:${bodyFont};
        font-size:${h3FontSize};font-weight:700;
        margin-top:2.5mm;margin-bottom:0.5mm;
        break-after:avoid;page-break-after:avoid;
      }
      p{margin-bottom:1mm;font-size:${bodyFontSize};break-inside:avoid;page-break-inside:avoid;}
      ul{padding-left:4mm;margin-bottom:1.5mm;break-inside:avoid;page-break-inside:avoid;}
      li{margin-bottom:0.8mm;font-size:${liFontSize};break-inside:avoid;page-break-inside:avoid;}
      strong{font-weight:700}
      em{font-style:italic}
      hr{border:none;border-top:0.5px solid #aaa;margin:2mm 0;break-inside:avoid;}
      a{color:#111;text-decoration:underline}
      @page{margin:${pageMargin};size:A4}
      @media print{body{padding:0}}
    `;
  };

  const formatRawTextToMarkdown = (text: string): string => {
    if (!text) return "";
    const lines = text.split("\n");
    const sectionKeywords = [
      "experience", "work", "employment", "education", "skills", "projects", 
      "summary", "objective", "certifications", "languages", "achievements", "interests"
    ];
    
    let formattedLines = lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      
      const isFirstLine = idx === lines.findIndex(l => l.trim().length > 0);
      if (isFirstLine && trimmed.length < 50) {
        return `# ${trimmed}`;
      }
      
      const isCapitalized = trimmed === trimmed.toUpperCase() && trimmed.length > 3;
      const matchesKeyword = sectionKeywords.some(kw => trimmed.toLowerCase().includes(kw));
      if (trimmed.length < 40 && (isCapitalized || (matchesKeyword && trimmed.length < 25))) {
        return `\n## ${trimmed}`;
      }
      
      if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return `* ${trimmed.replace(/^[•\-\*]\s*/, "")}`;
      }
      
      return line;
    });
    
    return formattedLines.join("\n");
  };

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
  <style>${getCVStyles(selectedTemplate, forceSinglePage)}</style>
</head>
<body style="padding: ${forceSinglePage ? "0 10mm" : (selectedTemplate === "compact" ? "0 12mm" : "0 18mm")}">
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

  const getPaddingValues = (temp: "serif" | "sans" | "compact", force1Page: boolean) => {
    let topMm = 14;
    let horizMm = 18;
    if (force1Page) {
      topMm = 8;
      horizMm = 10;
    } else if (temp === "compact") {
      topMm = 10;
      horizMm = 12;
    }
    const topPx = Math.round(topMm * 3.78);
    const horizPx = Math.round(horizMm * 3.78);
    return { topPx, horizPx };
  };

  const { topPx, horizPx } = getPaddingValues(selectedTemplate, forceSinglePage);
  const pageCount = forceSinglePage ? 1 : Math.max(1, Math.ceil(canvasHeight / 1123));
  const isMultiPage = pageCount > 1 && !forceSinglePage && currentStep > 0;

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] flex flex-col selection:bg-indigo-500/10 selection:text-indigo-900" style={{ color: 'var(--text-primary)', fontFamily: "var(--font-inter,'Inter',system-ui,sans-serif)" }}>
      {/* ── Initial Splash Screen Loader ───────────────────────── */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 transition-opacity duration-300 ease-out ${
          isInitializing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-xs" style={{ background: 'linear-gradient(135deg,var(--accent),#818cf8)' }}>
            <FileArrowDown weight="bold" className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-xs font-bold text-slate-800 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Menyiapkan Workspace AI...</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Membuka Lembar Kerja CVRedFlag</p>
        </div>
      </div>

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
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="CVRedFlag Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="font-extrabold text-base tracking-tight" style={{ fontFamily: "var(--font-jakarta)", color: 'var(--text-primary)' }}>CVRedFlag<span className="text-indigo-600">.ai</span></span>
          </a>
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
          <a
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-all hover:scale-[1.02]"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}
          >
            ← Kembali
          </a>
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
              )}

              {step1Result && (
                <div className="premium-card p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Tag weight="fill" className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-jakarta)' }}>Missing Keywords</span>
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {step1Result.missingKeywords.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {step1Result.missingKeywords.map((kw, i) => (
                      <motion.span key={`missing-${i}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}
                        onClick={() => handleKeywordClick(kw)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold cursor-pointer transition-all hover:bg-indigo-150/40 hover:border-indigo-400/30 ${selectedKeyword === kw ? "ring-2 ring-indigo-500/30 bg-indigo-100/50" : ""}`}
                        style={{ background: 'var(--accent-glow)', border: selectedKeyword === kw ? '1px solid var(--accent)' : '1px solid rgba(79,70,229,0.12)', color: 'var(--text-secondary)' }}
                      >
                        {kw}
                      </motion.span>
                    ))}
                    {step1Result.resolvedKeywords?.map((kw, i) => (
                      <motion.span key={`resolved-${i}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="px-2.5 py-1 text-[11px] rounded-lg font-semibold flex items-center gap-1"
                        style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', color: '#047857' }}
                      >
                        <CheckCircle weight="fill" className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="line-through opacity-75">{kw}</span>
                      </motion.span>
                    ))}
                    {step1Result.missingKeywords.length === 0 && (!step1Result.resolvedKeywords || step1Result.resolvedKeywords.length === 0) && (
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>No missing keywords!</span>
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
              )}

              {step1Result && (
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

              <div className="flex flex-col md:flex-row md:items-center justify-between rounded-xl p-1.5 gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1">
                  {(["preview", "raw", "diff", "coverletter"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                      style={activeTab === tab
                        ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }
                        : { color: 'var(--text-muted)', fontFamily: 'var(--font-jakarta)' }
                      }
                    >
                      {tab === "preview" ? "A4 Preview" : tab === "raw" ? "Raw Editor" : tab === "diff" ? "Diff View" : "Cover Letter"}
                    </button>
                  ))}
                </div>
                {currentStep === 3 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[var(--bg-base)] p-1 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase px-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>Style:</span>
                      {(["serif", "sans", "compact"] as const).map((temp) => (
                        <button key={temp} onClick={() => setSelectedTemplate(temp)}
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md cursor-pointer transition-all ${selectedTemplate === temp ? "bg-white text-indigo-700 shadow-xs border" : "text-slate-500 hover:text-slate-700"}`}
                          style={{ fontFamily: 'var(--font-jakarta)', borderColor: 'var(--border)' }}
                        >
                          {temp}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase cursor-pointer select-none text-slate-500 hover:text-slate-700 bg-[var(--bg-base)] px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-jakarta)' }}>
                      <input type="checkbox" checked={forceSinglePage} onChange={(e) => setForceSinglePage(e.target.checked)} className="cursor-pointer" />
                      <span>Fit 1 Page</span>
                    </label>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider pr-3 text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-jakarta)' }}>Workspace</span>
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
                ) : activeTab === "diff" ? (
                  <div className="w-full min-h-[600px] grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50">
                    <div className="flex flex-col gap-2 bg-white rounded-xl p-4 border border-[var(--border)]">
                      <div className="flex items-center gap-1.5 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-jakarta)' }}>Original CV (Red Flags)</span>
                      </div>
                      <div className="flex-1 overflow-auto max-h-[500px] text-xs font-mono whitespace-pre-wrap leading-relaxed pt-2 text-slate-600"
                        dangerouslySetInnerHTML={{
                          __html: highlightWords(
                            cvText,
                            getRedFlagKeyTerms([...(step1Result?.redFlags || []), ...(step1Result?.resolvedRedFlags || [])]),
                            "diff-removed"
                          )
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2 bg-white rounded-xl p-4 border border-[var(--border)]">
                      <div className="flex items-center gap-1.5 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-jakarta)' }}>Optimized CV (Added Keywords)</span>
                      </div>
                      <div className="flex-1 overflow-auto max-h-[500px] text-xs font-mono whitespace-pre-wrap leading-relaxed pt-2 text-slate-600"
                        dangerouslySetInnerHTML={{
                          __html: highlightWords(
                            editableCV || cvText,
                            [...(step1Result?.missingKeywords || []), ...(step1Result?.resolvedKeywords || [])],
                            "diff-added",
                            true
                          )
                        }}
                      />
                    </div>
                  </div>
                ) : activeTab === "coverletter" ? (
                  <div className="w-full min-h-[600px] p-6 bg-slate-50 flex flex-col gap-4 relative">
                    <AnimatePresence>
                      {loadingCoverLetter && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 z-45 flex flex-col items-center justify-center p-8 text-center rounded-2xl"
                          style={{ background: 'rgba(255,255,255,0.95)' }}
                        >
                          <ArrowClockwise weight="bold" className="w-7 h-7 animate-spin mb-4" style={{ color: 'var(--accent)' }} />
                          <p className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta)' }}>Drafting cover letter...</p>
                          <p className="text-[11px] mt-1.5 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Writing tailored matches · Please wait</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {coverLetter ? (
                      <div className="flex flex-col gap-3 bg-[var(--bg-base)] rounded-2xl p-4 border border-[var(--border)] shadow-sm">
                        <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-jakarta)' }}>AI Generated Cover Letter</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(coverLetter);
                                showToast("Cover letter copied to clipboard!", "success");
                              }}
                              className="px-3 py-1.5 text-[9px] font-bold uppercase bg-indigo-50 border border-indigo-150/40 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer transition-all"
                              style={{ fontFamily: 'var(--font-jakarta)' }}
                            >
                              Copy to Clipboard
                            </button>
                            <button
                              onClick={handleDownloadCoverLetterPDF}
                              className="px-3 py-1.5 text-[9px] font-bold uppercase bg-emerald-50 border border-emerald-150/40 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                              style={{ fontFamily: 'var(--font-jakarta)' }}
                            >
                              <FileArrowDown weight="bold" className="w-3.5 h-3.5" /> Download PDF
                            </button>
                          </div>
                        </div>
                        <div className="w-full flex justify-center py-4 bg-slate-100 overflow-y-auto max-h-[500px] rounded-xl border">
                          <div
                            className="bg-white shadow-md p-8 text-slate-800 text-left"
                            style={{
                              width: "794px",
                              minHeight: "1123px",
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
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-[var(--border)] shadow-sm min-h-[500px]">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
                          <MagicWand weight="bold" className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>Need a matching Cover Letter?</h4>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-5">
                          Draft an ATS-optimized cover letter specifically tailored to the target Job Description and highlighting your rewritten resume achievements.
                        </p>
                        <button
                          disabled={loadingCoverLetter || !cvText || !jobDescription}
                          onClick={handleGenerateCoverLetter}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          {loadingCoverLetter ? (
                            <>
                              <ArrowClockwise weight="bold" className="w-3.5 h-3.5 animate-spin" />
                              Generating Cover Letter...
                            </>
                          ) : (
                            <>
                              <MagicWand weight="bold" className="w-3.5 h-3.5" />
                              Generate Cover Letter
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full flex flex-col">
                    {currentStep === 3 && (
                      <div className="no-print p-3 border-b text-[11px] flex items-center gap-2 font-medium" style={{ background: 'rgba(79,70,229,0.03)', borderColor: 'rgba(79,70,229,0.1)', color: 'var(--accent)' }}>
                        <PencilSimple weight="bold" className="w-3 h-3 shrink-0" />
                        Formatted preview — switch to Raw Editor to make changes.
                      </div>
                    )}
                    {isMultiPage && (
                      <div className="no-print p-2.5 border-b text-[11px] flex items-center justify-between gap-2 font-medium bg-amber-50/50 border-amber-200/50 text-amber-800">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <span>CV Anda melebihi 1 halaman A4. Gunakan navigasi halaman di bawah untuk melihat Halaman {activePage === 1 ? '2' : '1'}.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePageChange(activePage === 1 ? 2 : 1)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] px-2 py-0.5 rounded transition-colors"
                          >
                            Lihat Halaman {activePage === 1 ? '2' : '1'} →
                          </button>
                        </div>
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
                                  className="pdf-canvas"
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
                  {step1Result && (step1Result.missingKeywords.length > 0 || step1Result.redFlags.length > 0) && (
                    <button onClick={handleReoptimize} disabled={loading}
                      className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 border border-indigo-600/20 bg-indigo-50 hover:bg-indigo-100/60 text-indigo-700 disabled:opacity-50 animate-pulse-subtle"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      <MagicWand weight="bold" className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Optimize Again / Refine Resume
                    </button>
                  )}
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
