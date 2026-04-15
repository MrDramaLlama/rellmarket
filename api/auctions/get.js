const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { auction_id, listing_id } = req.query;

  if (!auction_id && !listing_id) {
    return res.status(400).json({ error: 'auction_id or listing_id is required' });
  }

  let query = supabase
    .from('auctions')
    .select(`
      *,
      listings(*, profiles(username, roblox_username, avatar_url, is_verified, is_trusted)),
      profiles!auctions_current_bidder_id_fkey(username, roblox_username)
    `);

  if (auction_id) {
    query = query.eq('id', auction_id);
  } else {
    query = query.eq('listing_id', listing_id);
  }

  const { data: auction, error } = await query.single();

  if (error || !auction) return res.status(404).json({ error: 'Auction not found' });

  // Fetch bid history with bidder usernames
  const { data: bids } = await supabase
    .from('auction_bids')
    .select('*, profiles(username, roblox_username)')
    .eq('auction_id', auction.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return res.status(200).json({ auction, bids: bids || [] });
};
