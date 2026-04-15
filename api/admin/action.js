const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

  const { action, target_id } = req.body;

  if (action === 'delete_listing') {
    await supabase.from('listings').delete().eq('id', target_id);
  } else if (action === 'ban_user') {
    await supabase.from('profiles').update({ role: 'banned' }).eq('id', target_id);
  } else if (action === 'make_trusted') {
    await supabase.from('profiles').update({ is_trusted: true }).eq('id', target_id);
  } else if (action === 'remove_trusted') {
    await supabase.from('profiles').update({ is_trusted: false }).eq('id', target_id);
  } else if (action === 'make_mod') {
    await supabase.from('profiles').update({ role: 'mod' }).eq('id', target_id);
  }

  return res.status(200).json({ success: true });
}
