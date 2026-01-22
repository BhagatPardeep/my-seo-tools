import { getTranscript } from "youtube-transcript";

// Stop words list
const STOP_WORDS = new Set([
  "the","is","and","to","of","a","in","that","it","on","for","as","with",
  "this","was","are","be","by","or","from","at","an"
]);

function summarizeText(text, mode = "short") {
  const sentences = text
    .replace(/\n/g, " ")
    .split(". ")
    .filter(s => s.length > 40);

  const wordFreq = {};

  // Build word frequency
  sentences.forEach(sentence => {
    sentence.toLowerCase().split(" ").forEach(word => {
      word = word.replace(/[^a-z]/g, "");
      if (!STOP_WORDS.has(word) && word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });

  // Score sentences
  const ranked = sentences.map(sentence => {
    let score = 0;
    sentence.toLowerCase().split(" ").forEach(word => {
      word = word.replace(/[^a-z]/g, "");
      if (wordFreq[word]) score += wordFreq[word];
    });
    return { sentence, score };
  });

  ranked.sort((a, b) => b.score - a.score);

  if (mode === "bullets") {
    return ranked.slice(0, 5).map(r => "• " + r.sentence).join("\n");
  }

  if (mode === "detailed") {
    return ranked.slice(0, 8).map(r => r.sentence).join(". ") + ".";
  }

  // short
  return ranked.slice(0, 3).map(r => r.sentence).join(". ") + ".";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, type } = req.body;

  try {
    const transcript = await getTranscript(url);
    const fullText = transcript.map(t => t.text).join(" ");

    const summary = summarizeText(fullText, type);

    res.json({ summary });
  } catch (e) {
    res.json({
      summary:
        "Transcript not available. This video may be private or captions are disabled."
    });
  }
}
