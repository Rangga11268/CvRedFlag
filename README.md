# CVRedFlag.ai — ATS Resume Analyzer & Optimizer

Aplikasi web modern berbasis **Next.js 16** dan **Tailwind CSS** untuk memindai red flags pada CV secara instan (di bawah 10 detik), mengidentifikasi kata kunci yang hilang berdasarkan Target Job Description, menulis ulang pengalaman kerja menggunakan **Google XYZ Formula**, serta memformat hasil optimasi ke pratinjau A4 1 halaman yang siap diekspor ke PDF.

Aplikasi ini menggunakan teknologi orkestrasi AI cerdas dengan prioritas tinggi pada **Groq API** (kecepatan kilat) dan **OpenRouter API** sebagai model cadangan gratis dinamis.

---

## ✨ Fitur Utama

- 📊 **ATS Match Score**: Nilai kecocokan CV Anda dengan kriteria lowongan dalam bentuk visual meter yang menarik.
- 🏷️ **Missing Keywords**: Menemukan kata kunci keahlian penting yang belum dicantumkan di CV Anda.
- 🚨 **Recruiter Red Flags**: Menandai poin-poin bermasalah di CV yang sering membuat HRD membuang berkas pelamar.
- ⚡ **Google XYZ Rewriter**: Menulis ulang pengalaman kerja Anda secara otomatis dengan formula terstandarisasi: *Accomplished [X] as measured by [Y], by doing [Z]*.
- 🖥️ **Workspace Pratinjau A4 & Raw Editor**: Panel dual-pane dengan pratinjau skala presisi A4 interaktif dan editor teks mentah markdown yang saling tersinkronisasi.
- 🔄 **Re-scan Real-time**: Evaluasi ulang CV yang sudah di-optimasi terhadap Job Description yang diperbarui langsung dari ruang kerja aktif Anda.
- 🚀 **Dual AI Orchestrator**: Koneksi prioritas tinggi menggunakan Groq API (super cepat) dengan fallback otomatis ke jaringan model gratis OpenRouter.

---

## 🛠️ Cara Menjalankan secara Lokal

1. **Clone project** atau masuk ke direktori proyek.
2. **Instal Dependensi**:
   ```bash
   npm install
   ```
3. **Konfigurasi Variabel Lingkungan**:
   Buat atau buka file `.env.local` di folder root proyek, lalu tambahkan API Keys Anda:
   ```env
   # API Key Groq (Direkomendasikan untuk kecepatan maksimal)
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   
   # API Key OpenRouter (Untuk model fallback gratis)
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. **Jalankan Developer Server**:
   ```bash
   npm run dev
   ```
5. Akses aplikasi melalui browser Anda di `http://localhost:3000`.

---

## 📦 GitHub Setup & Cara Upload ke Repo GitHub

Ikuti langkah-langkah di bawah ini untuk membuat repositori GitHub mandiri untuk proyek ini:

### Langkah 1: Inisialisasi Git Lokal
Pastikan terminal Anda berada di dalam direktori `cv-analyzer-optimizer`, lalu jalankan perintah berikut:
```bash
# Inisialisasi git di folder ini
git init

# Tambahkan semua berkas ke git staging (env.local akan otomatis diabaikan karena .gitignore)
git add .

# Buat commit pertama
git commit -m "feat: inisialisasi CVRedFlag.ai ATS Scanner & Google XYZ Optimizer"

# Ubah nama branch utama menjadi main
git branch -M main
```

### Langkah 2: Buat Repositori Baru di GitHub
1. Buka [GitHub](https://github.com/) dan buat repositori baru (*New Repository*).
2. Beri nama repositori Anda (misalnya `cv-analyzer-optimizer`).
3. **Jangan centang** opsi *Add a README*, *Add .gitignore*, atau *Choose a license* (karena proyek lokal kita sudah memilikinya).
4. Salin URL repositori GitHub Anda (misal: `https://github.com/username/cv-analyzer-optimizer.git`).

### Langkah 3: Hubungkan dan Push ke GitHub
Hubungkan git lokal Anda dengan remote repositori di GitHub, kemudian unggah seluruh kodenya:
```bash
# Hubungkan remote origin dengan URL repo GitHub Anda
git remote add origin <URL_REPOSI_GITHUB_ANDA>

# Unggah kode ke GitHub
git push -u origin main
```

---

## 📄 Struktur Proyek Penting

- [`src/app/page.tsx`](file:///d:/Ngoding/WEB%20Poject/cv-analyzer-optimizer/src/app/page.tsx): Logika state, UI, layout workspace 3 kolom, pratinjau A4, dan kontrol re-scanning.
- [`src/app/api/analyze/route.ts`](file:///d:/Ngoding/WEB%20Poject/cv-analyzer-optimizer/src/app/api/analyze/route.ts): Endpoint AI yang menjembatani orkestrasi model Groq dan OpenRouter.
- [`src/app/globals.css`](file:///d:/Ngoding/WEB%20Poject/cv-analyzer-optimizer/src/app/globals.css): Pengaturan variabel tema light-slate, border kaca, dan print layout pratinjau PDF.
- [`.gitignore`](file:///d:/Ngoding/WEB%20Poject/cv-analyzer-optimizer/.gitignore): Berkas konfigurasi untuk mencegah data sensitif (seperti `.env.local`) terunggah ke repositori publik.
