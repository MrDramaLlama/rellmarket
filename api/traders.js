const { createClient } = require('@supabase/supabase-js');

async function featured(req, res, supabase) {
  // Fetch verified or trusted profiles (public endpoint — no auth required)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, roblox_username, avatar_url, is_verified, is_trusted')
    .or('is_verified.eq.true,is_trusted.eq.true')
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  if (!profiles?.length) return res.status(200).json({ traders: [] });

  // Count active listings per trader in one query
  const userIds = profiles.map(p => p.id);
  const { data: listings } = await supabase
    .from('listings')
    .select('user_id')
    .in('user_id', userIds)
    .eq('is_active', true);

  const countMap = {};
  (listings || []).forEach(l => {
    countMap[l.user_id] = (countMap[l.user_id] || 0) + 1;
  });

  const traders = profiles.map(p => ({ ...p, listing_count: countMap[p.id] || 0 }));
  return res.status(200).json({ traders });
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'featured': return featured(req, res, supabase);
    default:         return res.status(404).json({ error: 'Unknown action' });
  }
};
