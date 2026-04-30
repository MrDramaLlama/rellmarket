const { createClient } = require('@supabase/supabase-js');

async function getPrice(req, res, supabase) {
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

async function getAllPrices(req, res, supabase) {
  const { data, error } = await supabase.from('price_stats').select('*').order('total_trades', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ stats: data || [] });
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'get': return getPrice(req, res, supabase);
    case 'all': return getAllPrices(req, res, supabase);
    default:    return res.status(404).json({ error: 'Unknown action' });
  }
};
