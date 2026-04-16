const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { item_name } = req.query;

  if (item_name) {
    const { data, error } = await supabase
      .from('item_values')
      .select('item_name, rv, manual_rv, demand_tier, is_established, last_updated')
      .eq('item_name', item_name)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Item not found' });
    return res.status(200).json({ item: data });
  }

  const { data, error } = await supabase
    .from('item_values')
    .select('item_name, rv, manual_rv, demand_tier, is_established, last_updated')
    .order('item_name');
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ items: data || [] });
};
