const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { category, rarity, search, limit = 50 } = req.query;

  let query = supabase
    .from('listings')
    .select('*, profiles(username, roblox_username, avatar_url)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  if (category && category !== 'all') query = query.eq('category', category);
  if (rarity) query = query.eq('rarity', rarity);
  if (search) query = query.ilike('item_name', `%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ listings: data });
}
