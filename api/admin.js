const { createClient } = require('@supabase/supabase-js');

async function requireAdmin(req, supabase) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return { error: { status: 401, body: { error: 'Not authenticated' } } };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return { error: { status: 403, body: { error: 'Not authorized' } } };
  }
  return { user, profile };
}

async function check(req, res, supabase) {
  const auth = await requireAdmin(req, supabase);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);
  return res.status(200).json({ success: true });
}

async function stats(req, res, supabase) {
  const auth = await requireAdmin(req, supabase);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);

  const [listings, users, trades, reports] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('trade_requests').select('id', { count: 'exact' }),
    supabase.from('reports').select('id', { count: 'exact' })
  ]);

  return res.status(200).json({
    totalListings: listings.count || 0,
    totalUsers:    users.count    || 0,
    totalTrades:   trades.count   || 0,
    totalReports:  reports.count  || 0
  });
}

async function listListings(req, res, supabase) {
  const auth = await requireAdmin(req, supabase);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);

  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles(username, roblox_username)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ listings: data });
}

async function listUsers(req, res, supabase) {
  const auth = await requireAdmin(req, supabase);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ users: data });
}

async function adminAction(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await requireAdmin(req, supabase);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);

  // req.body.action = the admin operation (separate from req.query.action router param)
  const { action: adminOp, target_id } = req.body;

  if (adminOp === 'delete_listing') {
    await supabase.from('listings').delete().eq('id', target_id);
  } else if (adminOp === 'ban_user') {
    await supabase.from('profiles').update({ role: 'banned' }).eq('id', target_id);
  } else if (adminOp === 'make_trusted') {
    await supabase.from('profiles').update({ is_trusted: true }).eq('id', target_id);
  } else if (adminOp === 'remove_trusted') {
    await supabase.from('profiles').update({ is_trusted: false }).eq('id', target_id);
  } else if (adminOp === 'make_mod') {
    await supabase.from('profiles').update({ role: 'mod' }).eq('id', target_id);
  }

  return res.status(200).json({ success: true });
}

async function membership(req, res, supabase) {
  const auth = await requireAdmin(req, supabase);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);

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
    // req.body.action is the membership op (separate from req.query.action router param)
    const { user_id, action: memOp } = req.body || {};
    if (!user_id || !['grant', 'revoke'].includes(memOp)) {
      return res.status(400).json({ error: 'Missing user_id or invalid action' });
    }
    const { error } = await supabase
      .from('profiles')
      .update({ is_member: memOp === 'grant' })
      .eq('id', user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, is_member: memOp === 'grant' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function flagged(req, res, supabase) {
  const auth = await requireAdmin(req, supabase);
  if (auth.error) return res.status(auth.error.status).json(auth.error.body);

  if (req.method === 'POST') {
    // req.body.action is the flagged-trade op (separate from req.query.action router param)
    const { trade_id, action: flagOp } = req.body || {};
    if (!trade_id || !flagOp) return res.status(400).json({ error: 'Missing trade_id or action' });
    const { error: upErr } = await supabase.from('trade_requests').update({ is_flagged: false }).eq('id', trade_id);
    if (upErr) return res.status(500).json({ error: upErr.message });
    return res.status(200).json({ success: true, action: flagOp });
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
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'check':       return check(req, res, supabase);
    case 'stats':       return stats(req, res, supabase);
    case 'listings':    return listListings(req, res, supabase);
    case 'users':       return listUsers(req, res, supabase);
    case 'action':      return adminAction(req, res, supabase);
    case 'membership':  return membership(req, res, supabase);
    case 'flagged':     return flagged(req, res, supabase);
    default:            return res.status(404).json({ error: 'Unknown action' });
  }
};
