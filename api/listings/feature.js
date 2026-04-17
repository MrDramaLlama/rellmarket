const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { listing_id, action } = req.body || {};
  if (!listing_id || !['feature', 'unfeature'].includes(action)) {
    return res.status(400).json({ error: 'Missing listing_id or invalid action' });
  }

  // Verify the listing exists and belongs to this user.
  const { data: listing, error: lErr } = await supabase
    .from('listings')
    .select('id, user_id')
    .eq('id', listing_id)
    .single();
  if (lErr || !listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.user_id !== user.id) {
    return res.status(403).json({ error: 'You do not own this listing' });
  }

  if (action === 'unfeature') {
    const { error } = await supabase
      .from('listings')
      .update({ is_featured: false })
      .eq('id', listing_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, is_featured: false });
  }

  // action === 'feature': clear other featured listings by this user first, then flag this one.
  const { error: clearErr } = await supabase
    .from('listings')
    .update({ is_featured: false })
    .eq('user_id', user.id)
    .neq('id', listing_id);
  if (clearErr) return res.status(500).json({ error: clearErr.message });

  const { error: setErr } = await supabase
    .from('listings')
    .update({ is_featured: true })
    .eq('id', listing_id);
  if (setErr) return res.status(500).json({ error: setErr.message });

  return res.status(200).json({ success: true, is_featured: true });
};
