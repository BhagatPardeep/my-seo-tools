import ytdl from "@distube/ytdl-core";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const info = await ytdl.getInfo(url);

    const format = ytdl.chooseFormat(info.formats, {
      quality: "highest",
      filter: "videoandaudio"
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${info.videoDetails.title}.mp4"`
    );

    ytdl(url, { format }).pipe(res);
  } catch (err) {
    res.status(500).json({ error: "Download failed", details: err.message });
  }
}
