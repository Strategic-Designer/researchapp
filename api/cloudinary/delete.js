const crypto = require("crypto");
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!await requireAuth(req, res)) return;

  const { public_id } = req.body;
  if (!public_id) return res.status(400).json({ error: "Missing public_id" });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

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
};
