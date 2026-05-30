import React from "react";
import { motion } from "framer-motion";

interface StepTrackerProps {
  currentStep: number;
}

const StepTracker: React.FC<StepTrackerProps> = ({ currentStep }) => {
  if (currentStep < 0) return null;

  return (
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
  );
};

export default StepTracker;
