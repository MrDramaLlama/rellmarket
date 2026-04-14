const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { type } = req.query;

  let query = supabase
    .from('trade_requests')
    .select('*, listings(item_name, category), profiles!sender_id(username, roblox_username)')
    .order('created_at', { ascending: false });

  if (type === 'incoming') {
    query = query.eq('listings.user_id', user.id);
  } else if (type === 'outgoing') {
    query = query.eq('sender_id', user.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ trades: data });
}
