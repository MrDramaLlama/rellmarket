const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { trade_id } = req.body;
  if (!trade_id) return res.status(400).json({ error: 'Missing trade_id' });

  // Fetch the trade and verify the current user is the listing owner (receiver)
  const { data: trade, error: tradeErr } = await supabase
    .from('trade_requests')
    .select('*, listings(user_id)')
    .eq('id', trade_id)
    .single();

  if (tradeErr || !trade) return res.status(404).json({ error: 'Trade not found' });
  if (trade.listings?.user_id !== user.id) return res.status(403).json({ error: 'Not authorised' });
  if (trade.status !== 'accepted') return res.status(400).json({ error: 'Trade must be accepted first' });

  // Mark trade as completed
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

  return res.status(200).json({ success: true });
}
