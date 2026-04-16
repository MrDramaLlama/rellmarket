const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { listing_id } = req.query;
  if (!listing_id) return res.status(400).json({ error: 'Missing listing_id' });

  const { data, error } = await supabase
    .from('listing_wants')
    .select('item_name, quantity')
    .eq('listing_id', listing_id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ wants: data || [] });
};
