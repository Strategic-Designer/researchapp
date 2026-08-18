const { supabase } = require('../_lib/supabase');
const { requireAuth } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (!await requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('deliverables')
      .select('data')
      .order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data.map(r => r.data));
  }

  if (req.method === 'POST') {
    const item = req.body;
    const { error } = await supabase
      .from('deliverables')
      .insert({ id: item.id, data: item });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(item);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
