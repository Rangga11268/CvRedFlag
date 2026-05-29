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
      originalKeywords 
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
        systemPrompt = "You are a senior ATS recruiter and analyst. Verify if the optimized CV has successfully resolved the previous red flags and incorporated the missing keywords. Respond ONLY in raw JSON — no markdown, no code blocks, no extra text.";
        userPrompt = `Analyze the optimized CV against the target Job Description. 
Check if the previously identified red flags have been successfully removed, and if the missing keywords are now successfully integrated.
Return ONLY this JSON format:
{
  "score": <number 0-100, should be significantly higher if keywords were added and red flags resolved>,
  "missingKeywords": ["any keywords STILL missing"],
  "redFlags": ["any red flags STILL present"],
  "resolvedKeywords": ["keywords from the original list that are now successfully added"],
  "resolvedRedFlags": ["red flags from the original list that are now successfully resolved/removed"]
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
        userPrompt = `Act as a senior recruiter for this exact company. Analyze the resume against the job description and return ONLY this JSON:
{
  "score": <number 0-100>,
  "missingKeywords": ["up to 5 specific skills/tools missing from the CV"],
  "redFlags": ["3 red flags a hiring manager spots in under 10 seconds"]
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

    } else {
      return NextResponse.json({ error: "Langkah (step) tidak valid." }, { status: 400 });
    }

    let response: Response | null = null;
    let lastError = "";

    // 1. Try Groq first if GROQ_API_KEY is configured
    if (groqApiKey) {
      const groqModels = [
        "llama-3.3-70b-specdec",
        "llama-3.3-70b-versatile",
        "gemma2-9b-it",
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
