"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Sparkle,
  ShieldCheck,
  Lightning,
  Check,
  WarningCircle,
  FileArrowDown
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/10 selection:text-indigo-900 flex flex-col w-full overflow-x-hidden" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
      {/* ── Fixed Header ────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b px-4 sm:px-6 md:px-12 py-3 flex sm:py-3.5 flex-row items-center justify-between transition-all duration-200" style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(226,232,240,0.7)', boxShadow: '0 4px 30px rgba(0,0,0,0.02)' }}>
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <img src="/logo.png" alt="CVRedFlag Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shadow-xs border border-slate-200/50" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900" style={{ fontFamily: "var(--font-jakarta)" }}>CVRedFlag<span className="text-indigo-600">.ai</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
          <a href="#features" className="hover:text-indigo-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50">Fitur</a>
          <a href="#workflow" className="hover:text-indigo-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50">Cara Kerja</a>
          <a href="#pricing" className="hover:text-indigo-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50">Harga</a>
          <a href="#faq" className="hover:text-indigo-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50">FAQ</a>
        </nav>
        <div className="shrink-0">
          <a
            href="/workshop"
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white transition-all rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-sm hover:shadow-indigo-500/25 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              fontFamily: 'var(--font-jakarta)'
            }}
          >
            Buka Workshop <ArrowRight weight="bold" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 pt-24 pb-16 md:pt-36 md:pb-28 max-w-6xl mx-auto w-full">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-200/30 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] bg-rose-200/20 blur-[110px] rounded-full pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Text & CTA */}
          <div className="lg:col-span-5 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 mb-5 sm:mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <Sparkle weight="fill" className="w-3.5 h-3.5 animate-pulse text-indigo-600" /> Optimalkan CV dengan Google XYZ Formula
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.15] lg:leading-[1.1] mb-4 sm:mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Deteksi <span className="text-rose-600">Red Flag</span> CV Anda & Loloskan ATS
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 sm:mb-8 max-w-md">
              Pindai CV Anda terhadap kriteria rekruter senior, temukan kesalahan fatal, dan tulis ulang pengalaman kerja Anda menggunakan formula standar Google secara instan.
            </p>

            {/* Hero CTA Button */}
            <div className="mb-4 w-full sm:w-auto">
              <a
                href="/workshop"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-white font-bold text-xs sm:text-sm rounded-2xl cursor-pointer shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.45)",
                  fontFamily: "var(--font-jakarta)"
                }}
              >
                Mulai Scan & Rewrite Sekarang <ArrowRight weight="bold" className="w-3.5 sm:w-4 sm:h-4 h-3.5" />
              </a>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">100% Gratis Selama Masa Beta</span>
          </div>

          {/* Right Column: Hero App Mockup Showcase */}
          <div className="lg:col-span-7 w-full mt-4 lg:mt-0">
            <div className="w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)] bg-white p-1.5 sm:p-2 hover:shadow-[0_25px_60px_rgba(15,23,42,0.1)] transition-all duration-300">
              <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b border-slate-100 bg-slate-50/55 text-left">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono">cvredflag.ai/workshop</span>
                <div className="w-8 sm:w-12" /> {/* spacing element */}
              </div>
              <img
                src="/hero_mockup.png"
                alt="CVRedFlag AI Workspace Mockup"
                className="w-full h-auto object-cover rounded-b-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────── */}
      <section id="features" className="bg-white border-y border-slate-200/60 py-24 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Fitur Utama Pengoptimalan CV AI
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              Analisis cerdas yang melampaui pencarian kata kunci biasa untuk memastikan resume Anda memikat rekruter manusia dan algoritme ATS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:shadow-xl hover:border-slate-200/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 border border-rose-100">
                <WarningCircle weight="bold" className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Detektor Red Flags</h4>
              <p className="text-xs text-slate-550 leading-relaxed">
                Pindai otomatis frasa ambigu, format berantakan, celah karir, atau klaim kompetensi yang tidak verifikasi sebelum rekruter menyadarinya.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:shadow-xl hover:border-slate-200/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 border border-indigo-100">
                <Sparkle weight="bold" className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Google XYZ Formula Rewrite</h4>
              <p className="text-xs text-slate-550 leading-relaxed">
                Tulis ulang poin pengalaman kerja Anda menjadi format berorientasi aksi: "Mencapai [X], diukur dengan [Y], dengan melakukan [Z]".
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:shadow-xl hover:border-slate-200/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100">
                <ShieldCheck weight="bold" className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Optimasi Kecocokan ATS</h4>
              <p className="text-xs text-slate-550 leading-relaxed">
                Ekstrak keyword penting dari Job Description target secara semantik dan temukan kata kunci mana yang hilang di resume Anda untuk diintegrasikan secara organik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works Section ────────────────────────────────── */}
      <section id="workflow" className="py-24 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Proses Optimasi 5-Fase Kami
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Dari draf pertama hingga versi final yang siap dikirim, inilah langkah sistematis pelolosan resume Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 -z-10 hidden md:block" />
          
          {[
            { phase: "Fase 1", name: "Unggah Dokumen", desc: "Unggah resume PDF lama Anda beserta deskripsi pekerjaan." },
            { phase: "Fase 2", name: "Pemindaian Rekruter", desc: "Pendeteksian Red Flag otomatis & analisis skor awal." },
            { phase: "Fase 3", name: "Rewrite Aksi", desc: "Penyusunan ulang poin pencapaian dengan formula Google XYZ." },
            { phase: "Fase 4", name: "Kompilasi Layout", desc: "Layout otomatis ke format A4 standar industri ramah ATS." },
            { phase: "Fase 5", name: "Surat Lamaran", desc: "Pembuatan Cover Letter pencocok bernilai tinggi secara opsional." }
          ].map((step, idx) => (
            <div key={idx} className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs text-center flex flex-col items-center">
              <span className="text-[10px] font-black text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>{step.phase}</span>
              <h5 className="font-bold text-xs text-slate-800 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>{step.name}</h5>
              <p className="text-[11px] text-slate-450 leading-relaxed mt-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing Section ────────────────────────────────────── */}
      <section id="pricing" className="bg-slate-100 border-y border-slate-200/50 py-24 px-6">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Skema Harga
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Semua fitur premium saat ini gratis digunakan selama masa beta.
            </p>
          </div>

          <div className="w-full max-w-2xl mx-auto bg-white border-2 border-dashed border-indigo-200/80 p-8 md:p-10 rounded-3xl shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-650 text-white text-[9px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl" style={{ fontFamily: 'var(--font-jakarta)' }}>Beta Version</div>
            
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Coming Soon · Gratis Selama Beta
            </span>
            
            <h4 className="text-2xl font-black text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Semua Fitur Premium Terbuka
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-8">
              Selama masa pengujian beta ini, semua fitur optimasi otomatis AI (Google XYZ Formula), pendeteksi red flag mendalam, template A4, dan cover letter generator dapat diakses gratis sepenuhnya. Skema berbayar akan datang segera.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg mx-auto text-left mb-8 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Check weight="bold" className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Auto-Rewrite Google XYZ (AI)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Check weight="bold" className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Analisis Detail Red Flags</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Check weight="bold" className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Template A4 Premium Lengkap</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-650">
                <Check weight="bold" className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Generator Cover Letter Otomatis</span>
              </div>
            </div>

            <a
              href="/workshop"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-105 hover:scale-[1.02] active:scale-[0.98]"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              Mulai Pakai Sekarang (Gratis)
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 max-w-3xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Pertanyaan Umum (FAQ)
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Semua hal yang perlu Anda ketahui tentang sistem kerja algoritma kami.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {[
            { q: "Apa itu Google XYZ Formula?", a: "Ini adalah rumus pencapaian karir yang dirancang oleh Google untuk merinci poin resume. Rumusnya berbunyi: 'Mencapai [X], yang diukur dengan [Y], dengan melakukan [Z]'. Hal ini memandu Anda menulis bukti nyata daripada sekedar deskripsi tugas." },
            { q: "Bagaimana cara kerja deteksi Red Flag?", a: "AI menganalisis tata bahasa, struktur kalimat, frasa pasif, ketiadaan metrik kuantitatif, dan inkonsistensi data tanggal di CV Anda untuk memberikan masukan perbaikan objektif." },
            { q: "Apakah CV hasil ekspor dijamin lolos ATS?", a: "Meskipun tidak ada tool yang menjamin 100% karena kriteria rekruter bervariasi, template kami dirancang mengikuti standar parsing ATS modern (satu kolom, font sistem bawaan, tanpa tabel kompleks atau gambar dekoratif)." },
            { q: "Bagaimana data CV saya dilindungi?", a: "Teks resume Anda diproses secara anonim dan langsung ditransfer melalui koneksi SSL terenkripsi untuk analisis AI sekali pakai. Kami tidak menyimpan atau menjual dokumen CV Anda ke pihak ketiga." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all">
              <button onClick={() => toggleFaq(idx)} className="w-full p-5 text-left font-bold text-xs text-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50" style={{ fontFamily: 'var(--font-jakarta)' }}>
                <span>{item.q}</span>
                <span className="text-slate-450 shrink-0 text-lg">{faqOpen === idx ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {faqOpen === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100/50 pt-3 bg-slate-50/20">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-300 py-16 px-6 border-t border-slate-900 relative">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="CVRedFlag Logo" className="w-8 h-8 rounded-lg object-cover shadow-xs border border-slate-800" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span className="font-extrabold text-base tracking-tight text-white" style={{ fontFamily: "var(--font-jakarta)" }}>CVRedFlag<span className="text-indigo-500">.ai</span></span>
            </div>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              Platform bertenaga AI untuk menganalisis red flag resume, mencocokkan skor ATS secara semantik, dan menulis ulang CV menggunakan formula standar Google XYZ secara instan.
            </p>
            <div className="flex items-center gap-2 mt-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Semua Sistem Operasional (Beta)</span>
            </div>
          </div>

          {/* Product Links Col */}
          <div className="flex flex-col items-start gap-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200" style={{ fontFamily: 'var(--font-jakarta)' }}>Platform</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 font-semibold">
              <a href="#features" className="hover:text-white transition-colors">Fitur Utama</a>
              <a href="#workflow" className="hover:text-white transition-colors">Proses 5-Fase</a>
              <a href="/workshop" className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">Buka Workspace <ArrowRight className="w-3 h-3" /></a>
            </div>
          </div>

          {/* Resources Links Col */}
          <div className="flex flex-col items-start gap-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200" style={{ fontFamily: 'var(--font-jakarta)' }}>Dukungan</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 font-semibold">
              <a href="#faq" className="hover:text-white transition-colors">Pertanyaan Umum</a>
              <a href="#pricing" className="hover:text-white transition-colors">Harga</a>
              <span className="text-slate-600 cursor-not-allowed">Kebijakan Privasi (Soon)</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} CVRedFlag.ai. Hak Cipta Dilindungi.</span>
          <div className="flex items-center gap-6">
            <span>Dibuat dengan dedikasi tinggi untuk pelamar kerja Indonesia.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
