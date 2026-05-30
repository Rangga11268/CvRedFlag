import { NextRequest, NextResponse } from "next/server";
import { buildStep1Prompts } from "./prompts/step1";
import { buildStep2Prompts } from "./prompts/step2";
import { buildStep3Prompts } from "./prompts/step3";
import { buildStep4Prompts } from "./prompts/step4";
import { buildStep5Prompts } from "./prompts/step5";

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
      geminiApiKey,
      isReanalysis,
      originalRedFlags,
      originalKeywords,
      keyword,
      language,
      format,
      jobCategory,
      cvLanguage,
      tone,
    } = await req.json();

    // Determine API Keys
    const groqApiKey = process.env.GROQ_API_KEY;
    const openrouterKey = openrouterApiKey || process.env.OPENROUTER_API_KEY;
    const geminiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    if (!groqApiKey && !openrouterKey && !geminiKey) {
      return NextResponse.json(
        { error: "API Key (Gemini, Groq, atau OpenRouter) tidak ditemukan. Harap masukkan API Key Anda di Pengaturan." },
        { status: 400 }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";
    let responseFormat: any = undefined;

    // ── Build prompts based on step ──────────────────────────────────────────
    if (step === 1) {
      const result = buildStep1Prompts({
        cvText,
        jobDescription,
        isReanalysis,
        originalRedFlags,
        originalKeywords,
      });
      systemPrompt = result.systemPrompt;
      userPrompt = result.userPrompt;
      responseFormat = result.responseFormat;

    } else if (step === 2) {
      const result = buildStep2Prompts({
        cvText,
        jobDescription,
        missingKeywords,
        redFlags,
        cvLanguage,
      });
      systemPrompt = result.systemPrompt;
      userPrompt = result.userPrompt;

    } else if (step === 3) {
      const result = buildStep3Prompts({
        cvText,
        jobDescription,
        rewrittenExperience,
        jobCategory,
        cvLanguage,
      });
      systemPrompt = result.systemPrompt;
      userPrompt = result.userPrompt;

    } else if (step === 4) {
      const result = buildStep4Prompts({
        keyword,
        cvText,
        jobDescription,
      });
      systemPrompt = result.systemPrompt;
      userPrompt = result.userPrompt;

    } else if (step === 5) {
      const result = buildStep5Prompts({
        cvText,
        jobDescription,
        language,
        format,
        jobCategory,
        tone,
      });
      systemPrompt = result.systemPrompt;
      userPrompt = result.userPrompt;

    } else {
      return NextResponse.json({ error: "Langkah (step) tidak valid." }, { status: 400 });
    }

    // ── Call AI Providers ─────────────────────────────────────────────────────
    let response: Response | null = null;
    let lastError = "";

    const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 8000): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    // 0. Try Google Gemini API first if geminiKey is configured
    if (geminiKey) {
      try {
        const isJson = responseFormat?.type === "json_object";
        const geminiModel = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
        
        const attempt = await fetchWithTimeout(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemPrompt}\n\n${userPrompt}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              ...(isJson ? { responseMimeType: "application/json" } : {})
            }
          })
        }, 9500);

        if (attempt.ok) {
          response = attempt;
        } else {
          const errBody = await attempt.text();
          lastError = `[Gemini: ${geminiModel}] ${attempt.status} - ${errBody}`;
          console.warn("Gemini model failed, falling back:", lastError);
        }
      } catch (e: any) {
        lastError = `[Gemini] Exception: ${e.message}`;
        console.warn("Gemini fetch threw exception or timed out:", lastError);
      }
    }

    // 1. Try Groq first if GROQ_API_KEY is configured
    if (groqApiKey) {
      const groqModels = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
      ];

      for (const model of groqModels) {
        try {
          const attempt = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              ...(responseFormat ? { response_format: responseFormat } : {}),
              temperature: 0.3,
            }),
          }, 8000);

          if (attempt.ok) {
            response = attempt;
            break;
          }

          const errBody = await attempt.text();
          lastError = `[Groq: ${model}] ${attempt.status} - ${errBody}`;
          console.warn("Groq model failed, trying next:", lastError);
        } catch (e: any) {
          lastError = `[Groq: ${model}] Exception: ${e.message}`;
          console.warn("Groq fetch threw exception or timed out:", lastError);
        }
      }
    }

    // 2. Fallback to OpenRouter if Groq failed or is not configured
    if (!response && openrouterKey) {
      // Reduced to top 3 fast and reliable free models
      const modelFallbacks = [
        "google/gemma-2-9b-it:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "meta-llama/llama-3.3-70b-instruct:free",
      ];

      for (const model of modelFallbacks) {
        try {
          const attempt = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openrouterKey}`,
              "HTTP-Referer": "https://cvredflag.ai",
              "X-Title": "CVRedFlag.ai",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              ...(responseFormat ? { response_format: responseFormat } : {}),
              temperature: 0.3,
            }),
          }, 8000);

          if (attempt.ok) {
            response = attempt;
            break;
          }

          const errBody = await attempt.text();
          lastError = `[OpenRouter: ${model}] ${attempt.status} - ${errBody}`;
          console.warn("OpenRouter model failed, trying next:", lastError);
        } catch (e: any) {
          lastError = `[OpenRouter: ${model}] Exception: ${e.message}`;
          console.warn("OpenRouter fetch threw exception or timed out:", lastError);
        }
      }
    }

    if (!response) {
      throw new Error(`All models failed or timed out. Last error: ${lastError}`);
    }

    // ── Parse AI Response ────────────────────────────────────────────────────
    const data = await response.json();
    let content = "";
    
    if (data.candidates && data.candidates.length > 0) {
      content = data.candidates[0].content?.parts?.[0]?.text || "";
    } else if (data.choices && data.choices.length > 0) {
      content = data.choices[0].message?.content || "";
    } else {
      console.error("API response format invalid:", data);
      const errMsg = data.error?.message || "Format respons tidak valid dari API.";
      throw new Error(errMsg);
    }

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
          redFlags: [
            "Gagal mem-parse red flags secara terstruktur. Respons asli: " + content.substring(0, 100),
          ],
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
