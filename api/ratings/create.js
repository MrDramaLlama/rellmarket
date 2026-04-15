const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { rated_id, trade_id, is_positive } = req.body;

  if (!rated_id || !trade_id || is_positive === undefined || is_positive === null) {
    return res.status(400).json({ error: 'rated_id, trade_id, and is_positive are required' });
  }

  if (rated_id === user.id) {
    return res.status(400).json({ error: 'You cannot rate yourself' });
  }

  // Check trade exists and is completed
  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .select('id, status, requester_id, listing_id')
    .eq('id', trade_id)
    .single();

  if (tradeError || !trade) return res.status(404).json({ error: 'Trade not found' });
  if (trade.status !== 'completed') return res.status(400).json({ error: 'Trade is not completed' });

  // Check both parties are valid
  const { data: listing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', trade.listing_id)
    .single();

  const listingOwnerId = listing?.user_id;
  const raterIsParty = user.id === trade.requester_id || user.id === listingOwnerId;
  if (!raterIsParty) return res.status(403).json({ error: 'You are not a party to this trade' });

  const ratedIsParty = rated_id === trade.requester_id || rated_id === listingOwnerId;
  if (!ratedIsParty) return res.status(400).json({ error: 'Rated user is not a party to this trade' });

  const { error: insertError } = await supabase
    .from('trader_ratings')
    .insert({
      rater_id: user.id,
      rated_id,
      trade_id,
      is_positive: Boolean(is_positive),
    });

  if (insertError) {
    if (insertError.code === '23505') {
      return res.status(409).json({ error: 'You have already rated this trade' });
    }
    return res.status(500).json({ error: 'Failed to save rating' });
  }

  return res.status(200).json({ success: true });
};
