const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const { data, error } = await supabase
    .from('trader_ratings')
    .select('is_positive')
    .eq('rated_id', user_id);

  if (error) return res.status(500).json({ error: 'Failed to fetch ratings' });

  const ratings = data || [];
  const positive = ratings.filter(r => r.is_positive === true).length;
  const negative = ratings.filter(r => r.is_positive === false).length;

  return res.status(200).json({ positive, negative, total: ratings.length });
};
