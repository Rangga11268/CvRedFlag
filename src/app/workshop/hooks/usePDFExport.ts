import { useCallback } from "react";
import { getCVStyles, renderCV } from "../utils/cvHelpers";

interface UsePDFExportParams {
  editableCV: string;
  cvText: string;
  coverLetter: string;
  selectedTemplate: "serif" | "sans" | "compact";
  forceSinglePage: boolean;
  pdfFile: File | null;
  showToast: (msg: string, type?: "error" | "success" | "info") => void;
}

export function usePDFExport({
  editableCV,
  cvText,
  coverLetter,
  selectedTemplate,
  forceSinglePage,
  pdfFile,
  showToast,
}: UsePDFExportParams) {
  const handleDownloadPDF = useCallback(() => {
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

    const fileName = pdfFile
      ? `${pdfFile.name.replace(".pdf", "")}_Optimized`
      : "Optimized_CV";
    const bodyHtml = renderCV(content);

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${fileName}</title>
  <style>${getCVStyles(selectedTemplate, forceSinglePage)}</style>
</head>
<body style="background: #fff;">
${bodyHtml}
<script>
  window.onload=function(){setTimeout(function(){window.print()},400)};
<\/script>
</body>
</html>`);

    printWindow.document.close();
    showToast("Print dialog opened — choose 'Save as PDF' in your browser.", "success");
  }, [editableCV, cvText, selectedTemplate, forceSinglePage, pdfFile, showToast]);

  const handleDownloadCoverLetterPDF = useCallback(() => {
    if (!coverLetter) {
      showToast("No cover letter content to export.", "error");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow pop-ups and try again.", "error");
      return;
    }

    const fileName = pdfFile
      ? `${pdfFile.name.replace(".pdf", "")}_Cover_Letter`
      : "Cover_Letter";
    const bodyHtml = renderCV(coverLetter);

    const fontFamily =
      selectedTemplate === "serif"
        ? "'Times New Roman','Garamond',serif"
        : selectedTemplate === "sans"
        ? "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif"
        : "'Calibri',sans-serif";

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${fileName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:${fontFamily};font-size:11pt;line-height:1.5;color:#111;background:#fff;padding:20mm 25mm;}
    p{margin-bottom:4mm;}
    h1,h2,h3,h4{margin-bottom:4mm;font-family:${fontFamily};}
    h1{font-size:18pt;text-align:center;text-transform:uppercase;margin-bottom:6mm;}
    @page{margin:0;size:A4}
    @media print{body{padding:20mm 25mm;margin:0;background:#fff;}}
  </style>
</head>
<body style="background: #fff;">
${bodyHtml}
<script>
  window.onload=function(){setTimeout(function(){window.print()},400)};
<\/script>
</body>
</html>`);

    printWindow.document.close();
    showToast(
      "Print dialog opened — choose 'Save as PDF' to export Cover Letter.",
      "success"
    );
  }, [coverLetter, selectedTemplate, pdfFile, showToast]);

  return { handleDownloadPDF, handleDownloadCoverLetterPDF };
}
