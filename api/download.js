export default async function handler(req, res) {

  // CORS (safe)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url || !url.includes("instagram.com")) {
    return res.status(400).json({ error: "Invalid Instagram URL" });
  }

  try {
    // ✅ FIXED REGEX
    const match = url.match(/\/reels?\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: "Not a reel URL" });
    }

    const shortcode = match[1];
    const apiUrl = `https://www.instagram.com/reel/${shortcode}/?__a=1&__d=dis`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Instagram blocked request");
    }

    const data = await response.json();

    const video =
      data?.graphql?.shortcode_media?.video_url;

    if (!video) {
      throw new Error("Video URL not found");
    }

    res.json({
      status: "success",
      download_url: video
    });

  } catch (err) {
    res.status(500).json({
      error: "Failed",
      details: err.message
    });
  }
}
