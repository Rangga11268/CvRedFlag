import React from "react";
import { FileArrowDown } from "@phosphor-icons/react";

interface InitialSplashProps {
  isInitializing: boolean;
}

const InitialSplash: React.FC<InitialSplashProps> = ({ isInitializing }) => {
  return (
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
  );
};

export default InitialSplash;
