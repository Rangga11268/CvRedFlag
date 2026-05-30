import { useState, useRef, useEffect } from "react";
import { getCVStyles } from "../utils/cvHelpers";

interface UsePagePreviewParams {
  editableCV: string;
  cvText: string;
  selectedTemplate: "serif" | "sans" | "compact";
  forceSinglePage: boolean;
  currentStep: number;
  activeTab: string;
  pdfFile: File | null;
}

export function usePagePreview({
  editableCV,
  cvText,
  selectedTemplate,
  forceSinglePage,
  currentStep,
  activeTab,
  pdfFile,
}: UsePagePreviewParams) {
  const [canvasHeight, setCanvasHeight] = useState<number>(1123);
  const [previewScale, setPreviewScale] = useState(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  // Generate object URL for PDF file preview
  useEffect(() => {
    if (pdfFile && pdfFile.size > 0) {
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [pdfFile]);

  // Measure natural scrollHeight of A4 preview to set canvas height
  useEffect(() => {
    if (currentStep === 0 || activeTab !== "preview") return;

    const timer = setTimeout(() => {
      const el = measureRef.current;
      if (!el) return;

      const innerHeight = el.scrollHeight;
      const pageContentThreshold = 1000;
      const pages = Math.max(1, Math.ceil(innerHeight / pageContentThreshold));
      const targetHeight = forceSinglePage ? 1123 : pages * 1123;
      if (canvasHeight !== targetHeight) {
        setCanvasHeight(targetHeight);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [editableCV, cvText, selectedTemplate, forceSinglePage, currentStep, activeTab, canvasHeight]);

  // Clamp activePage to be within pageCount range if pageCount decreases
  useEffect(() => {
    const totalPages = forceSinglePage ? 1 : Math.max(1, Math.ceil(canvasHeight / 1123));
    if (activePage > totalPages) {
      setActivePage(1);
    }
  }, [canvasHeight, forceSinglePage, activePage]);

  // Dynamically scale A4 canvas to fit its wrapper column
  useEffect(() => {
    if (activeTab !== "preview") return;

    const timer = setTimeout(() => {
      const wrapper = previewWrapperRef.current;
      if (!wrapper) return;
      const A4_WIDTH_PX = 794;
      const observer = new ResizeObserver(([entry]) => {
        const available = entry.contentRect.width - 8;
        const scaleVal = available > 0 ? available / A4_WIDTH_PX : 0.4;
        setPreviewScale(Math.max(0.2, Math.min(1, scaleVal)));
      });
      observer.observe(wrapper);
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

  const handlePageChange = (targetPage: number) => {
    const pageCountVal = forceSinglePage ? 1 : Math.max(1, Math.ceil(canvasHeight / 1123));
    if (targetPage < 1 || targetPage > pageCountVal) return;
    setActivePage(targetPage);
  };

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
    return {
      topPx: Math.round(topMm * 3.78),
      horizPx: Math.round(horizMm * 3.78),
    };
  };

  const { topPx, horizPx } = getPaddingValues(selectedTemplate, forceSinglePage);
  const pageCount = forceSinglePage ? 1 : Math.max(1, Math.ceil(canvasHeight / 1123));
  const isMultiPage = pageCount > 1 && !forceSinglePage && currentStep > 0;

  return {
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
  };
}
