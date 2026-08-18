const { supabase } = require('./supabase');

async function requireAuth(req, res) {
  const header = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const query = req.query?.token || '';
  const token = header || query;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return data.user;
}

module.exports = { requireAuth };
