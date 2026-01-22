import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  try {
    // ✅ Support GET & POST
    const url =
      req.method === "GET"
        ? req.query.url
        : req.body?.url;

    const type =
      req.method === "GET"
        ? req.query.type || "short"
        : req.body?.type || "short";

    if (!url) {
      return res.status(400).json({ summary: "YouTube URL required." });
    }

    // ✅ CORRECT transcript fetch
    const transcript = await YoutubeTranscript.fetchTranscript(url);

    if (!transcript || !transcript.length) {
      return res.json({ summary: "No captions available for this video." });
    }

    let text = transcript.map(t => t.text).join(" ");
    text = text.slice(0, 12000); // safety limit

    let prompt =
      type === "bullets"
        ? `Summarize this YouTube video into bullet points:\n${text}`
        : type === "detailed"
        ? `Write a detailed summary of this YouTube video:\n${text}`
        : `Write a short, clear summary of this YouTube video:\n${text}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);

    if (!result?.response) {
      return res.json({ summary: "AI failed to generate summary." });
    }

    res.json({ summary: result.response.text() });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({
      summary: "Internal server error. Captions or AI failed."
    });
  }
}
