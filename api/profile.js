const { createClient } = require('@supabase/supabase-js');

async function getProfile(req, res, supabase) {
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

async function updateProfile(req, res, supabase) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { username, bio } = req.body;

  if (username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single();
    if (existing) return res.status(400).json({ error: 'Username already taken' });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username, bio })
    .eq('id', user.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'get':    return getProfile(req, res, supabase);
    case 'update': return updateProfile(req, res, supabase);
    default:       return res.status(404).json({ error: 'Unknown action' });
  }
};
