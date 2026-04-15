const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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
