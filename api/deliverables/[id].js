const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  res.setHeader('Content-Type', 'application/json');
  if (!await requireAuth(req, res)) return;

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('deliverables')
      .delete()
      .eq('id', Number(id));
    if (error) return res.status(500).json({ error: error.message });
    return res.json({});
  }

  if (req.method === 'PUT') {
    const item = req.body;
    const { error } = await supabase
      .from('deliverables')
      .update({ data: item })
      .eq('id', Number(id));
    if (error) return res.status(500).json({ error: error.message });
    return res.json({});
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
