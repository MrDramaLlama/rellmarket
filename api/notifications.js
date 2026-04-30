const { createClient } = require('@supabase/supabase-js');

async function getNotifications(req, res, supabase) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ notifications: data || [] });
}

async function readNotifications(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.body;
  if (id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
  } else {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  }
  return res.status(200).json({ success: true });
}

async function createNotification(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id, type, title, message, link } = req.body;
  const { error } = await supabase.from('notifications').insert({ user_id, type, title, message, link });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'get':    return getNotifications(req, res, supabase);
    case 'read':   return readNotifications(req, res, supabase);
    case 'create': return createNotification(req, res, supabase);
    default:       return res.status(404).json({ error: 'Unknown action' });
  }
};
