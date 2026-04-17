const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

  if (req.method === 'POST') {
    const { trade_id, action } = req.body || {};
    if (!trade_id || !action) return res.status(400).json({ error: 'Missing trade_id or action' });
    const { error: upErr } = await supabase.from('trade_requests').update({ is_flagged: false }).eq('id', trade_id);
    if (upErr) return res.status(500).json({ error: upErr.message });
    return res.status(200).json({ success: true, action });
  }

  const { data: trades, error } = await supabase
    .from('trade_requests')
    .select('id, created_at, sender_id, listing_id, offered_item, offered_beli, listings(item_name, user_id)')
    .eq('is_flagged', true)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const userIds = [...new Set((trades || []).flatMap(t => [t.sender_id, t.listings?.user_id]).filter(Boolean))];
  let profileMap = {};
  if (userIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, username, roblox_username').in('id', userIds);
    (profiles || []).forEach(p => { profileMap[p.id] = p.roblox_username || p.username || p.id; });
  }

  const enriched = (trades || []).map(t => ({
    ...t,
    sender_name: profileMap[t.sender_id] || '—',
    receiver_name: profileMap[t.listings?.user_id] || '—',
    item_name: t.listings?.item_name || '—',
  }));

  return res.status(200).json({ trades: enriched });
};
