import React from "react";
import { motion } from "framer-motion";
import {
  UploadSimple,
  CheckCircle,
  ArrowClockwise,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react";

interface UploadPageProps {
  cvText: string;
  jobDescription: string;
  setJobDescription: (jd: string) => void;
  pdfFile: File | null;
  isParsing: boolean;
  isJdParsing: boolean;
  loading: boolean;
  handlePdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleJdPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  runAnalysisStep: (step: number) => void;
}

const UploadPage: React.FC<UploadPageProps> = ({
  cvText,
  jobDescription,
  setJobDescription,
  pdfFile,
  isParsing,
  isJdParsing,
  loading,
  handlePdfUpload,
  handleJdPdfUpload,
  runAnalysisStep,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start max-w-6xl mx-auto pt-4 sm:pt-8 pb-8 sm:pb-16 px-4 sm:px-6"
    >
      <div className="lg:col-span-6 flex flex-col gap-4 sm:gap-6">
        <span className="px-3.5 py-1 text-[10px] font-bold uppercase rounded-full w-max tracking-wider flex items-center gap-1" style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', color: 'var(--accent)', fontFamily: 'var(--font-jakarta)' }}>
          <Sparkle weight="fill" className="w-3 h-3 text-indigo-600" /> AI Optimizer
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight" style={{ fontFamily: 'var(--font-jakarta)', color: 'var(--text-primary)' }}>
          AI Resume{" "}
          <span className="gradient-text">Builder</span>{" "}
          &amp; Analyzer
        </h1>
        <p className="text-xs sm:text-sm leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Deteksi red flags dalam 10 detik, temukan missing keywords, dan optimalkan CV
          otomatis dengan Google XYZ formula agar lolos ATS.
        </p>

        {/* Upload Form */}
        <div className="p-4 sm:p-6 rounded-2xl flex flex-col gap-4 sm:gap-5 mt-2 backdrop-blur-md relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.02)' }}>
          
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
                className="flex flex-col items-center justify-center text-center gap-2 border border-dashed rounded-xl p-5 sm:p-7 cursor-pointer transition-all"
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
                    <span className="text-xs font-semibold truncate max-w-[220px] sm:max-w-[260px]" style={{ color: 'var(--success)' }}>{pdfFile.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Click to change file</span>
                  </>
                ) : (
                  <>
                    <UploadSimple weight="regular" className="w-5 h-5 sm:w-6 sm:h-6 transition-colors group-hover:scale-110" style={{ color: 'var(--text-muted)' }} />
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
                  className={`flex items-center gap-1.5 text-[9px] font-bold uppercase px-2 py-1 rounded-lg cursor-pointer transition-all ${isJdParsing ? "opacity-60 cursor-wait" : ""}`}
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
              className="w-full h-24 sm:h-28 p-3 rounded-xl text-xs focus:outline-none resize-none transition-all"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <button
            disabled={!cvText || !jobDescription || loading || isParsing}
            onClick={() => runAnalysisStep(1)}
            className="relative w-full py-3 sm:py-3.5 rounded-xl text-white text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
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
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-2 sm:mb-3">
            Trusted By Candidates At
          </span>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 opacity-40 grayscale">
            {["Google", "Microsoft", "Airbnb", "Spotify", "Amazon"].map((co) => (
              <span key={co} className="text-xs font-black text-slate-800">{co}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Mockup */}
      <div className="lg:col-span-6 hidden lg:flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-amber-500/5 rounded-full blur-[100px]" />
        <div className="relative w-[340px] sm:w-[380px] h-[440px] sm:h-[480px] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-200">
          <img
            src="/cv_mockup.webp"
            alt="CV Mockup Illustration"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-transparent to-transparent opacity-40 pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
};

export default UploadPage;
