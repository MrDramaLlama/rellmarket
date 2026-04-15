const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { item_name } = req.query;
  if (!item_name) return res.status(400).json({ error: 'Missing item_name' });

  const { data: prices } = await supabase
    .from('price_history')
    .select('*, buyer:profiles!price_history_buyer_id_fkey(username, roblox_username), seller:profiles!price_history_seller_id_fkey(username, roblox_username)')
    .eq('item_name', item_name)
    .order('recorded_at', { ascending: true });

  const { data: stats } = await supabase
    .from('price_stats')
    .select('*')
    .eq('item_name', item_name)
    .single();

  return res.status(200).json({ prices: prices || [], stats: stats || null });
}
