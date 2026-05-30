import { marked } from "marked";
import {
  User,
  FileText,
  Cpu,
  Briefcase,
  Folder,
  GraduationCap,
  Certificate,
} from "@phosphor-icons/react";
import { SectionConfig } from "../types";

export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const highlightWords = (text: string, searchWords: string[], className: string, highlightMetrics: boolean = false): string => {
  if (!text) return "";
  let html = escapeHtml(text);
  
  if (searchWords && searchWords.length > 0) {
    const words = Array.from(new Set(searchWords.filter(w => w && w.trim().length > 0)));
    if (words.length > 0) {
      const escaped = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
      const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
      html = html.replace(regex, `<mark class="${className}">$1</mark>`);
    }
  }
  
  if (highlightMetrics) {
    const metricRegex = /(\b\d+(?:\.\d+)?%|\b\d+\+|\$\d+(?:\.\d+)?[kK]?)/g;
    html = html.replace(metricRegex, `<mark class="diff-added">$1</mark>`);
  }
  
  return html;
};

export const getRedFlagKeyTerms = (flags: string[]): string[] => {
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

export const sectionsConfig: SectionConfig[] = [
  {
    key: "header",
    title: "Profil & Informasi Kontak",
    icon: User,
    description: "Nama lengkap, profesi, domisili, email, nomor HP, dan link sosial media/portofolio.",
    placeholder: "Contoh:\nJohn Doe\nJakarta, Indonesia | +62 812-3456-7890 | john.doe@email.com | linkedin.com/in/johndoe"
  },
  {
    key: "summary",
    title: "Ringkasan Profesional",
    icon: FileText,
    description: "Pernyataan singkat (2-4 kalimat) yang merangkum latar belakang, keahlian utama, dan tujuan karir Anda.",
    placeholder: "Contoh:\nSoftware Engineer berpengalaman lebih dari 3 tahun dalam pengembangan aplikasi web menggunakan React, Node.js, dan cloud computing..."
  },
  {
    key: "skills",
    title: "Keahlian & Kompetensi",
    icon: Cpu,
    description: "Daftar keterampilan teknis, alat (tools), bahasa, atau keahlian soft-skills.",
    placeholder: "Contoh:\n* Pemrograman: JavaScript, TypeScript, Python, SQL\n* Framework & Libraries: React, Next.js, Node.js, Express, Tailwind CSS\n* Tools & Database: Git, Docker, AWS, PostgreSQL, MongoDB"
  },
  {
    key: "experience",
    title: "Pengalaman Kerja",
    icon: Briefcase,
    description: "Riwayat pekerjaan, jabatan, perusahaan, durasi, serta deskripsi pekerjaan Anda.",
    placeholder: "Contoh:\n### Software Engineer | PT Teknologi Maju (Januari 2022 - Sekarang)\n* Mengembangkan dan memelihara aplikasi web menggunakan Next.js yang meningkatkan retensi pengguna sebesar 15%\n* Berkolaborasi dengan tim produk untuk mendesain arsitektur database PostgreSQL yang lebih efisien"
  },
  {
    key: "projects",
    title: "Proyek Portfolio",
    icon: Folder,
    description: "Proyek-proyek penting yang pernah Anda kerjakan secara mandiri maupun tim.",
    placeholder: "Contoh:\n### E-Commerce Platform | Next.js, Stripe, PostgreSQL\n* Membangun platform e-commerce tangguh dengan fitur pembayaran online terintegrasi\n* Mengoptimalkan performa loading halaman hingga 40% menggunakan Server-Side Rendering"
  },
  {
    key: "education",
    title: "Pendidikan",
    icon: GraduationCap,
    description: "Riwayat pendidikan formal, institusi, jurusan, tahun kelulusan, dan IPK jika ada.",
    placeholder: "Contoh:\n### Sarjana Ilmu Komputer | Universitas Indonesia (2018 - 2022)\n* IPK: 3.85 / 4.00 (Cum Laude)\n* Mata Kuliah Utama: Algoritma, Basis Data, Rekayasa Perangkat Lunak"
  },
  {
    key: "certifications",
    title: "Sertifikasi & Lisensi",
    icon: Certificate,
    description: "Sertifikat keahlian, kursus, atau lisensi profesional yang mendukung profesi Anda.",
    placeholder: "Contoh:\n* AWS Certified Solutions Architect (2023)\n* Google IT Support Professional Certificate (2022)\n* Juara 1 Hackathon Nasional (2021)"
  }
];

export const getCVStyles = (temp: "serif" | "sans" | "compact", force1Page: boolean = false): string => {
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
      padding:${pageMargin};
    }
    .cv-header{text-align:center;margin-bottom:${spacingTop}}
    .cv-header h1{font-family:${h1Font};font-size:${h1FontSize};font-weight:bold;text-transform:uppercase;margin-bottom:1.2mm;letter-spacing:-0.2px}
    .cv-header p{font-size:${force1Page ? "7.5pt" : "8.5pt"};color:#4b5563;margin-bottom:0.8mm;font-weight:normal}
    .cv-header p:first-of-type{font-size:${force1Page ? "8.5pt" : "9.5pt"};color:#111;font-weight:bold;text-transform:uppercase;margin-bottom:1.2mm}
    .cv-header p a{color:#4b5563;text-decoration:none}
    .cv-header p a:hover{text-decoration:underline}
    .cv-availability-box{
      display:inline-block;
      margin-top:1.5mm;
      padding:1mm 2.5mm;
      background:#f3f4f6;
      border-radius:4px;
      font-size:${bodyFontSize};
      font-style:italic;
      color:#4b5563;
      font-weight:500;
    }
    h2{font-family:${font};font-size:${h2FontSize};font-weight:bold;text-transform:uppercase;color:#111;border-bottom:1px solid #111;padding-bottom:0.8mm;margin-top:${spacingTop};margin-bottom:2mm;letter-spacing:0.5px}
    .cv-h3-row{display:flex;justify-content:space-between;align-items:baseline;margin-top:2mm;margin-bottom:0.8mm}
    .cv-h3-left{font-size:${h3FontSize};font-weight:bold;color:#111}
    .cv-h3-right{font-size:${h3FontSize};font-weight:bold;color:#222;font-style:normal}
    p{font-size:${bodyFontSize};color:#222;margin-bottom:1.5mm}
    ul{margin-bottom:2.5mm;padding-left:4.5mm}
    li{font-size:${liFontSize};color:#222;margin-bottom:1mm;line-height:${lineGap}}
    strong{font-weight:bold;color:#000}
    em{font-style:italic}
    
    @media print {
      body {
        padding:${pageMargin} !important;
        background:#fff !important;
        color:#000 !important;
      }
    }
  `;
};

export const formatRawTextToMarkdown = (text: string): string => {
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

export const parseMarkdownToSections = (markdown: string): Record<string, string> => {
  const sections: Record<string, string> = {
    header: "",
    summary: "",
    skills: "",
    experience: "",
    projects: "",
    education: "",
    certifications: ""
  };

  if (!markdown) return sections;

  const lines = markdown.split("\n");
  let currentSection = "header";
  const sectionContent: Record<string, string[]> = {
    header: [],
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: []
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (line.startsWith("##")) {
      const heading = trimmed.toLowerCase();
      if (heading.includes("summary") || heading.includes("professional summary") || heading.includes("tentang saya") || heading.includes("ringkasan")) {
        currentSection = "summary";
      } else if (heading.includes("skill") || heading.includes("keahlian") || heading.includes("kemampuan")) {
        currentSection = "skills";
      } else if (heading.includes("experience") || heading.includes("kerja") || heading.includes("magang") || heading.includes("employment")) {
        currentSection = "experience";
      } else if (heading.includes("project") || heading.includes("proyek")) {
        currentSection = "projects";
      } else if (heading.includes("education") || heading.includes("pendidikan")) {
        currentSection = "education";
      } else if (heading.includes("cert") || heading.includes("sertifikasi") || heading.includes("prestasi")) {
        currentSection = "certifications";
      } else {
        sectionContent[currentSection].push(line);
      }
    } else {
      sectionContent[currentSection].push(line);
    }
  }

  sections.header = sectionContent.header.join("\n").trim();
  sections.summary = sectionContent.summary.join("\n").trim();
  sections.skills = sectionContent.skills.join("\n").trim();
  sections.experience = sectionContent.experience.join("\n").trim();
  sections.projects = sectionContent.projects.join("\n").trim();
  sections.education = sectionContent.education.join("\n").trim();
  sections.certifications = sectionContent.certifications.join("\n").trim();

  return sections;
};

export const renderCV = (md: string): string => {
  marked.setOptions({ gfm: true, breaks: true });
  let html = marked.parse(md) as string;
  
  const h2Index = html.indexOf("<h2");
  if (h2Index !== -1) {
    html = `<div class="cv-header">${html.substring(0, h2Index)}</div>${html.substring(h2Index)}`;
  }
  
  html = html.replace(/<p>(\s*(?:<em>|<strong>)?Availability:[\s\S]*?)<\/p>/gi, (match, innerContent) => {
    return `<div class="cv-availability-box">${innerContent}</div>`;
  });
  
  const isRightAlignedInfo = (str: string) => {
    if (str.length > 45) return false;
    const s = str.toLowerCase();
    return /\b(19|20)\d{2}\b/g.test(s) || 
           s.includes("present") ||
           s.includes("gpa") ||
           s.includes("ipk") ||
           s.includes("http") ||
           s.includes("www.") ||
           s.includes(".com") ||
           s.includes(".org") ||
           s.includes(".me") ||
           s.includes(".net") ||
           s.includes("linkedin") ||
           s.includes("github");
  };

  html = html.replace(/<h3>(.*?)<\/h3>/gi, (match, content) => {
    const decodedContent = content.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—');
    const parts = decodedContent.split('|').map((p: string) => p.trim());
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      if (isRightAlignedInfo(lastPart)) {
        const mainInfo = parts.slice(0, parts.length - 1).join(' | ');
        return `<div class="cv-h3-row">
          <span class="cv-h3-left">${mainInfo}</span>
          <span class="cv-h3-right">${lastPart}</span>
        </div>`;
      }
    }
    return match;
  });

  return html;
};
