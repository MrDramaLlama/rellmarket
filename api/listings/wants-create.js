const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Auth
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { listing_id, wants } = req.body;
  if (!listing_id) return res.status(400).json({ error: 'Missing listing_id' });
  if (!Array.isArray(wants)) return res.status(400).json({ error: 'wants must be an array' });

  // Verify the listing belongs to this user
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, user_id')
    .eq('id', listing_id)
    .single();

  if (listingError || !listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // Replace all existing wants for this listing
  await supabase.from('listing_wants').delete().eq('listing_id', listing_id);

  if (wants.length === 0) return res.status(200).json({ ok: true });

  const rows = wants
    .filter(w => w.item_name && String(w.item_name).trim())
    .map(w => ({
      listing_id,
      item_name: String(w.item_name).trim(),
      quantity:  Math.max(1, Number(w.quantity) || 1),
    }));

  if (rows.length === 0) return res.status(200).json({ ok: true });

  const { error: insertError } = await supabase.from('listing_wants').insert(rows);
  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json({ ok: true });
};
