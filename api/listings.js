const { createClient } = require('@supabase/supabase-js');

async function createListing(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid session' });

  const { item_name, category, rarity, fruit_type, price, price_type, listing_type, description, image_url, accepts_other_offers } = req.body;
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
    accepts_other_offers: accepts_other_offers !== false,
    is_active: true
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, listing: data });
}

async function getListings(req, res, supabase) {
  const { category, rarity, search, user_id, sort, listing_type, price_type, featured, count_only, limit = 20, offset = 0 } = req.query;
  const pageLimit  = Number(limit);
  const pageOffset = Number(offset);

  if (count_only === 'true') {
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (category && category !== 'all') countQuery = countQuery.eq('category', category);
    if (listing_type === 'looking') countQuery = countQuery.eq('listing_type', 'looking');
    else if (!listing_type) countQuery = countQuery.or('listing_type.eq.selling,listing_type.is.null');
    const { count, error: countError } = await countQuery;
    if (countError) return res.status(500).json({ error: countError.message });
    return res.status(200).json({ count: count || 0 });
  }

  const selectFields = sort === 'popular'
    ? '*, profiles(username, roblox_username, avatar_url, is_verified, is_trusted), auctions(id, current_bid, min_increment, starting_price, ends_at), trade_requests(count), listing_wants(item_name, quantity)'
    : '*, profiles(username, roblox_username, avatar_url, is_verified, is_trusted), auctions(id, current_bid, min_increment, starting_price, ends_at), listing_wants(item_name, quantity)';

  let query = supabase
    .from('listings')
    .select(selectFields)
    .range(pageOffset, pageOffset + pageLimit - 1);

  if (sort === 'popular') {
    query = query.order('count', { referencedTable: 'trade_requests', ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (user_id) {
    query = query.eq('user_id', user_id);
  } else {
    query = query.eq('is_active', true);
  }

  if (category && category !== 'all') query = query.eq('category', category);
  if (rarity) query = query.eq('rarity', rarity);
  if (search) query = query.ilike('item_name', `%${search}%`);

  if (listing_type === 'looking') {
    query = query.eq('listing_type', 'looking');
  } else if (listing_type === 'selling') {
    query = query.or('listing_type.eq.selling,listing_type.is.null');
  }

  if (price_type) query = query.eq('price_type', price_type);

  if (featured === 'true') query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const hasMore = data.length === pageLimit;
  return res.status(200).json({ listings: data, hasMore });
}

async function getOneListing(req, res, supabase) {
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

async function deleteListing(req, res, supabase) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing listing id' });

  const { error } = await supabase.from('listings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function updateListing(req, res, supabase) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;
  const { item_name, category, rarity, fruit_type, price, price_type, description, is_active } = req.body;

  const { data, error } = await supabase.from('listings')
    .update({ item_name, category, rarity, fruit_type, price, price_type, description, is_active })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, listing: data });
}

async function reportListing(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
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

async function featureListing(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // Note: req.body.action is the feature/unfeature toggle (separate from req.query.action router param)
  const { listing_id, action: featureAction } = req.body || {};
  if (!listing_id || !['feature', 'unfeature'].includes(featureAction)) {
    return res.status(400).json({ error: 'Missing listing_id or invalid action' });
  }

  const { data: listing, error: lErr } = await supabase
    .from('listings')
    .select('id, user_id')
    .eq('id', listing_id)
    .single();
  if (lErr || !listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.user_id !== user.id) {
    return res.status(403).json({ error: 'You do not own this listing' });
  }

  if (featureAction === 'unfeature') {
    const { error } = await supabase
      .from('listings')
      .update({ is_featured: false })
      .eq('id', listing_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, is_featured: false });
  }

  // featureAction === 'feature': clear other featured listings by this user first, then flag this one.
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
}

async function createWants(req, res, supabase) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { listing_id, wants } = req.body;
  if (!listing_id) return res.status(400).json({ error: 'Missing listing_id' });
  if (!Array.isArray(wants)) return res.status(400).json({ error: 'wants must be an array' });

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, user_id')
    .eq('id', listing_id)
    .single();

  if (listingError || !listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

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
}

async function getWants(req, res, supabase) {
  const { listing_id } = req.query;
  if (!listing_id) return res.status(400).json({ error: 'Missing listing_id' });

  const { data, error } = await supabase
    .from('listing_wants')
    .select('item_name, quantity')
    .eq('listing_id', listing_id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ wants: data || [] });
}

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = req.query.action;

  switch (action) {
    case 'create':       return createListing(req, res, supabase);
    case 'get':          return getListings(req, res, supabase);
    case 'getone':       return getOneListing(req, res, supabase);
    case 'delete':       return deleteListing(req, res, supabase);
    case 'update':       return updateListing(req, res, supabase);
    case 'report':       return reportListing(req, res, supabase);
    case 'feature':      return featureListing(req, res, supabase);
    case 'wants-create': return createWants(req, res, supabase);
    case 'wants-get':    return getWants(req, res, supabase);
    default:             return res.status(404).json({ error: 'Unknown action' });
  }
};
