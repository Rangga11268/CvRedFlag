/**
 * Step 3: ATS Layout Compilation Prompts
 * Compiles the final complete CV structure with proper ATS formatting.
 * Handles both Software Engineer and General Professional templates.
 */

export interface Step3Params {
  cvText: string;
  jobDescription: string;
  rewrittenExperience: string;
  jobCategory?: "software_engineer" | "general";
  cvLanguage?: "auto" | "id" | "en" | "bilingual";
}

export interface Step3Result {
  systemPrompt: string;
  userPrompt: string;
}

function buildLanguageGuidelines(cvLanguage: string): string {
  if (cvLanguage === "en") {
    return `LANGUAGE & HEADING GUIDELINES:
- You MUST compile the entire resume in English (including summary, headers, work experience, projects, and skills). Translate any Indonesian details to English if necessary.
- Use English headings: "ABOUT ME" or "PROFESSIONAL SUMMARY", "TECHNICAL SKILLS" or "SKILLS", "WORK EXPERIENCE", "PROJECTS", "EDUCATION", "CERTIFICATIONS & ACHIEVEMENTS" or "CERTIFICATION".`;
  } else if (cvLanguage === "id") {
    return `LANGUAGE & HEADING GUIDELINES:
- You MUST compile the entire resume in Bahasa Indonesia. Translate any English details to Bahasa Indonesia if necessary.
- Use Indonesian headings: "TENTANG SAYA", "KEAHLIAN" or "KEAHLIAN TEKNIS", "PENGALAMAN MAGANG / KERJA", "PROYEK", "PENDIDIKAN", "SERTIFIKASI & PRESTASI".`;
  } else if (cvLanguage === "bilingual") {
    return `LANGUAGE & HEADING GUIDELINES:
- You MUST compile the resume in Bilingual format (ID/EN). Use combined or side-by-side English & Bahasa Indonesia translation for summaries and bullet details.
- Use bilingual headings: "PROFESSIONAL SUMMARY / RINGKASAN PROFESIONAL", "EDUCATION / PENDIDIKAN", "WORK EXPERIENCE / PENGALAMAN KERJA", "PROJECTS / PROYEK", "SKILLS / KEMAMPUAN".`;
  }
  return `LANGUAGE & HEADING GUIDELINES:
- Adapt the section headers language matching the original CV language style.
- If original CV is in Indonesian, use Indonesian headings: "TENTANG SAYA", "PENGALAMAN MAGANG / KERJA", "PENDIDIKAN", "PENGALAMAN ORGANISASI", "SERTIFIKASI", "KEAHLIAN".
- If English: "ABOUT ME" or "PROFESSIONAL SUMMARY", "WORK EXPERIENCE", "EDUCATION", "ORGANIZATION EXPERIENCE", "CERTIFICATION", "SKILLS".
- If bilingual (ID/EN), use bilingual headings: "PROFESSIONAL SUMMARY / RINGKASAN PROFESIONAL", "EDUCATION / PENDIDIKAN", "WORK EXPERIENCE / PENGALAMAN KERJA", "ORGANIZATIONAL EXPERIENCE / PENGALAMAN ORGANISASI", "SKILLS / KEMAMPUAN".`;
}

