const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { auction_id } = req.body;
  if (!auction_id) return res.status(400).json({ error: 'auction_id is required' });

  // Fetch auction with listing info and current bidder profile
  const { data: auction, error: fetchError } = await supabase
    .from('auctions')
    .select(`
      *,
      listings(id, item_name, user_id),
      profiles!auctions_current_bidder_id_fkey(id, username, roblox_username)
    `)
    .eq('id', auction_id)
    .single();

  if (fetchError || !auction) return res.status(404).json({ error: 'Auction not found' });

  // Idempotent: already ended, nothing to do
  if (auction.status && auction.status !== 'active') {
    return res.status(200).json({ status: auction.status, already_ended: true });
  }

  // Refuse to end an auction that hasn't expired yet
  if (new Date(auction.ends_at) > new Date()) {
    return res.status(400).json({ error: 'Auction has not ended yet' });
  }

  const listing  = auction.listings;
  const hasBids  = !!auction.current_bidder_id;
  const itemName = listing?.item_name || 'item';

  if (hasBids) {
    const winnerId   = auction.current_bidder_id;
    const winnerName = auction.profiles?.roblox_username || auction.profiles?.username || 'the winner';
    const amount     = Number(auction.current_bid).toLocaleString();

    // Mark auction ended
    await supabase
      .from('auctions')
      .update({ status: 'ended_sold' })
      .eq('id', auction_id);

    // Deactivate listing
    await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('id', listing.id);

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: listing.user_id,
      type:    'auction_ended',
      title:   '🔨 Auction Ended!',
      message: `Your auction for ${itemName} ended! Winning bid: ${amount} Beli by ${winnerName}.`,
      link:    `/auction.html?id=${auction_id}`,
    });

    // Notify winner
    await supabase.from('notifications').insert({
      user_id: winnerId,
      type:    'auction_won',
      title:   '🎉 You Won the Auction!',
      message: `You won the auction for ${itemName}! Contact the seller to complete the trade.`,
      link:    `/auction.html?id=${auction_id}`,
    });

    // Create trade request from winner → seller
    await supabase.from('trade_requests').insert({
      sender_id:   winnerId,
      receiver_id: listing.user_id,
      listing_id:  listing.id,
      status:      'pending',
      message:     `Auction winner — winning bid: ${amount} Beli`,
    });

    return res.status(200).json({ status: 'ended_sold' });
  } else {
    // No bids placed
    await supabase
      .from('auctions')
      .update({ status: 'ended_no_bids' })
      .eq('id', auction_id);

    await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('id', listing.id);

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: listing.user_id,
      type:    'auction_ended_no_bids',
      title:   '🔨 Auction Ended — No Bids',
      message: `Your auction for ${itemName} ended with no bids. You can relist it from your listings page.`,
      link:    `/my-listings.html`,
    });

    return res.status(200).json({ status: 'ended_no_bids' });
  }
};
