const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.eq.${username},roblox_username.eq.${username}`)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return res.status(200).json({ profile, listings: listings || [] });
}
