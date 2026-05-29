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
      keyword
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
  "resolvedRedFlags": ["red flags from the original list that are now successfully resolved/removed in the optimized CV"]
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
  "redFlags": ["up to 3 red flags a hiring manager spots in under 10 seconds"]
}

Job Description:
${jobDescription}

Resume/CV:
${cvText}`;
      }
      responseFormat = { type: "json_object" };

    } else if (step === 2) {
      systemPrompt = "You are an expert ATS resume writer. You rewrite experience bullets using the Google XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'. Output clean Markdown only.";
      userPrompt = `Rewrite ONLY the Work Experience / Project section of this CV. 

Rules:
- Every bullet MUST use Google XYZ: "Accomplished [X] as measured by [Y], by doing [Z]"
- Naturally embed these missing keywords: ${JSON.stringify(missingKeywords)}
- Remove these red flags: ${JSON.stringify(redFlags)}
- Keep role titles and company names intact
- Use this Markdown structure:

## WORK EXPERIENCE
### [Job Title] | [Company] | [Date Range]
- Accomplished X as measured by Y, by doing Z
- Accomplished X as measured by Y, by doing Z

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
      userPrompt = `Compile the FINAL complete ATS-optimized 1-page resume using the rewritten experience below and the original CV data.

STRICT FORMAT RULES — follow exactly:
1. Name as H1 centered, job title below name, contact info on one line
2. Section headers as H2 ALL-CAPS
3. Bullet points using "- " prefix, Google XYZ formula
4. Max 1 page when printed — be ruthlessly concise
5. Output ONLY clean Markdown, no explanations, no preamble

REQUIRED SECTIONS IN ORDER:
# [FULL NAME]
[Job Title]
[City, Country] | [email] | [phone] | [website/LinkedIn/GitHub]

## PROFESSIONAL SUMMARY
2-3 punchy lines. ATS keywords front-loaded. Quantify impact.

## TECHNICAL SKILLS
Backend & API: ...
Database: ...
[etc — keep to 4 lines max]

## WORK EXPERIENCE
### [Title] | [Company] | [Dates]
- [XYZ bullet]
- [XYZ bullet]

## PROJECTS
### [Name] | [Stack]
- [XYZ bullet]

## EDUCATION
### [Degree] | [University] | [GPA if strong]

---
Rewritten Experience Section:
${rewrittenExperience}

Original CV data:
${cvText}

Job Description (ATS keywords to include):
${jobDescription}

Output the complete final resume in Markdown NOW:`;

    } else if (step === 4) {
      systemPrompt = "You are an elite ATS resume writer and counselor. Suggest EXACTLY where and how to integrate a missing keyword into the resume. Provide a single concrete bullet point recommendation using the Google XYZ formula.";
      userPrompt = `Suggest how to integrate the missing keyword: "${keyword}" into the candidate's CV.
Provide a clear 1-2 sentence suggestion. Focus on where to insert it and write a matching bullet point.

Keyword: ${keyword}
CV: ${cvText}
Job Description: ${jobDescription}`;

    } else if (step === 5) {
      systemPrompt = "You are an elite executive career coach and resume writer. Write a matching, highly professional cover letter based on the optimized CV and target Job Description. Respond ONLY in Markdown.";
      userPrompt = `Write a professional 1-page Cover Letter.
Make it compelling, tailored exactly to the target Job Description, and highlight the key achievements from the CV.

Strict Format Rules:
- Include date, sender, and recipient placeholders at the top
- Professional salutation
- 3-4 punchy paragraphs linking candidate skills to job needs
- Professional sign-off
- Output ONLY Markdown — no extra preamble, no chat, no explanations.

Optimized CV:
${cvText}

Job Description:
${jobDescription}`;

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
