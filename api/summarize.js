import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    const type = req.query.type || "short";

    if (!url) {
      return res.json({ error: "YouTube URL required" });
    }

    const prompt =
      type === "bullets"
        ? `Give bullet point summary of this YouTube video:\n${url}`
        : type === "detailed"
        ? `Give a detailed summary of this YouTube video:\n${url}`
        : `Give a short summary of this YouTube video:\n${url}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);

    res.json({
      success: true,
      summary: result.response.text()
    });

  } catch (err) {
    res.status(500).json({
      error: "AI failed. Check API key or quota."
    });
  }
}
