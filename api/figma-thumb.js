const { requireAuth } = require('./lib/auth');

module.exports = async function handler(req, res) {
  if (!await requireAuth(req, res)) return;
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const figmaToken = process.env.FIGMA_TOKEN;
    const m = url.match(/figma\.com\/(?:file|design|proto|slides|deck)\/([^/?#]+)/);
    const fileKey = m?.[1];

    if (figmaToken && fileKey) {
      const apiRes = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: { 'X-FIGMA-TOKEN': figmaToken, 'Accept': 'application/json' }
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        return res.json({ title: data.name || null, thumbnail_url: data.thumbnailUrl || null });
      }
    }

    const r = await fetch(`https://www.figma.com/api/oembed?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    if (!r.ok) return res.status(r.status).json({ error: "Figma oEmbed failed" });
    const data = await r.json();
    return res.json({ title: data.title || null, thumbnail_url: data.thumbnail_url || null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