export function buildStep3Prompts(params: Step3Params): Step3Result {
  const {
    cvText,
    jobDescription,
    rewrittenExperience,
    jobCategory = "general",
    cvLanguage = "auto",
  } = params;

  const isSoftwareEngineer = jobCategory === "software_engineer";
  const languageGuidelines = buildLanguageGuidelines(cvLanguage);

  const systemPrompt =
    "You are an elite ATS optimization expert. You compile complete, 1-page, scroll-stopping resumes that pass both ATS filters and human hiring managers in under 10 seconds.";

  let userPrompt: string;

  if (isSoftwareEngineer) {
    userPrompt = `Compile the FINAL complete ATS-optimized 1-page resume using the rewritten experience below and the original CV data. Follow the structure of a Software Engineer / Programmer resume:

STRICT FORMAT RULES — follow exactly:
1. Name centered as H1.
2. Job Title centered below the name. Use the exact job title from the candidate's original CV under their name (e.g., "PHP BACK END DEVELOPER" or "FULLSTACK DEVELOPER"). Do NOT generalize it to "SOFTWARE ENGINEER" if the original title is more specific. Keep it in UPPERCASE.
3. Center the contact details. Split them onto 1 or 2 lines to make it look clean:
   Line 1: [City, State/Province] | [Email] | [Phone Number]
   Line 2: [Personal Website/Portfolio] | [LinkedIn] | [GitHub]
   CRITICAL: Keep all email addresses and links in lowercase (e.g., 'darrelrangga@gmail.com' and 'darellrangga.me'). Do NOT capitalize them.
4. If there is an availability status line in the original CV (e.g., "Availability: Independent Contractor / Fully Remote (Ready to collaborate with distributed, international teams)"), you MUST include it verbatim as a centered paragraph directly below the contact details, styled as:
   Availability: [Details]
5. Section headers as H2 ALL-CAPS (e.g., ## WORK EXPERIENCE)
6. Work experience bullet points using "- " prefix, Google XYZ formula, and MUST keep any bracketed category prefix at the start of each bullet point (e.g., "[Backend Architecture & Scalability] Engineered...") if they exist.
7. For projects, format the header as: "### [Project Name] | [Tech Stack]" or "### [Project Name] | [Tech Stack] | [Link]". If a project has a "Focus:" line in the original CV, preserve it verbatim as a separate line right below the title in italics, e.g. *Focus: PHP (Laravel 12), MySQL Optimization, Design Patterns*.
8. Max 1 page when printed — be ruthlessly concise.
9. Output ONLY clean Markdown, no explanations, no preamble.
10. CRITICAL WARNING: The Job Description is the target company and role the candidate is applying for. Do NOT add the target company or target role to the candidate's work experience. The candidate has NEVER worked there. Only include the candidate's original work experiences and companies from the Original CV data.

${languageGuidelines}

REQUIRED SECTIONS IN ORDER:
# [NAMA LENGKAP / FULL NAME]
[Job Title]
[Kota, Provinsi] | [Email] | [Nomor Telepon]
[LinkedIn URL] | [GitHub URL] | [Portfolio URL]
Availability: [If exists]

## [PROFESSIONAL SUMMARY / SUMMARY]
Detail-oriented Software Engineer with experience in building, testing, and deploying full-stack web applications. Proficient in key programming languages and modern frameworks. Strong track record of optimizing database performance, developing RESTful APIs, and delivering scalable software solutions.

## [TECHNICAL SKILLS / SKILLS]
Format as a bulleted list of 4-5 items. Group skills logically and professionally. Use custom professional categories that reflect the candidate's actual strengths (e.g., "Backend & API", "Database Optimization", "Code Quality & Evaluation", "Frontend & Mobile", "Tools & DevOps") rather than just generic "Languages", "Frameworks".
Format each item as:
* **Category Name:** Skill 1, Skill 2, Skill 3, etc.

## [WORK EXPERIENCE / PENGALAMAN KERJA]
### [Job Title] | [Company] | [Dates]
- [Category] [XYZ bullet]
- [Category] [XYZ bullet]

## [PROJECTS / PROYEK]
### [Project Name] | [Tech Stack] | [GitHub / Live URL]
*Focus: [Tech focus if exists]*
- [XYZ bullet describing what was built, measuring speed/metrics, and tools used]
- [XYZ bullet]

## [EDUCATION / PENDIDIKAN]
### [Degree] | [University] | [GPA if strong]

## [CERTIFICATIONS & ACHIEVEMENTS / SERTIFIKASI]
* **[Sertifikasi / Penghargaan]** – [Penerbit / Penyelenggara], [Bulan Tahun]

---
Rewritten Experience Section:
${rewrittenExperience}

Original CV data:
${cvText}

Job Description (ATS keywords to include):
${jobDescription}

Output the complete final resume in Markdown NOW:`;
  } else {
    userPrompt = `Compile the FINAL complete ATS-optimized 1-page resume using the rewritten experience below and the original CV data. Follow the general professional resume template:

STRICT FORMAT RULES — follow exactly:
1. Name centered as H1.
2. Job Title centered below the name. Use the exact job title from the candidate's original CV under their name. Keep it in UPPERCASE.
3. Center the contact details. Split them onto 1 or 2 lines to make it look clean:
   Line 1: [City, State/Province] | [Email] | [Phone Number]
   Line 2: [Personal Website/Portfolio] | [LinkedIn] | [GitHub]
   CRITICAL: Keep all email addresses and links in lowercase. Do NOT capitalize them.
4. If there is an availability status line in the original CV (e.g., "Availability: ..."), you MUST include it verbatim as a centered paragraph directly below the contact details, styled as:
   Availability: [Details]
5. Section headers as H2 ALL-CAPS (e.g., ## WORK EXPERIENCE)
6. Work experience bullet points using "- " prefix, Google XYZ formula, and MUST keep any bracketed category prefix at the start of each bullet point if they exist.
7. For projects, format the header as: "### [Project Name] | [Tech Stack]" or "### [Project Name] | [Tech Stack] | [Link]". If a project has a "Focus:" line in the original CV, preserve it verbatim as a separate line right below the title in italics.
8. Max 1 page when printed — be ruthlessly concise.
9. Output ONLY clean Markdown, no explanations, no preamble.
10. CRITICAL WARNING: The Job Description is the target company and role the candidate is applying for. Do NOT add the target company or target role to the candidate's work experience. The candidate has NEVER worked there. Only include the candidate's original work experiences and companies from the Original CV data.

${languageGuidelines}

SKILLS SECTION FORMATTING:
- Format the SKILLS / KEAHLIAN section as inline groupings separated by "●" to save vertical space.
- Example: 
  * ● Hard Skill : A, B, C ● Software : X, Y, Z ● Bahasa : Indo, English
- Do NOT use long vertical bullet lists for skills. Keep to 2-3 lines max.

REQUIRED SECTIONS IN ORDER:
# [FULL NAME]
[Job Title]
[City, Country] | [email] | [phone]
[website/LinkedIn/GitHub]
Availability: [If exists]

## [PROFESSIONAL SUMMARY / TENTANG SAYA]
2-3 punchy lines. ATS keywords front-loaded. Quantify impact.

## [SKILLS / KEAHLIAN]
* ● Hard Skill : ... ● Software : ... ● Bahasa : ...

## [WORK EXPERIENCE / PENGALAMAN MAGANG / KERJA]
### [Title] | [Company] | [Dates]
- [XYZ bullet]
- [XYZ bullet]

## [PENGALAMAN ORGANISASI / ORGANIZATION EXPERIENCE]
### [Position] | [Organization] | [Dates]
- [describe leadership activity and outcome]

## [EDUCATION / PENDIDIKAN]
### [Degree] | [University] | [GPA if strong]

## [CERTIFICATIONS / SERTIFIKASI]
- [Certification Name] - [Issuing Organization] (Year)

---
Rewritten Experience Section:
${rewrittenExperience}

Original CV data:
${cvText}

Job Description (ATS keywords to include):
${jobDescription}

Output the complete final resume in Markdown NOW:`;
  }

  return { systemPrompt, userPrompt };
}
