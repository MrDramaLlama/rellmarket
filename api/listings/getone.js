const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles(username, roblox_username, avatar_url, is_verified, is_trusted)')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ listing: data });
}
