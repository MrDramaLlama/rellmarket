const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { category, rarity, search, user_id, limit = 50 } = req.query;

  let query = supabase
    .from('listings')
    .select('*, profiles(username, roblox_username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  // When fetching a specific user's listings, show all (including inactive)
  // Otherwise only show active listings for the public feed
  if (user_id) {
    query = query.eq('user_id', user_id);
  } else {
    query = query.eq('is_active', true);
  }

  if (category && category !== 'all') query = query.eq('category', category);
  if (rarity) query = query.eq('rarity', rarity);
  if (search) query = query.ilike('item_name', `%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ listings: data });
}
