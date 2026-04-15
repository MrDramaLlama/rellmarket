const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

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
