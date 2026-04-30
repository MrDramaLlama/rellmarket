const { createClient } = require('@supabase/supabase-js');

async function createAuction(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { listing_id, starting_price, min_increment, duration_hours } = req.body;

  if (!listing_id || !starting_price || !duration_hours) {
    return res.status(400).json({ error: 'listing_id, starting_price, and duration_hours are required' });
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', listing_id)
    .single();

  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.user_id !== user.id) return res.status(403).json({ error: 'Not authorized' });

  const endsAt = new Date(Date.now() + Number(duration_hours) * 60 * 60 * 1000).toISOString();

  const { data: auction, error } = await supabase
    .from('auctions')
    .insert({
      listing_id,
      starting_price:  Number(starting_price),
      current_bid:     Number(starting_price),
      min_increment:   Number(min_increment) || 1000,
      ends_at:         endsAt,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from('listings')
    .update({ price_type: 'auction', price: Number(starting_price) })
    .eq('id', listing_id);

  return res.status(200).json({ auction });
}

async function placeBid(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const statusEnded = auction.status && auction.status !== 'active';
  if (statusEnded || new Date(auction.ends_at) <= new Date()) {
    return res.status(400).json({ error: 'This auction has already ended.' });
  }

  const minRequired = (auction.current_bid || auction.starting_price) + auction.min_increment;
  if (Number(amount) < minRequired) {
    return res.status(400).json({ error: `Bid must be at least ${minRequired.toLocaleString()} Beli` });
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', auction.listing_id)
    .single();

  if (listing?.user_id === user.id) {
    return res.status(403).json({ error: 'You cannot bid on your own auction' });
  }

  const { error: updateError } = await supabase
    .from('auctions')
    .update({ current_bid: Number(amount), current_bidder_id: user.id })
    .eq('id', auction_id);

  if (updateError) return res.status(500).json({ error: updateError.message });

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

  await supabase.from('auction_bids').insert({
    auction_id,
    bidder_id: user.id,
    amount:    Number(amount),
  });

  return res.status(200).json({ success: true, current_bid: Number(amount) });
}

async function getAuction(req, res, supabase) {
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

  const { data: bids } = await supabase
    .from('auction_bids')
    .select('*, profiles(username, roblox_username)')
    .eq('auction_id', auction.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return res.status(200).json({ auction, bids: bids || [] });
}

async function endAuction(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { auction_id } = req.body;
  if (!auction_id) return res.status(400).json({ error: 'auction_id is required' });

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

  if (auction.status && auction.status !== 'active') {
    return res.status(200).json({ status: auction.status, already_ended: true });
  }

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

    await supabase
      .from('auctions')
      .update({ status: 'ended_sold' })
      .eq('id', auction_id);

    await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('id', listing.id);

    await supabase.from('notifications').insert({
      user_id: listing.user_id,
      type:    'auction_ended',
      title:   '🔨 Auction Ended!',
      message: `Your auction for ${itemName} ended! Winning bid: ${amount} Beli by ${winnerName}.`,
      link:    `/auction.html?id=${auction_id}`,
    });

    await supabase.from('notifications').insert({
      user_id: winnerId,
      type:    'auction_won',
      title:   '🎉 You Won the Auction!',
      message: `You won the auction for ${itemName}! Contact the seller to complete the trade.`,
      link:    `/auction.html?id=${auction_id}`,
    });

    await supabase.from('trade_requests').insert({
      sender_id:   winnerId,
      receiver_id: listing.user_id,
      listing_id:  listing.id,
      status:      'pending',
      message:     `Auction winner — winning bid: ${amount} Beli`,
    });

    return res.status(200).json({ status: 'ended_sold' });
  } else {
    await supabase
      .from('auctions')
      .update({ status: 'ended_no_bids' })
      .eq('id', auction_id);

    await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('id', listing.id);

    await supabase.from('notifications').insert({
      user_id: listing.user_id,
      type:    'auction_ended_no_bids',
      title:   '🔨 Auction Ended — No Bids',
      message: `Your auction for ${itemName} ended with no bids. You can relist it from your listings page.`,
      link:    `/my-listings.html`,
    });

    return res.status(200).json({ status: 'ended_no_bids' });
  }
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'create': return createAuction(req, res, supabase);
    case 'bid':    return placeBid(req, res, supabase);
    case 'get':    return getAuction(req, res, supabase);
    case 'end':    return endAuction(req, res, supabase);
    default:       return res.status(404).json({ error: 'Unknown action' });
  }
};
