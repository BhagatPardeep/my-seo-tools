import { Resend } from "resend";

// In-memory rate limit
const rateLimitMap = new Map();
const LIMIT = 3;
const WINDOW = 10 * 60 * 1000;

export default async function handler(req, res) {

  // ✅ ALWAYS send CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Preflight request MUST exit early
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  // ✅ Validate ENV safely
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY missing");
    return res.status(500).json({
      success: false,
      message: "Server email configuration error",
    });
  }

  // Init Resend ONLY when needed
  const resend = new Resend(process.env.RESEND_API_KEY);

  // IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown";

  // Rate limit
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, time: now };

  if (now - userData.time > WINDOW) {
    userData.count = 0;
    userData.time = now;
  }

  userData.count++;
  rateLimitMap.set(ip, userData);

  if (userData.count > LIMIT) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Missing fields",
    });
  }

  try {
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: ["pardeep6975@gmail.com"],
      subject: "📩 New Contact Message",
      html: `
        <h3>New Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p>${message}</p>
      `,
    });

    return res.json({
      success: true,
      message: "Email sent successfully",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Email failed",
    });
  }
}
