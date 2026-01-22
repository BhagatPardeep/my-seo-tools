import { getTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  try {
    // ✅ Support both GET and POST
    const url =
      req.method === "GET"
        ? req.query.url
        : req.body?.url;

    const type =
      req.method === "GET"
        ? req.query.type || "short"
        : req.body?.type || "short";

    if (!url) {
      return res.json({ summary: "YouTube URL required." });
    }

    const transcript = await getTranscript(url);
    if (!transcript.length) {
      return res.json({ summary: "No captions available." });
    }

    let text = transcript.map(t => t.text).join(" ");
    text = text.slice(0, 12000);

    const prompt =
      type === "bullets"
        ? `Summarize into bullet points:\n${text}`
        : type === "detailed"
        ? `Write a detailed summary:\n${text}`
        : `Write a short summary:\n${text}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);
    if (!result?.response) {
      return res.json({ summary: "AI generation failed." });
    }

    res.json({ summary: result.response.text() });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({
      summary: "Internal server error."
    });
  }
}
