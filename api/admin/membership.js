const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, roblox_username, is_member, role')
      .order('username', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    const members    = (data || []).filter(p => p.is_member);
    const nonMembers = (data || []).filter(p => !p.is_member && p.role !== 'admin');
    return res.status(200).json({ members, nonMembers });
  }

  if (req.method === 'POST') {
    const { user_id, action } = req.body || {};
    if (!user_id || !['grant', 'revoke'].includes(action)) {
      return res.status(400).json({ error: 'Missing user_id or invalid action' });
    }
    const { error } = await supabase
      .from('profiles')
      .update({ is_member: action === 'grant' })
      .eq('id', user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, is_member: action === 'grant' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
