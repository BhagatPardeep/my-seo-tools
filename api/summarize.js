import { getTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { url, type } = req.body;
    if (!url) return res.json({ summary: "YouTube URL required." });

    const transcript = await getTranscript(url);
    if (!transcript.length)
      return res.json({ summary: "No captions available for this video." });

    let text = transcript.map(t => t.text).join(" ");
    text = text.slice(0, 12000);

    let prompt =
      type === "bullets"
        ? `Summarize into bullet points:\n${text}`
        : type === "detailed"
        ? `Write a detailed summary:\n${text}`
        : `Write a short summary:\n${text}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    if (!result?.response)
      return res.json({ summary: "AI generation failed." });

    res.json({ summary: result.response.text() });

  } catch (err) {
    console.error("ERROR:", err);
    res.json({
      summary: "Server error. Captions missing or AI error."
    });
  }
}
