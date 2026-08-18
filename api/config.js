const { supabase } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (!await requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const { key } = req.query;
    const { data, error } = await supabase.from('config').select('value').eq('key', key).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ value: data?.value || null });
  }

  if (req.method === 'POST') {
    const { key, value } = req.body;
    const { error } = await supabase
      .from('config')
      .upsert({ key, value }, { onConflict: 'key' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
