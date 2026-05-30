/**
 * Step 4: Missing Keyword Placement Suggestion Prompts
 * Suggests where and how to integrate a missing keyword into the CV.
 */

export interface Step4Params {
  keyword: string;
  cvText: string;
  jobDescription: string;
}

export interface Step4Result {
  systemPrompt: string;
  userPrompt: string;
}

export function buildStep4Prompts(params: Step4Params): Step4Result {
  const { keyword, cvText, jobDescription } = params;

  return {
    systemPrompt:
      "You are an elite ATS resume writer and counselor. Suggest EXACTLY where and how to integrate a missing keyword into the resume. Provide a single concrete bullet point recommendation using the Google XYZ formula.",
    userPrompt: `Suggest how to integrate the missing keyword: "${keyword}" into the candidate's CV.
Provide a clear 1-2 sentence suggestion. Focus on where to insert it and write a matching bullet point.

Keyword: ${keyword}
CV: ${cvText}
Job Description: ${jobDescription}`,
  };
}
