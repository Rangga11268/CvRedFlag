import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Handle image files with Gemini Vision API / Tesseract OCR
    if (file.type.startsWith("image/")) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const base64Data = buffer.toString("base64");
          const geminiModel = "gemini-2.5-flash";
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
          
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: "Extract and transcribe all text from this job description image. Maintain the original layout and line breaks. Return ONLY the transcribed text without any conversational preamble or comments." },
                    {
                      inlineData: {
                        mimeType: file.type,
                        data: base64Data
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.1
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text.trim()) {
              return NextResponse.json({ text, info: { Title: "Image OCR (Gemini)" }, numPages: 1 });
            }
          } else {
            console.warn("Gemini vision parse failed:", await response.text());
          }
        } catch (e: any) {
          console.error("Gemini vision parse exception:", e);
        }
      }

      // Fallback to Tesseract OCR if Gemini fails or key is missing
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Tesseract = require("tesseract.js");
      const { data: { text } } = await Tesseract.recognize(buffer, "eng", {
        langPath: process.cwd(),
        cachePath: process.cwd()
      });
      return NextResponse.json({ text, info: { Title: "Image OCR (Tesseract)" }, numPages: 1 });
    }

    // Handle PDF with pdf-parse v1.1.1 (CommonJS, no worker needed)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");

    // Custom pagerender logic with coordinate sorting to keep original layout order
    const customPageRender = (pageData: any) => {
      return pageData.getTextContent({ normalizeWhitespace: true })
        .then(function(textContent: any) {
          const tolerance = 5; // Y-coordinate similarity threshold (pixels)
          const lines: { y: number; items: any[] }[] = [];

          for (const item of textContent.items) {
            const x = item.transform[4];
            const y = item.transform[5];
            const str = item.str;
            const width = item.width || 0;

            let foundLine = lines.find(line => Math.abs(line.y - y) <= tolerance);
            if (foundLine) {
              foundLine.items.push({ x, y, str, width });
              foundLine.y = (foundLine.y * foundLine.items.length + y) / (foundLine.items.length + 1);
            } else {
              lines.push({ y, items: [{ x, y, str, width }] });
            }
          }

          // Sort lines from top to bottom (Y descending)
          lines.sort((a, b) => b.y - a.y);

          let outputText = "";
          for (const line of lines) {
            // Sort items in the same line from left to right (X ascending)
            line.items.sort((a, b) => a.x - b.x);

            let lineText = "";
            for (let i = 0; i < line.items.length; i++) {
              const current = line.items[i];
              if (i > 0) {
                const prev = line.items[i - 1];
                const gap = current.x - (prev.x + prev.width);
                // If there's a physical gap and neither string has a space, insert one
                if (gap > 2.5 && !prev.str.endsWith(" ") && !current.str.startsWith(" ")) {
                  lineText += " ";
                }
              }
              lineText += current.str;
            }

            if (lineText.trim()) {
              outputText += lineText + "\n";
            }
          }

          return outputText;
        });
    };

    // Heuristically merge paragraph/bullet continuation lines that were broken in raw PDF extraction
    const mergeParagraphLines = (text: string) => {
      const lines = text.split("\n");
      const merged: string[] = [];
      const sectionKeywords = [
        "experience", "work", "employment", "education", "skills", "projects", 
        "summary", "objective", "certifications", "languages", "achievements", "interests"
      ];

      let i = 0;
      while (i < lines.length) {
        const current = lines[i].trim();
        if (!current) {
          merged.push("");
          i++;
          continue;
        }

        const isHeading = 
          (current === current.toUpperCase() && current.length > 3) ||
          sectionKeywords.some(kw => current.toLowerCase() === kw) ||
          current.startsWith("##") ||
          current.startsWith("#");

        const isContactLine = current.includes("|") || current.includes("@") || current.startsWith("Availability:");

        if (isHeading || isContactLine) {
          merged.push(current);
          i++;
          continue;
        }

        let combined = current;
        while (i + 1 < lines.length) {
          const next = lines[i + 1].trim();
          if (!next) break;

          const nextIsHeading = 
            (next === next.toUpperCase() && next.length > 3) ||
            sectionKeywords.some(kw => next.toLowerCase() === kw) ||
            next.startsWith("##") ||
            next.startsWith("#") ||
            (next.includes(" | ") && next.length < 60);

          const nextIsContactLine = next.includes("|") || next.includes("@") || next.startsWith("Availability:");
          const nextIsBullet = next.startsWith("•") || next.startsWith("-") || next.startsWith("*");

          if (nextIsHeading || nextIsContactLine || nextIsBullet) {
            break;
          }

          if (combined.endsWith("-")) {
            combined = combined.slice(0, -1) + next;
          } else {
            combined += " " + next;
          }
          i++;
        }

        merged.push(combined);
        i++;
      }

      return merged.join("\n");
    };

    const result = await pdfParse(buffer, { pagerender: customPageRender });
    const formattedText = mergeParagraphLines(result.text);

    return NextResponse.json({
      text: formattedText,
      info: result.info ?? {},
      numPages: result.numpages ?? 1,
    });
  } catch (error: any) {
    console.error("Parsing Error:", error);
    return NextResponse.json(
      { error: `Gagal memproses file: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
