const { createClient } = require('@supabase/supabase-js');

async function getRatings(req, res, supabase) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const { data, error } = await supabase
    .from('trader_ratings')
    .select('is_positive')
    .eq('rated_id', user_id);

  if (error) return res.status(500).json({ error: 'Failed to fetch ratings' });

  const ratings = data || [];
  const positive = ratings.filter(r => r.is_positive === true).length;
  const negative = ratings.filter(r => r.is_positive === false).length;

  return res.status(200).json({ positive, negative, total: ratings.length });
}

async function createRating(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .select('id, status, requester_id, listing_id')
    .eq('id', trade_id)
    .single();

  if (tradeError || !trade) return res.status(404).json({ error: 'Trade not found' });
  if (trade.status !== 'completed') return res.status(400).json({ error: 'Trade is not completed' });

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
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'get':    return getRatings(req, res, supabase);
    case 'create': return createRating(req, res, supabase);
    default:       return res.status(404).json({ error: 'Unknown action' });
  }
};
