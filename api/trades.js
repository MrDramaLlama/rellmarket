const { createClient } = require('@supabase/supabase-js');

async function createTrade(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { listing_id, offered_item, offered_beli, message } = req.body;
  if (!listing_id || !offered_item) return res.status(400).json({ error: 'Missing required fields' });

  const { data, error } = await supabase.from('trade_requests').insert({
    sender_id: user.id,
    listing_id,
    offered_item,
    offered_beli: offered_beli || 0,
    message,
    status: 'pending'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Notify listing owner of new trade request
  const { data: listing } = await supabase.from('listings').select('user_id, item_name').eq('id', listing_id).single();
  if (listing && listing.user_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: listing.user_id,
      type: 'trade_request',
      title: 'New Trade Request',
      message: `Someone wants to trade for your ${listing.item_name}`,
      link: '/trades.html'
    });
  }

  return res.status(200).json({ success: true, trade: data });
}

async function getTrades(req, res, supabase) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { type } = req.query;

  if (type === 'incoming') {
    const { data: myListings } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', user.id);

    const listingIds = (myListings || []).map(l => l.id);
    if (!listingIds.length) return res.status(200).json({ trades: [] });

    const { data, error } = await supabase
      .from('trade_requests')
      .select('*, listings(item_name, category), profiles!sender_id(username, roblox_username)')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ trades: data || [] });

  } else if (type === 'outgoing') {
    const { data, error } = await supabase
      .from('trade_requests')
      .select('*, listings(item_name, category), profiles!sender_id(username, roblox_username)')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ trades: data || [] });
  }

  return res.status(400).json({ error: 'Missing type parameter' });
}

async function updateTrade(req, res, supabase) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.query;
  const { status } = req.body;

  // Fetch trade details before updating so we can notify the sender
  const { data: existing } = await supabase
    .from('trade_requests')
    .select('sender_id, listings(item_name)')
    .eq('id', id)
    .single();

  const { data, error } = await supabase.from('trade_requests')
    .update({ status })
    .eq('id', id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });

  if (existing && (status === 'accepted' || status === 'declined')) {
    const itemName = existing.listings?.item_name || 'your item';
    const isAccepted = status === 'accepted';
    await supabase.from('notifications').insert({
      user_id: existing.sender_id,
      type: isAccepted ? 'trade_accepted' : 'trade_declined',
      title: isAccepted ? 'Trade Request Accepted! 🎉' : 'Trade Request Declined',
      message: isAccepted
        ? `Your trade request for ${itemName} was accepted`
        : `Your trade request for ${itemName} was declined`,
      link: '/trades.html'
    });
  }

  return res.status(200).json({ success: true, trade: data });
}

async function completeTrade(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { trade_id } = req.body;
  if (!trade_id) return res.status(400).json({ error: 'Missing trade_id' });

  const { data: trade, error: tradeErr } = await supabase
    .from('trade_requests')
    .select('*, listings(user_id)')
    .eq('id', trade_id)
    .single();

  if (tradeErr || !trade) return res.status(404).json({ error: 'Trade not found' });
  if (trade.listings?.user_id !== user.id) return res.status(403).json({ error: 'Not authorised' });
  if (trade.status !== 'accepted') return res.status(400).json({ error: 'Trade must be accepted first' });

  const { error: updateErr } = await supabase
    .from('trade_requests')
    .update({ status: 'completed' })
    .eq('id', trade_id);
  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // Increment completed_trades for both parties and check verification threshold
  for (const userId of [user.id, trade.sender_id]) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('completed_trades')
      .eq('id', userId)
      .single();

    const newCount = (profile?.completed_trades || 0) + 1;
    const updates = { completed_trades: newCount };
    if (newCount >= 1) updates.is_verified = true;

    await supabase.from('profiles').update(updates).eq('id', userId);
  }

  // Record price to price_history if listing had a fixed price
  const { data: listing } = await supabase
    .from('listings')
    .select('item_name, price, price_type')
    .eq('id', trade.listing_id)
    .single();

  if (listing && listing.price) {
    await supabase.from('price_history').insert({
      item_name:  listing.item_name,
      price:      listing.price,
      trade_id,
      seller_id:  user.id,
      buyer_id:   trade.sender_id,
      listing_id: trade.listing_id,
    });
  }

  // Trigger RV recalculation (fire-and-forget — never blocks the response)
  // Path is rewritten by vercel.json to /api/values?action=recalculate
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://rellmarket.vercel.app';
  fetch(`${base}/api/values/recalculate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ trade_id }),
  }).catch(() => {});

  return res.status(200).json({ success: true });
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'create':   return createTrade(req, res, supabase);
    case 'get':      return getTrades(req, res, supabase);
    case 'update':   return updateTrade(req, res, supabase);
    case 'complete': return completeTrade(req, res, supabase);
    default:         return res.status(404).json({ error: 'Unknown action' });
  }
};
