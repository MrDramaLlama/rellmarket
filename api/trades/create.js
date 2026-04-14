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
  return res.status(200).json({ success: true, trade: data });
}
