/**
 * Step 1: CV Analysis & ATS Scoring Prompts
 * Generates system and user prompts for initial CV scanning and re-analysis.
 */

export interface Step1Params {
  cvText: string;
  jobDescription: string;
  isReanalysis?: boolean;
  originalRedFlags?: string[];
  originalKeywords?: string[];
}

export interface Step1Result {
  systemPrompt: string;
  userPrompt: string;
  responseFormat: { type: string };
}

export function buildStep1Prompts(params: Step1Params): Step1Result {
  const { cvText, jobDescription, isReanalysis, originalRedFlags, originalKeywords } = params;
  const responseFormat = { type: "json_object" };

  if (isReanalysis) {
    return {
      systemPrompt:
        "You are a senior ATS recruiter and analyst. Verify if the optimized CV has successfully resolved the previous red flags, integrated missing keywords, and improved its overall score based on the professional rubric. Respond ONLY in raw JSON — no markdown, no code blocks, no extra text.",
      userPrompt: `Analyze the optimized CV against the target Job Description and compare it with the original issues.

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
${JSON.stringify(originalKeywords)}`,
      responseFormat,
    };
  }

  return {
    systemPrompt:
      "You are a senior ATS analyst and recruiter. Analyze the candidate's CV against the job description. Respond ONLY in raw JSON — no markdown, no code blocks, no extra text.",
    userPrompt: `Act as a senior recruiter. Analyze the resume against the job description.
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
${cvText}`,
    responseFormat,
  };
}
