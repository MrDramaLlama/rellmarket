const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Admin auth check
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Not authenticated' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'mod'].includes(profile.role)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { item_name, rv, demand_tier } = req.body;
  if (!item_name) return res.status(400).json({ error: 'item_name is required' });

  const updates = {
    item_name,
    last_updated: new Date().toISOString(),
  };
  if (rv !== undefined && rv !== null && rv !== '') {
    const numRV = Number(rv);
    if (isNaN(numRV) || numRV < 0) return res.status(400).json({ error: 'Invalid rv value' });
    updates.rv = numRV;
    updates.manual_rv = numRV;
  }
  if (demand_tier !== undefined) {
    const valid = ['low', 'medium', 'high', 'very_high', null];
    if (!valid.includes(demand_tier)) return res.status(400).json({ error: 'Invalid demand_tier' });
    updates.demand_tier = demand_tier;
  }

  const { error: upsertError } = await supabase
    .from('item_values')
    .upsert(updates, { onConflict: 'item_name' });
  if (upsertError) return res.status(500).json({ error: upsertError.message });

  // Record the manual change in history
  if (updates.rv !== undefined) {
    await supabase.from('rv_history').insert({
      item_name,
      rv: updates.rv,
      recorded_at: new Date().toISOString(),
    });
  }

  return res.status(200).json({ success: true });
};
