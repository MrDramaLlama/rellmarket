const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { listing_id, starting_price, min_increment, duration_hours } = req.body;

  if (!listing_id || !starting_price || !duration_hours) {
    return res.status(400).json({ error: 'listing_id, starting_price, and duration_hours are required' });
  }

  // Verify the listing belongs to this user
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

  // Mark the listing as an auction
  await supabase
    .from('listings')
    .update({ price_type: 'auction', price: Number(starting_price) })
    .eq('id', listing_id);

  return res.status(200).json({ auction });
};
