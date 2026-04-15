const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' });

  const { item_name, category, rarity, fruit_type, price, price_type, listing_type, description, image_url } = req.body;
  if (!item_name || !category) return res.status(400).json({ error: 'Missing required fields' });

  const { data, error } = await supabase.from('listings').insert({
    user_id: user.id,
    item_name,
    category,
    rarity,
    fruit_type,
    price: price || null,
    price_type: price_type || 'offer',
    listing_type: listing_type || 'selling',
    description,
    image_url,
    is_active: true
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, listing: data });
}
