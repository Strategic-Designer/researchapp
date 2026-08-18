const crypto = require("crypto");
const { requireAuth } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (!await requireAuth(req, res)) return;

  const { action } = req.query;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (action === "list") {
    if (req.method !== "GET") return res.status(405).end();
    const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=200`, {
      headers: { Authorization: `Basic ${basicAuth}` },
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Error" });
    const resources = (data.resources || []).map(img => ({
      public_id: img.public_id,
      url: img.secure_url,
      width: img.width,
      height: img.height,
      created_at: img.created_at,
    }));
    return res.status(200).json({ resources });
  }

  if (action === "delete") {
    if (req.method !== "POST") return res.status(405).end();
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: "Missing public_id" });
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto
      .createHash("sha1")
      .update(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");
    const body = new URLSearchParams({ public_id, timestamp, api_key: apiKey, signature });
    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body,
    });
    const data = await r.json();
    if (data.result !== "ok") return res.status(400).json({ error: data.result });
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ error: "Unknown action" });
};
