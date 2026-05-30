import { useState, useCallback } from "react";
import { AnalysisResult } from "../types";
import { formatRawTextToMarkdown } from "../utils/cvHelpers";

interface UseCVAnalysisParams {
  cvText: string;
  jobDescription: string;
  editableCV: string;
  setEditableCV: (text: string) => void;
  showToast: (msg: string, type?: "error" | "success" | "info") => void;
}

export function useCVAnalysis({
  cvText,
  jobDescription,
  editableCV,
  setEditableCV,
  showToast,
}: UseCVAnalysisParams) {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>("");
  const [step1Result, setStep1Result] = useState<AnalysisResult | null>(null);
  const [step2Result, setStep2Result] = useState<string>("");
  const [step3Result, setStep3Result] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [jobCategory, setJobCategory] = useState<"software_engineer" | "general">("general");
  const [cvLanguage, setCvLanguage] = useState<"auto" | "id" | "en" | "bilingual">("auto");
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [keywordSuggestion, setKeywordSuggestion] = useState<string>("");
  const [loadingKeywordSuggestion, setLoadingKeywordSuggestion] = useState<boolean>(false);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);

  const callAnalyzeAPI = async (payload: Record<string, unknown>): Promise<any> => {
    let geminiKey = "";
    let openrouterKey = "";
    if (typeof window !== "undefined") {
      geminiKey = localStorage.getItem("cv_redflag_gemini_api_key") || "";
      openrouterKey = localStorage.getItem("cv_redflag_openrouter_api_key") || "";
    }

    const payloadWithKeys = {
      ...payload,
      ...(geminiKey ? { geminiApiKey: geminiKey } : {}),
      ...(openrouterKey ? { openrouterApiKey: openrouterKey } : {}),
    };

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithKeys),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to contact AI");
    }
    return res.json();
  };

  const runAnalysisStep = useCallback(
    async (stepNum: number, customCvText?: string) => {
      const textToAnalyze = customCvText || cvText;
      if (!textToAnalyze || !jobDescription) {
        showToast("Please upload your CV and fill in the Job Description first.", "info");
        return;
      }

      setLoading(true);
      if (stepNum === 1)
        setLoadingMsg(customCvText ? "Re-scanning optimized CV..." : "Scanning CV for critical red flags...");
      else if (stepNum === 2) setLoadingMsg("Applying Google XYZ Formula...");
      else if (stepNum === 3) setLoadingMsg("Sculpting ATS optimized structure...");

      try {
        const payload: Record<string, unknown> = {
          step: stepNum,
          cvText: textToAnalyze,
          jobDescription,
          jobCategory,
          cvLanguage,
        };
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

        const data = await callAnalyzeAPI(payload);

        if (stepNum === 1) {
          setStep1Result(data);
          if (data.detectedJobCategory) {
            setJobCategory(data.detectedJobCategory);
            const categoryLabel =
              data.detectedJobCategory === "software_engineer"
                ? "Software Engineer / IT"
                : "Profesional Umum";
            showToast(`Kategori Pekerjaan Terdeteksi: ${categoryLabel}`, "info");
          }
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
          setEditableCV(data.result || formatRawTextToMarkdown(cvText));
          setCurrentStep(3);
          if (!data.result) {
            showToast("AI returned empty formatted CV, using parsed original as fallback.", "info");
          } else {
            showToast("ATS formatting complete. Ready to export!", "success");
          }
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
    },
    [cvText, jobDescription, jobCategory, cvLanguage, step1Result, step2Result, editableCV, setEditableCV, showToast]
  );

  const handleReoptimize = useCallback(async () => {
    if (!editableCV || !step1Result) {
      showToast("No resume text or scan results to refine.", "info");
      return;
    }

    setLoading(true);
    setLoadingMsg("Refining experience bullets...");
    try {
      const data2 = await callAnalyzeAPI({
        step: 2,
        cvText: editableCV,
        jobDescription,
        missingKeywords: step1Result.missingKeywords,
        redFlags: step1Result.redFlags,
        cvLanguage,
      });
      const newStep2Result = data2.result;
      setStep2Result(newStep2Result);

      setLoadingMsg("Compiling refined ATS resume...");
      const data3 = await callAnalyzeAPI({
        step: 3,
        cvText: editableCV,
        jobDescription,
        rewrittenExperience: newStep2Result,
        jobCategory,
        cvLanguage,
      });
      setStep3Result(data3.result);
      setEditableCV(data3.result || formatRawTextToMarkdown(cvText));

      setLoadingMsg("Re-evaluating refined score...");
      const data1 = await callAnalyzeAPI({
        step: 1,
        cvText: data3.result,
        jobDescription,
        isReanalysis: true,
        originalRedFlags: step1Result.redFlags,
        originalKeywords: step1Result.missingKeywords,
      });
      setStep1Result(data1);
      if (data1.detectedJobCategory) setJobCategory(data1.detectedJobCategory);
      setScoreHistory((prev) => [...prev, data1.score]);
      showToast(`Refinement complete! Score: ${data1.score}%`, "success");
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
  }, [editableCV, step1Result, jobDescription, jobCategory, cvLanguage, cvText, setEditableCV, showToast]);

  const handleRecompile = useCallback(
    async (targetCategory?: typeof jobCategory, targetLanguage?: typeof cvLanguage) => {
      const category = targetCategory || jobCategory;
      const language = targetLanguage || cvLanguage;

      if (!cvText || !jobDescription || !step1Result) {
        showToast("Cannot update settings without parsed CV text or job description.", "info");
        return;
      }

      setLoading(true);
      setLoadingMsg("Applying new templates & translating...");
      try {
        const data2 = await callAnalyzeAPI({
          step: 2,
          cvText,
          jobDescription,
          missingKeywords: step1Result.missingKeywords,
          redFlags: step1Result.redFlags,
          cvLanguage: language,
          jobCategory: category,
        });
        const newStep2Result = data2.result;
        setStep2Result(newStep2Result);

        setLoadingMsg("Re-compiling ATS CV structure...");
        const data3 = await callAnalyzeAPI({
          step: 3,
          cvText,
          jobDescription,
          rewrittenExperience: newStep2Result,
          jobCategory: category,
          cvLanguage: language,
        });
        setStep3Result(data3.result);
        setEditableCV(data3.result || formatRawTextToMarkdown(cvText));

        setLoadingMsg("Evaluating updated CV score...");
        const data1 = await callAnalyzeAPI({
          step: 1,
          cvText: data3.result,
          jobDescription,
          isReanalysis: true,
          originalRedFlags: step1Result.redFlags,
          originalKeywords: step1Result.missingKeywords,
        });
        setStep1Result(data1);
        setScoreHistory((prev) => [...prev, data1.score]);
        showToast("CV successfully updated and optimized with your new settings!", "success");
      } catch (err: any) {
        if (err.message.includes("429")) {
          showToast("AI Rate Limit reached. Please wait 10-15 seconds and try again.", "error");
        } else {
          showToast(err.message || "Error re-compiling CV", "error");
        }
      } finally {
        setLoading(false);
        setLoadingMsg("");
      }
    },
    [cvText, jobDescription, step1Result, jobCategory, cvLanguage, setEditableCV, showToast]
  );

  const handleKeywordClick = useCallback(
    async (kw: string) => {
      setSelectedKeyword(kw);
      setKeywordSuggestion("");
      setLoadingKeywordSuggestion(true);
      try {
        const data = await callAnalyzeAPI({
          step: 4,
          keyword: kw,
          cvText: editableCV || cvText,
          jobDescription,
        });
        setKeywordSuggestion(data.result);
      } catch (e: any) {
        setKeywordSuggestion("Failed to load placement suggestion. Please try again.");
      } finally {
        setLoadingKeywordSuggestion(false);
      }
    },
    [editableCV, cvText, jobDescription]
  );

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setStep1Result(null);
    setStep2Result("");
    setStep3Result("");
    setScoreHistory([]);
    setSelectedKeyword(null);
    setKeywordSuggestion("");
    setJobCategory("general");
    setCvLanguage("auto");
  }, []);

  return {
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
    handleReset,
  };
}
