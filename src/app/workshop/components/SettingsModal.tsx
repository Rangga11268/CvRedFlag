import React, { useState, useEffect } from "react";
import { X, Key, Gear, Info } from "@phosphor-icons/react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, showToast }) => {
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      setGeminiKey(localStorage.getItem("cv_redflag_gemini_api_key") || "");
      setOpenrouterKey(localStorage.getItem("cv_redflag_openrouter_api_key") || "");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cv_redflag_gemini_api_key", geminiKey.trim());
      localStorage.setItem("cv_redflag_openrouter_api_key", openrouterKey.trim());
    }
    showToast("Pengaturan API Key berhasil disimpan!", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden relative z-10 flex flex-col animate-fade-in">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center">
              <Gear weight="fill" className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Pengaturan API Key
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X weight="bold" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-2.5 text-indigo-800 text-[11px] leading-relaxed">
            <Info weight="fill" className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Gunakan API Key gratis Anda untuk menghindari limitasi kuota demo bersama. API Key disimpan secara lokal di browser Anda dan <strong>tidak pernah dikirim ke database luar</strong> selain ke server provider.
            </p>
          </div>

          {/* Gemini Key Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Google Gemini API Key
              </label>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[9px] font-bold text-indigo-600 hover:underline"
              >
                Dapatkan Key Gratis →
              </a>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 transition-all font-mono"
              />
            </div>
            <span className="text-[9px] text-slate-450 leading-relaxed">
              Disarankan. Kuota gratis sangat besar (15 RPM) & performa sangat cepat untuk model <strong>Gemini 2.5 Flash</strong>.
            </span>
          </div>

          {/* OpenRouter Key Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'var(--font-jakarta)' }}>
                OpenRouter API Key
              </label>
              <a 
                href="https://openrouter.ai/settings/keys" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[9px] font-bold text-indigo-600 hover:underline"
              >
                Dapatkan Key Gratis →
              </a>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 transition-all font-mono"
              />
            </div>
            <span className="text-[9px] text-slate-450 leading-relaxed">
              Digunakan sebagai cadangan untuk model-model open source gratis lainnya.
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
