import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { 
      step, 
      cvText, 
      jobDescription, 
      missingKeywords, 
      redFlags, 
      rewrittenExperience, 
      openrouterApiKey, 
      isReanalysis, 
      originalRedFlags, 
      originalKeywords,
      keyword,
      language,
      format,
      jobCategory,
      cvLanguage
    } = await req.json();

    // Determine API Keys
    const groqApiKey = process.env.GROQ_API_KEY;
    const openrouterKey = openrouterApiKey || process.env.OPENROUTER_API_KEY;
    if (!groqApiKey && !openrouterKey) {
      return NextResponse.json(
        { error: "API Key Groq (di .env.local) atau OpenRouter tidak ditemukan. Harap masukkan API Key Anda." },
        { status: 400 }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";
    let responseFormat: any = undefined;

    if (step === 1) {
      if (isReanalysis) {
        systemPrompt = "You are a senior ATS recruiter and analyst. Verify if the optimized CV has successfully resolved the previous red flags, integrated missing keywords, and improved its overall score based on the professional rubric. Respond ONLY in raw JSON — no markdown, no code blocks, no extra text.";
        userPrompt = `Analyze the optimized CV against the target Job Description and compare it with the original issues.

Also determine the job category: return "software_engineer" if the CV content relates to software development, programming, coding, IT engineering, or includes developer links like GitHub/Portfolio. Otherwise, return "general".

You must calculate the score (0-100) strictly based on this weighted rubric:
1. Keyword Matching & Relevance (Max 40 points): Compare CV with Job Description. How well are key skills and tools integrated?
2. Impact & Action Verbs (Max 25 points): Check for strong action verbs (Developed, Optimized, etc.) and quantified metrics (%, $, numbers, timeframes).
3. Structural Completeness (Max 20 points): Ensure presence of critical sections: Contact, Professional Summary, Work Experience/Projects, Education, Skills. Deduct 4 points for each missing section.
4. Readability & Formatting (Max 15 points): Word count (ideal 400-800), avoidance of first-person pronouns ("I", "me", "Saya", "Aku"), clean layout.

Return ONLY this JSON format:
{
  "score": <total sum of breakdown scores, 0-100>,
  "breakdown": {
    "keywords": <score 0-40>,
    "impact": <score 0-25>,
    "structure": <score 0-20>,
    "readability": <score 0-15>
  },
  "missingKeywords": ["any keywords from the original list that are STILL missing from the optimized CV"],
  "redFlags": ["any red flags from the original list that are STILL present in the optimized CV"],
  "resolvedKeywords": ["keywords from the original list that are now successfully added/present in the optimized CV"],
  "resolvedRedFlags": ["red flags from the original list that are now successfully resolved/removed in the optimized CV"],
  "detectedJobCategory": "software_engineer" or "general"
}

Target Job Description:
${jobDescription}

Optimized CV:
${cvText}

Original Red Flags to verify:
${JSON.stringify(originalRedFlags)}

Original Missing Keywords to verify:
${JSON.stringify(originalKeywords)}`;
      } else {
        systemPrompt = "You are a senior ATS analyst and recruiter. Analyze the candidate's CV against the job description. Respond ONLY in raw JSON — no markdown, no code blocks, no extra text.";
        userPrompt = `Act as a senior recruiter. Analyze the resume against the job description.
Identify missing keywords (up to 5) and red flags (up to 3).

Also determine the job category: return "software_engineer" if the CV content relates to software development, programming, coding, IT engineering, or includes developer links like GitHub/Portfolio. Otherwise, return "general".

Calculate the score (0-100) strictly based on this weighted rubric:
1. Keyword Matching & Relevance (Max 40 points): Check overlap of skills/tools between CV and Job Description.
2. Impact & Action Verbs (Max 25 points): Look for action verbs combined with quantified metrics/results.
3. Structural Completeness (Max 20 points): Ensure sections (Contact, Professional Summary, Work Experience/Projects, Education, Skills) are present. Deduct 4 points for each missing section.
4. Readability & Formatting (Max 15 points): Word count (ideal 400-800 words), absence of first-person pronouns ("Saya", "Aku", "I"), formatting clarity.

Return ONLY this JSON:
{
  "score": <total sum of breakdown scores, 0-100>,
  "breakdown": {
    "keywords": <score 0-40>,
    "impact": <score 0-25>,
    "structure": <score 0-20>,
    "readability": <score 0-15>
  },
  "missingKeywords": ["up to 5 specific skills/tools missing from the CV"],
  "redFlags": ["up to 3 red flags a hiring manager spots in under 10 seconds"],
  "detectedJobCategory": "software_engineer" or "general"
}

Job Description:
${jobDescription}

Resume/CV:
${cvText}`;
      }
      responseFormat = { type: "json_object" };

    } else if (step === 2) {
      systemPrompt = "You are an expert ATS resume writer. You rewrite experience bullets using the Google XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'. Output clean Markdown only.";
      
      let langInstruction = "";
      if (cvLanguage === "en") {
        langInstruction = "- You MUST write all the rewritten experience bullets and headers in English. Translate them to English if the original CV is in Indonesian.";
      } else if (cvLanguage === "id") {
        langInstruction = "- You MUST write all the rewritten experience bullets and headers in Bahasa Indonesia. Translate them to Bahasa Indonesia if the original CV is in English.";
      } else if (cvLanguage === "bilingual") {
        langInstruction = "- You MUST write all the rewritten experience bullets and headers in Bilingual format (English / Bahasa Indonesia translation side-by-side or combined).";
      } else {
        langInstruction = "- Maintain the dominant language of the original CV (English or Bahasa Indonesia).";
      }

      userPrompt = `Rewrite ONLY the Work Experience / Project section of this CV. 

Rules:
- Every bullet MUST use Google XYZ: "Accomplished [X] as measured by [Y], by doing [Z]"
- Naturally embed these missing keywords: ${JSON.stringify(missingKeywords)}
- Remove these red flags: ${JSON.stringify(redFlags)}
- Keep role titles and company names intact. Do NOT invent new companies, roles, or past projects.
- CRITICAL WARNING: The Job Description is the target company and role they are applying for. Do NOT add the target company (e.g. PT Cartenz Technology Indonesia) or target role (e.g. Fullstack Developer at target company) to the candidate's work experience. The candidate has NEVER worked there.
- CRITICAL FORMAT RULE: If the Original CV has bracketed prefix categories at the beginning of bullet points (e.g., "[Backend Architecture & Scalability]"), you MUST preserve those bracketed prefix categories at the start of each rewritten Google XYZ bullet point.
${langInstruction}
- Use this Markdown structure:

## WORK EXPERIENCE
### [Job Title] | [Company] | [Date Range]
- [Category Name] Accomplished X as measured by Y, by doing Z
- [Category Name] Accomplished X as measured by Y, by doing Z

## PROJECTS
### [Project Name] | [Tech Stack]
- Accomplished X as measured by Y, by doing Z

Original CV:
${cvText}

Job Description:
${jobDescription}

Output ONLY the Experience and Projects sections in Markdown. Nothing else.`;

    } else if (step === 3) {
      systemPrompt = "You are an elite ATS optimization expert. You compile complete, 1-page, scroll-stopping resumes that pass both ATS filters and human hiring managers in under 10 seconds.";
      
      const isSoftwareEngineer = jobCategory === "software_engineer";

      let languageGuidelines = "";
      if (cvLanguage === "en") {
        languageGuidelines = `LANGUAGE & HEADING GUIDELINES:
- You MUST compile the entire resume in English (including summary, headers, work experience, projects, and skills). Translate any Indonesian details to English if necessary.
- Use English headings: "ABOUT ME" or "PROFESSIONAL SUMMARY", "TECHNICAL SKILLS" or "SKILLS", "WORK EXPERIENCE", "PROJECTS", "EDUCATION", "CERTIFICATIONS & ACHIEVEMENTS" or "CERTIFICATION".`;
      } else if (cvLanguage === "id") {
        languageGuidelines = `LANGUAGE & HEADING GUIDELINES:
- You MUST compile the entire resume in Bahasa Indonesia. Translate any English details to Bahasa Indonesia if necessary.
- Use Indonesian headings: "TENTANG SAYA", "KEAHLIAN" or "KEAHLIAN TEKNIS", "PENGALAMAN MAGANG / KERJA", "PROYEK", "PENDIDIKAN", "SERTIFIKASI & PRESTASI".`;
      } else if (cvLanguage === "bilingual") {
        languageGuidelines = `LANGUAGE & HEADING GUIDELINES:
- You MUST compile the resume in Bilingual format (ID/EN). Use combined or side-by-side English & Bahasa Indonesia translation for summaries and bullet details.
- Use bilingual headings: "PROFESSIONAL SUMMARY / RINGKASAN PROFESIONAL", "EDUCATION / PENDIDIKAN", "WORK EXPERIENCE / PENGALAMAN KERJA", "PROJECTS / PROYEK", "SKILLS / KEMAMPUAN".`;
      } else {
        languageGuidelines = `LANGUAGE & HEADING GUIDELINES:
- Adapt the section headers language matching the original CV language style.
- If original CV is in Indonesian, use Indonesian headings: "TENTANG SAYA", "PENGALAMAN MAGANG / KERJA", "PENDIDIKAN", "PENGALAMAN ORGANISASI", "SERTIFIKASI", "KEAHLIAN".
- If English: "ABOUT ME" or "PROFESSIONAL SUMMARY", "WORK EXPERIENCE", "EDUCATION", "ORGANIZATION EXPERIENCE", "CERTIFICATION", "SKILLS".
- If bilingual (ID/EN), use bilingual headings: "PROFESSIONAL SUMMARY / RINGKASAN PROFESIONAL", "EDUCATION / PENDIDIKAN", "WORK EXPERIENCE / PENGALAMAN KERJA", "ORGANIZATIONAL EXPERIENCE / PENGALAMAN ORGANISASI", "SKILLS / KEMAMPUAN".`;
      }

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
10. CRITICAL WARNING: The Job Description is the target company and role the candidate is applying for. Do NOT add the target company (e.g. PT Cartenz Technology Indonesia) or target role to the candidate's work experience. The candidate has NEVER worked there. Only include the candidate's original work experiences and companies from the Original CV data.

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
10. CRITICAL WARNING: The Job Description is the target company and role the candidate is applying for. Do NOT add the target company (e.g. PT Cartenz Technology Indonesia) or target role to the candidate's work experience. The candidate has NEVER worked there. Only include the candidate's original work experiences and companies from the Original CV data.

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

    } else if (step === 4) {
      systemPrompt = "You are an elite ATS resume writer and counselor. Suggest EXACTLY where and how to integrate a missing keyword into the resume. Provide a single concrete bullet point recommendation using the Google XYZ formula.";
      userPrompt = `Suggest how to integrate the missing keyword: "${keyword}" into the candidate's CV.
Provide a clear 1-2 sentence suggestion. Focus on where to insert it and write a matching bullet point.

Keyword: ${keyword}
CV: ${cvText}
Job Description: ${jobDescription}`;

    } else if (step === 5) {
      const isIndo = language === "id";
      const isEmail = format?.startsWith("body_email");
      const emailOpsi = format === "body_email_2" ? 2 : 1;
      const isSoftwareEngineer = jobCategory === "software_engineer";

      const currentDate = new Date();
      const todayDateString = isIndo
        ? currentDate.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
        : currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      systemPrompt = `You are an elite executive career coach, ATS resume writer, and programmer recruiter. Write a highly professional and tailored ${isEmail ? "Body Email cover draft" : "1-page Cover Letter"} in ${isIndo ? "Bahasa Indonesia" : "English"} for a ${isSoftwareEngineer ? "Software Engineer / IT Professional" : "General Professional"}. Respond ONLY in Markdown.`;
      
      if (isSoftwareEngineer) {
        if (isEmail) {
          userPrompt = `Write a professional Job Application Body Email in ${isIndo ? "Bahasa Indonesia" : "English"} for a Software Engineer, following this template format:
Subject: Application for [Job Title] - [Your Full Name]

Dear Hiring Manager / [Recruiter Name],

My name is [Your Full Name], and I am writing to express my interest in the [Job Title] position at [Company Name]. With a strong background in software development and hands-on experience building applications using [Key Tech 1] and [Key Tech 2], I am excited about the opportunity to contribute to your engineering team.

In my recent experience, I successfully [mention 1 main technical accomplishment using quantitative metrics, e.g., optimized database queries reducing API latency by 35%]. I am highly passionate about writing clean, maintainable code, solving complex architectural challenges, and continuously learning new technologies.

I have attached my resume, which details my technical skills and project portfolio. You can also view my source code and previous works on my GitHub at [GitHub URL] and portfolio at [Portfolio URL].

Thank you for your time and consideration. I look forward to the possibility of discussing how my technical background aligns with the goals of [Company Name].

Best regards,

[Your Full Name]
[Phone Number]
[GitHub URL]
[LinkedIn / Portfolio URL]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- If recipient name is unknown, use a polite general salutation like "Dear Hiring Team,".
- Highlight specific tech stacks and quantitative achievements from the candidate's CV.
- Output ONLY the final Subject and Body in Markdown format, with "Subject: ..." as the very first line. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
        } else {
          userPrompt = `Write a formal Cover Letter in ${isIndo ? "Bahasa Indonesia" : "English"} for a Software Engineer, following this template format:
${todayDateString}

[Sender Name]
[City, Country] | [Email] | [Phone]
[LinkedIn] | [GitHub]

To:
Hiring Manager
[Company Name]
[Company Address Placeholder]

Dear Hiring Manager / [Recruiter Name],

My name is [Your Full Name], and I am writing to express my interest in the [Job Title] position at [Company Name]. With a strong background in software engineering and hands-on experience building scalable applications using [Key Tech 1] and [Key Tech 2], I am excited about the opportunity to contribute to your team.

In my recent experience, I successfully [describe 1-2 main technical accomplishments with quantitative metrics and how you solved them using specific tools]. I am highly passionate about writing clean, maintainable code, solving complex architectural challenges, and continuously learning new technologies.

I have attached my resume, which details my technical skills and project portfolio. You can also view my source code and previous works on my GitHub at [GitHub URL].

Thank you for your time and consideration. I look forward to the possibility of discussing how my technical background aligns with the goals of [Company Name].

Best regards,

[Your Full Name]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- Tailor details to Tokopedia, Gojek, Shopee, or whatever company is target in the Job Description.
- CRITICAL: You MUST use the current date at the top of the Cover Letter: ${todayDateString}. Do NOT use any other date.
- Output ONLY the final Cover Letter in Markdown format. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
        }
      } else {
        if (isEmail) {
          if (isIndo) {
            if (emailOpsi === 1) {
              userPrompt = `Write a professional Body Email for a job application in Bahasa Indonesia, strictly following the tone and format of this template:
Subject: Lamaran untuk Posisi [Nama Posisi] - [Nama Kamu]
Yth. [Nama Penerima],

Saya berharap email ini menemui Anda dalam keadaan baik.
Nama saya [Nama Kamu], dan saya sangat tertarik untuk melamar posisi [Nama Posisi] di [Nama Perusahaan]. Saya telah melampirkan CV dan portofolio saya untuk pertimbangan Anda.
Dengan latar belakang saya di bidang [sebutkan bidang terkait, seperti Administrasi, Media Sosial, Desain Grafis, atau Akuntansi, etc], saya yakin dapat berkontribusi secara signifikan untuk tim Anda. Saya sangat antusias untuk dapat mendiskusikan bagaimana keterampilan dan pengalaman saya dapat memberikan nilai tambah bagi [Nama Perusahaan].

Terima kasih atas waktu dan perhatian Anda. Saya berharap dapat mendengar kabar dari Anda segera.

Hormat saya,
[Nama Kamu]
[Nomor Telepon Anda]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- If recipient name is unknown, use "Bapak/Ibu Pimpinan Rekrutmen" or similar.
- Output ONLY the final Subject and Body in Markdown format, with "Subject: ..." as the very first line. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
            } else {
              userPrompt = `Write a professional Body Email for a job application in Bahasa Indonesia, strictly following the tone and format of this template:
Subject: Lamaran untuk Posisi [Nama Posisi] - [Nama Kamu]
Yth. [Nama Penerima],

Perkenalkan, nama saya [Nama Kamu]. Saya menulis email ini untuk mengajukan lamaran pada posisi [Nama Posisi] di [Nama Perusahaan].
Saya memiliki pengalaman dan keterampilan yang relevan di bidang [Administrasi/Media Sosial/Desain Grafis/Akuntansi, etc] yang dapat mendukung tujuan dan kebutuhan perusahaan. Bersama email ini, saya lampirkan CV dan portofolio saya sebagai bahan pertimbangan.
Saya sangat antusias untuk dapat berkontribusi dan bergabung dengan tim yang inovatif dan dinamis di [Nama Perusahaan]. Saya siap untuk menjelaskan lebih lanjut tentang kualifikasi dan pengalaman saya dalam wawancara.

Terima kasih atas waktu dan kesempatan yang diberikan. Saya berharap dapat mendengar kabar baik dari kamu segera.

Hormat saya,
[Nama Kamu]
[Nomor Telepon Kamu]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- If recipient name is unknown, use "Bapak/Ibu Pimpinan Rekrutmen" or similar.
- Output ONLY the final Subject and Body in Markdown format, with "Subject: ..." as the very first line. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
            }
          } else {
            userPrompt = `Write a professional Body Email for a job application in English, following this template format:
Subject: Job Application: [Position Name] - [Your Name]
Dear [Recipient Name],

I hope this email finds you well.
My name is [Your Name], and I am writing to express my strong interest in the [Position Name] role at [Company Name]. I have attached my CV and portfolio for your consideration.
With my background in [mention relevant field], I am confident in my ability to contribute to your team. I am very enthusiastic about the opportunity to discuss how my skills and experience can bring value to [Company Name].

Thank you for your time and consideration. I look forward to hearing from you soon.

Best regards,
[Your Name]
[Your Phone Number]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- Output ONLY the final Subject and Body in Markdown format, with "Subject: ..." as the very first line. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
          }
        } else {
          if (isIndo) {
            userPrompt = `Write a professional Cover Letter in Bahasa Indonesia, structured similarly to this template:
${todayDateString}

[Sender Name]
[City, Country] | [Email] | [Phone]

To:
Hiring Manager
[Company Name]
[Company Address Placeholder]

Selamat siang Bapak/Ibu...,

Nama saya [Nama Kamu], dengan pengalaman di [sebutkan bidang Kamu]. Saya tertarik untuk bergabung dengan [Nama Perusahaan], perusahaan yang saya kagumi karena [sebutkan alasan spesifik]. Meskipun saat ini tidak ada posisi yang terbuka, saya sangat ingin menawarkan kualifikasi dan minat yang kuat untuk berkontribusi. Saya yakin dengan kemampuan saya untuk memberikan nilai tambah bagi tim [Nama Perusahaan] dan siap untuk berdiskusi lebih lanjut dalam sebuah wawancara. Terlampir adalah CV saya untuk bahan pertimbangan Anda.

Terima kasih atas perhatian dan kesempatan yang diberikan.

Salam hormat,
[Nama Kamu]

Instructions:
- Tailor the template to the target Job Description and highlight the achievements from the CV.
- CRITICAL: You MUST use the current date at the top of the Cover Letter: ${todayDateString}. Do NOT use any other date.
- Include sender and recipient details at the top of the Cover Letter as shown in the template.
- Output ONLY the final Cover Letter in Markdown format. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
          } else {
            userPrompt = `Write a professional Cover Letter in English, structured similarly to this template:
${todayDateString}

[Sender Name]
[City, Country] | [Email] | [Phone]

To:
Hiring Manager
[Company Name]
[Company Address Placeholder]

Dear Ms/Mr. .....,

My name is [Your Name], with experience in [mention your field]. I am interested in joining [Company Name], a company I admire for [mention specific reasons]. Although there are currently no open positions, I am eager to offer my qualifications and strong interest in contributing. I am confident in my ability to add value to [Company Name]'s team and am prepared to discuss further in an interview. Attached is my CV for your consideration.

Thank you for your attention and this opportunity.

Best regards,
[Your Name]

Instructions:
- Tailor the template to the target Job Description and highlight the achievements from the CV.
- CRITICAL: You MUST use the current date at the top of the Cover Letter: ${todayDateString}. Do NOT use any other date.
- Include sender and recipient details at the top of the Cover Letter as shown in the template.
- Output ONLY the final Cover Letter in Markdown format. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
          }
        }
      }

    } else {
      return NextResponse.json({ error: "Langkah (step) tidak valid." }, { status: 400 });
    }

    let response: Response | null = null;
    let lastError = "";

    // 1. Try Groq first if GROQ_API_KEY is configured
    if (groqApiKey) {
      const groqModels = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
      ];

      for (const model of groqModels) {
        try {
          const attempt = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              ...(responseFormat ? { response_format: responseFormat } : {}),
              temperature: 0.3,
            }),
          });

          if (attempt.ok) {
            response = attempt;
            break; // success — stop trying
          }

          const errBody = await attempt.text();
          lastError = `[Groq: ${model}] ${attempt.status} - ${errBody}`;
          console.warn("Groq model failed, trying next:", lastError);
        } catch (e: any) {
          lastError = `[Groq: ${model}] Exception: ${e.message}`;
          console.warn("Groq fetch threw exception:", lastError);
        }
      }
    }

    // 2. Fallback to OpenRouter if Groq failed or is not configured
    if (!response && openrouterKey) {
      const modelFallbacks = [
        "openrouter/free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "mistralai/pixtral-12b:free",
        "microsoft/phi-3-medium-128k-instruct:free",
        "nousresearch/hermes-3-llama-3.1-405b:free"
      ];

      for (const model of modelFallbacks) {
        try {
          const attempt = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openrouterKey}`,
              "HTTP-Referer": "https://cvredflag.ai",
              "X-Title": "CVRedFlag.ai",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              ...(responseFormat ? { response_format: responseFormat } : {}),
              temperature: 0.3,
            }),
          });

          if (attempt.ok) {
            response = attempt;
            break; // success — stop trying
          }

          const errBody = await attempt.text();
          lastError = `[OpenRouter: ${model}] ${attempt.status} - ${errBody}`;
          console.warn("OpenRouter model failed, trying next:", lastError);
        } catch (e: any) {
          lastError = `[OpenRouter: ${model}] Exception: ${e.message}`;
          console.warn("OpenRouter fetch threw exception:", lastError);
        }
      }
    }

    if (!response) {
      throw new Error(`All models failed. Last error: ${lastError}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      console.error("API response did not contain choices:", data);
      const errMsg = data.error?.message || "Format respons tidak valid dari API.";
      throw new Error(errMsg);
    }
    const content = data.choices[0].message.content;

    if (step === 1) {
      try {
        // Clean JSON if the LLM wrapped it in markdown code blocks anyway
        const cleanedContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedContent);
        return NextResponse.json(parsed);
      } catch (e) {
        console.error("JSON parsing error of AI content:", content);
        return NextResponse.json({
          score: 50,
          missingKeywords: ["Analisis gagal memformat JSON"],
          redFlags: ["Gagal mem-parse red flags secara terstruktur. Respons asli: " + content.substring(0, 100)]
        });
      }
    }

    return NextResponse.json({ result: content });
  } catch (error: any) {
    console.error("Analyze Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
