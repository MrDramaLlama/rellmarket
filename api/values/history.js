const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { item_name } = req.query;
  if (!item_name) return res.status(400).json({ error: 'Missing item_name' });

  const { data, error } = await supabase
    .from('rv_history')
    .select('rv, recorded_at')
    .eq('item_name', item_name)
    .order('recorded_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ history: data || [] });
};
