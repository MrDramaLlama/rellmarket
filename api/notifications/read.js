const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
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
