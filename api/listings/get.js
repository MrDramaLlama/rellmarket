const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { category, rarity, search, user_id, limit = 20, offset = 0 } = req.query;
  const pageLimit  = Number(limit);
  const pageOffset = Number(offset);

  let query = supabase
    .from('listings')
    .select('*, profiles(username, roblox_username, avatar_url, is_verified, is_trusted), auctions(id, current_bid, min_increment, starting_price, ends_at)')
    .order('created_at', { ascending: false })
    .range(pageOffset, pageOffset + pageLimit - 1);

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

  const hasMore = data.length === pageLimit;
  return res.status(200).json({ listings: data, hasMore });
}
