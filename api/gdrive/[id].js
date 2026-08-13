const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (!await requireAuth(req, res)) return;
  const { id } = req.query;
  const urls = [
    `https://drive.google.com/file/d/${id}/view`,
    `https://docs.google.com/presentation/d/${id}/edit`,
    `https://docs.google.com/document/d/${id}/edit`,
    `https://docs.google.com/spreadsheets/d/${id}/edit`,
  ];
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!response.ok) continue;
      const html = await response.text();
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const raw = match ? match[1] : '';
      const title = raw
        .replace(/\s*[-\u2013]\s*Google (Drive|Docs|Slides|Sheets)\s*$/i, '')
        .trim();
      if (title) return res.json({ title });
    } catch { continue; }
  }
  return res.json({ title: null });
};
