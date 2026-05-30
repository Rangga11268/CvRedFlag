/**
 * Step 2: Google XYZ Formula Experience Rewriter Prompts
 * Rewrites work experience bullets using the Google XYZ formula.
 */

export interface Step2Params {
  cvText: string;
  jobDescription: string;
  missingKeywords?: string[];
  redFlags?: string[];
  cvLanguage?: "auto" | "id" | "en" | "bilingual";
}

export interface Step2Result {
  systemPrompt: string;
  userPrompt: string;
}

export function buildStep2Prompts(params: Step2Params): Step2Result {
  const { cvText, jobDescription, missingKeywords = [], redFlags = [], cvLanguage = "auto" } = params;

  let langInstruction = "";
  if (cvLanguage === "en") {
    langInstruction =
      "- You MUST write all the rewritten experience bullets and headers in English. Translate them to English if the original CV is in Indonesian.";
  } else if (cvLanguage === "id") {
    langInstruction =
      "- You MUST write all the rewritten experience bullets and headers in Bahasa Indonesia. Translate them to Bahasa Indonesia if the original CV is in English.";
  } else if (cvLanguage === "bilingual") {
    langInstruction =
      "- You MUST write all the rewritten experience bullets and headers in Bilingual format (English / Bahasa Indonesia translation side-by-side or combined).";
  } else {
    langInstruction =
      "- Maintain the dominant language of the original CV (English or Bahasa Indonesia).";
  }

  return {
    systemPrompt:
      'You are an expert ATS resume writer. You rewrite experience bullets using the Google XYZ formula: \'Accomplished [X] as measured by [Y], by doing [Z]\'. Output clean Markdown only.',
    userPrompt: `Rewrite ONLY the Work Experience / Project section of this CV. 

Rules:
- Every bullet MUST use Google XYZ: "Accomplished [X] as measured by [Y], by doing [Z]"
- Naturally embed these missing keywords: ${JSON.stringify(missingKeywords)}
- Remove these red flags: ${JSON.stringify(redFlags)}
- Keep role titles and company names intact. Do NOT invent new companies, roles, or past projects.
- CRITICAL WARNING: The Job Description is the target company and role they are applying for. Do NOT add the target company or target role to the candidate's work experience. The candidate has NEVER worked there.
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

Output ONLY the Experience and Projects sections in Markdown. Nothing else.`,
  };
}
