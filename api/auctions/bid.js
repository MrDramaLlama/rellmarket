const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { auction_id, amount } = req.body;
  if (!auction_id || !amount) return res.status(400).json({ error: 'auction_id and amount are required' });

  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', auction_id)
    .single();

  if (!auction) return res.status(404).json({ error: 'Auction not found' });

  // Check if auction has ended (by status or by time).
  // Treat null/missing status as "active" so older rows still accept bids.
  const statusEnded = auction.status && auction.status !== 'active';
  if (statusEnded || new Date(auction.ends_at) <= new Date()) {
    return res.status(400).json({ error: 'This auction has already ended.' });
  }

  // Validate bid is high enough
  const minRequired = (auction.current_bid || auction.starting_price) + auction.min_increment;
  if (Number(amount) < minRequired) {
    return res.status(400).json({ error: `Bid must be at least ${minRequired.toLocaleString()} Beli` });
  }

  // Prevent seller from bidding on their own auction
  const { data: listing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', auction.listing_id)
    .single();

  if (listing?.user_id === user.id) {
    return res.status(403).json({ error: 'You cannot bid on your own auction' });
  }

  // Update auction current bid
  const { error: updateError } = await supabase
    .from('auctions')
    .update({ current_bid: Number(amount), current_bidder_id: user.id })
    .eq('id', auction_id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  // Notify previous highest bidder that they were outbid
  if (auction.current_bidder_id && auction.current_bidder_id !== user.id) {
    const { data: listingForNotif } = await supabase
      .from('listings')
      .select('item_name')
      .eq('id', auction.listing_id)
      .single();
    await supabase.from('notifications').insert({
      user_id: auction.current_bidder_id,
      type: 'outbid',
      title: 'You have been outbid! 🔨',
      message: `Someone placed a higher bid on ${listingForNotif?.item_name || 'an auction'}`,
      link: `/auction.html?listing_id=${auction.listing_id}`
    });
  }

  // Record bid in history
  await supabase.from('auction_bids').insert({
    auction_id,
    bidder_id: user.id,
    amount:    Number(amount),
  });

  return res.status(200).json({ success: true, current_bid: Number(amount) });
};
