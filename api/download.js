export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || !url.includes("instagram.com")) {
    return res.status(400).json({ error: "Invalid Instagram URL" });
  }

  try {
    const match = url.match(/reel\/([^\/]+)/);
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
      data?.items?.[0]?.video_versions?.[0]?.url ||
      data?.graphql?.shortcode_media?.video_url;

    if (!video) {
      throw new Error("Video not found");
    }

    res.json({
      status: "success",
      download_url: video
    });

  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch reel",
      details: err.message
    });
  }
}
