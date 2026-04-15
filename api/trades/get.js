const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { type } = req.query;

  if (type === 'incoming') {
    // Get all listings owned by this user
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
