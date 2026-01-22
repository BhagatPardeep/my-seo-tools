import { getTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { url, type } = req.body;

  if (!url) {
    return res.json({ summary: "Please provide a YouTube URL." });
  }

  try {
    // 1️⃣ Fetch transcript
    const transcript = await getTranscript(url);
    let text = transcript.map(t => t.text).join(" ");

    // 🔒 Safety limit (important)
    text = text.slice(0, 12000);

    // 2️⃣ Prompt engineering
    let prompt = "";

    switch (type) {
      case "bullets":
        prompt = `Summarize this YouTube video into clear bullet points:\n\n${text}`;
        break;
      case "detailed":
        prompt = `Write a detailed, well-structured summary of this YouTube video:\n\n${text}`;
        break;
      default:
        prompt = `Write a short, clear summary of this YouTube video:\n\n${text}`;
    }

    // 3️⃣ Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({ summary });

  } catch (err) {
    res.json({
      summary:
        "Unable to summarize this video. Captions may be disabled or the video is restricted."
    });
  }
}
