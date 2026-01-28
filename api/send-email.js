import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory store (resets automatically, good for serverless)
const rateLimitMap = new Map();

// SETTINGS
const LIMIT = 3;               // max requests
const WINDOW = 10 * 60 * 1000; // 10 minutes

export default async function handler(req, res) {

  // ✅ CORS HEADERS (CRITICAL FOR BLOGGER)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request (THIS FIXES THE ERROR)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  // Get user IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, time: now };

  // Reset window
  if (now - userData.time > WINDOW) {
    userData.count = 0;
    userData.time = now;
  }

  userData.count++;
  rateLimitMap.set(ip, userData);

  // BLOCK if limit exceeded
  if (userData.count > LIMIT) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later."
    });
  }

  // ---------------- EMAIL LOGIC ----------------

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Missing fields"
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
      message: "Email sent successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Email failed"
    });
  }
}
