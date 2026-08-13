const { requireAuth } = require('./lib/auth');

module.exports = async function handler(req, res) {
  if (!await requireAuth(req, res)) return;
  const fileId = (req.url || '').split('/').filter(Boolean).pop()?.split('?')[0];
  if (!fileId) { res.writeHead(400); return res.end(''); }

  try {
    const response = await fetch(`https://drive.google.com/thumbnail?id=${fileId}&sz=w800`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    if (!response.ok) { res.writeHead(response.status); return res.end(''); }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (e) {
    res.writeHead(502); res.end('');
  }
};
