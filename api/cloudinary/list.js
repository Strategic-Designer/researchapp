const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (!await requireAuth(req, res)) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

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
};
