const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const { listing_id, reason } = req.body;
  if (!listing_id || !reason) return res.status(400).json({ error: 'Missing fields' });
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    listing_id,
    reason
  });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
