const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (!await requireAuth(req, res)) return;
  const { data, error: sbError } = await supabase.from('config').select('value').eq('key', 'jira').maybeSingle();
  const cfg = data?.value || {};
  const base  = (cfg.baseUrl || '').replace(/\/$/, '');
  const email = cfg.email || '';
  const token = cfg.token || '';

  if (!base || !email || !token) {
    return res.status(500).json({ error: 'Jira credentials not configured', sbError: sbError?.message, hasData: !!data });
  }

  const key = (req.url || '').split('?')[0].split('/').filter(Boolean).pop();

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };

  const isTest = key === '_test';
  const apiPath = isTest ? '/rest/api/3/myself' : `/rest/api/3/issue/${key}?fields=summary,status`;

  try {
    const response = await fetch(`${base}${apiPath}`, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
};
