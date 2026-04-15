const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
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

  // Notify the sender when their request is accepted or declined
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
