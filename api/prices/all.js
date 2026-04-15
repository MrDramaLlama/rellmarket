const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase.from('price_stats').select('*').order('total_trades', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ stats: data || [] });
}
