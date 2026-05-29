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

    // Handle image files with Tesseract OCR
    if (file.type.startsWith("image/")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Tesseract = require("tesseract.js");
      const { data: { text } } = await Tesseract.recognize(buffer, "eng");
      return NextResponse.json({ text, info: { Title: "Image OCR" }, numPages: 1 });
    }

    // Handle PDF with pdf-parse v1.1.1 (CommonJS, no worker needed)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);

    return NextResponse.json({
      text: result.text,
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
