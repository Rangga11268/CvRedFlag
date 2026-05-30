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
      isReanalysis,
      originalRedFlags,
      originalKeywords,
      keyword,
      language,
      format,
      jobCategory,
      cvLanguage,
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
      });
      systemPrompt = result.systemPrompt;
      userPrompt = result.userPrompt;

    } else {
      return NextResponse.json({ error: "Langkah (step) tidak valid." }, { status: 400 });
    }

    // ── Call AI Providers ─────────────────────────────────────────────────────
    let response: Response | null = null;
    let lastError = "";

    // 1. Try Groq first if GROQ_API_KEY is configured
    if (groqApiKey) {
      const groqModels = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
      ];

      for (const model of groqModels) {
        try {
          const attempt = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
          });

          if (attempt.ok) {
            response = attempt;
            break;
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
        "nousresearch/hermes-3-llama-3.1-405b:free",
      ];

      for (const model of modelFallbacks) {
        try {
          const attempt = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          });

          if (attempt.ok) {
            response = attempt;
            break;
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

    // ── Parse AI Response ────────────────────────────────────────────────────
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
