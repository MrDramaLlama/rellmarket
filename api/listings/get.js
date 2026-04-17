const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { category, rarity, search, user_id, sort, listing_type, price_type, featured, count_only, limit = 20, offset = 0 } = req.query;
  const pageLimit  = Number(limit);
  const pageOffset = Number(offset);

  // count_only=true: return just the count for this filter set (used for category grid)
  if (count_only === 'true') {
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (category && category !== 'all') countQuery = countQuery.eq('category', category);
    if (listing_type === 'looking') countQuery = countQuery.eq('listing_type', 'looking');
    else if (!listing_type) countQuery = countQuery.or('listing_type.eq.selling,listing_type.is.null');
    const { count, error: countError } = await countQuery;
    if (countError) return res.status(500).json({ error: countError.message });
    return res.status(200).json({ count: count || 0 });
  }

  const selectFields = sort === 'popular'
    ? '*, profiles(username, roblox_username, avatar_url, is_verified, is_trusted), auctions(id, current_bid, min_increment, starting_price, ends_at), trade_requests(count), listing_wants(item_name, quantity)'
    : '*, profiles(username, roblox_username, avatar_url, is_verified, is_trusted), auctions(id, current_bid, min_increment, starting_price, ends_at), listing_wants(item_name, quantity)';

  let query = supabase
    .from('listings')
    .select(selectFields)
    .range(pageOffset, pageOffset + pageLimit - 1);

  if (sort === 'popular') {
    query = query.order('count', { referencedTable: 'trade_requests', ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

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

  // Listing type filter
  if (listing_type === 'looking') {
    query = query.eq('listing_type', 'looking');
  } else if (listing_type === 'selling') {
    query = query.or('listing_type.eq.selling,listing_type.is.null');
  }

  // Price type filter (e.g. price_type=auction for auctions section)
  if (price_type) query = query.eq('price_type', price_type);

  // Featured filter (homepage featured section)
  if (featured === 'true') query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const hasMore = data.length === pageLimit;
  return res.status(200).json({ listings: data, hasMore });
}
