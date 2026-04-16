const { createClient } = require('@supabase/supabase-js');

// ── Trust weight helpers ──────────────────────────────────────────────────────
function trustWeight(profile) {
  if (!profile) return 0;
  if (profile.is_trusted) return 1.5;
  if (profile.is_verified) return 1.0;
  return 0;
}

// ── Write new RV to item_values + rv_history ──────────────────────────────────
async function writeRV(supabase, itemName, newRV) {
  const rounded = Math.round(newRV * 100) / 100;
  await supabase
    .from('item_values')
    .upsert({ item_name: itemName, rv: rounded, last_updated: new Date().toISOString() },
             { onConflict: 'item_name' });
  await supabase.from('rv_history').insert({
    item_name: itemName,
    rv: rounded,
    recorded_at: new Date().toISOString(),
  });
  await checkEstablishment(supabase, itemName);
}

// ── Check if item qualifies as established ────────────────────────────────────
async function checkEstablishment(supabase, itemName) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: allListings } = await supabase
    .from('listings').select('id').eq('item_name', itemName);
  const ids = (allListings || []).map(l => l.id);
  if (!ids.length) return;

  const { count: tradeCount } = await supabase
    .from('trade_requests')
    .select('id', { count: 'exact', head: true })
    .in('listing_id', ids)
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo);

  const { data: firstTrade } = await supabase
    .from('trade_requests')
    .select('created_at')
    .in('listing_id', ids)
    .eq('status', 'completed')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000);
  const oldEnough = firstTrade && new Date(firstTrade.created_at) <= fourteenDaysAgo;

  if ((tradeCount || 0) >= 10 && oldEnough) {
    await supabase.from('item_values')
      .update({ is_established: true })
      .eq('item_name', itemName);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { trade_id } = req.body;
  if (!trade_id) return res.status(400).json({ error: 'trade_id required' });

  // ── Fetch trade with listing and sender profile ───────────────────────────
  const { data: trade, error: tradeErr } = await supabase
    .from('trade_requests')
    .select('id, sender_id, listing_id, offered_item, offered_beli, status, created_at, is_flagged')
    .eq('id', trade_id)
    .single();
  if (tradeErr || !trade) return res.status(404).json({ error: 'Trade not found' });
  if (trade.status !== 'completed') return res.status(400).json({ error: 'Trade not completed' });
  // Skip trades already flagged (will be approved explicitly by admin)
  if (trade.is_flagged) return res.status(200).json({ skipped: true, reason: 'flagged' });

  const { data: listing } = await supabase
    .from('listings')
    .select('item_name, price, price_type, user_id')
    .eq('id', trade.listing_id)
    .single();
  if (!listing) return res.status(400).json({ error: 'Listing not found' });

  const senderId   = trade.sender_id;
  const receiverId = listing.user_id;
  const itemName   = listing.item_name;
  const offeredBeli = Number(trade.offered_beli || 0);
  const offeredItem = trade.offered_item || null;

  // ── Fetch both profiles ───────────────────────────────────────────────────
  const [{ data: senderProfile }, { data: receiverProfile }] = await Promise.all([
    supabase.from('profiles').select('is_verified, is_trusted, created_at').eq('id', senderId).single(),
    supabase.from('profiles').select('is_verified, is_trusted, created_at').eq('id', receiverId).single(),
  ]);

  const w1 = trustWeight(senderProfile);
  const w2 = trustWeight(receiverProfile);
  const tradeWeight = (w1 + w2) / 2;
  if (tradeWeight === 0) return res.status(200).json({ skipped: true, reason: 'both_unverified' });

  // ── Manipulation flags ────────────────────────────────────────────────────
  const flags = [];
  const now = Date.now();
  const ms30d = 30 * 24 * 3600 * 1000;
  const ms7d  =  7 * 24 * 3600 * 1000;
  const thirtyDaysAgo = new Date(now - ms30d).toISOString();
  const sevenDaysAgo  = new Date(now - ms7d).toISOString();

  // Fetch completed trades between this pair in last 30 days
  const { data: pairTrades } = await supabase
    .from('trade_requests')
    .select('id, sender_id, listing_id, created_at, listings(user_id, item_name)')
    .in('sender_id', [senderId, receiverId])
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo);

  const between = (pairTrades || []).filter(t => {
    const owner = t.listings?.user_id;
    return (t.sender_id === senderId   && owner === receiverId) ||
           (t.sender_id === receiverId && owner === senderId);
  });

  // Flag 1: Same pair, same item, 3+ times in 30 days
  const sameItemCount = between.filter(t => t.listings?.item_name === itemName).length;
  if (sameItemCount >= 3) flags.push('same_pair_same_item_3x');

  // Flag 2: Same pair, 5+ trades in 7 days
  const recent7d = between.filter(t => new Date(t.created_at) >= new Date(sevenDaysAgo));
  if (recent7d.length >= 5) flags.push('same_pair_5x_7d');

  // Flag 3: Item RV changed >20% in last 7 days
  const { data: rvSnap } = await supabase
    .from('rv_history')
    .select('rv')
    .eq('item_name', itemName)
    .gte('recorded_at', sevenDaysAgo)
    .order('recorded_at', { ascending: true })
    .limit(1);
  const { data: currentRow } = await supabase
    .from('item_values').select('rv, manual_rv, is_established').eq('item_name', itemName).single();
  if (rvSnap?.length && currentRow?.rv) {
    const pctChange = Math.abs(currentRow.rv - rvSnap[0].rv) / (rvSnap[0].rv || 1);
    if (pctChange > 0.20) flags.push('rv_spike_20pct_7d');
  }

  // Flag 4: Both accounts created within 7 days of each other
  if (senderProfile?.created_at && receiverProfile?.created_at) {
    const diff = Math.abs(new Date(senderProfile.created_at) - new Date(receiverProfile.created_at));
    if (diff < ms7d) flags.push('accounts_created_same_week');
  }

  // Flag 5: New verified account (<30 days old) trading high-value item (RV >= 10)
  const currentRV = currentRow?.rv || 0;
  for (const p of [senderProfile, receiverProfile]) {
    if (!p || !p.is_verified) continue;
    if (new Date(p.created_at) >= new Date(now - ms30d) && currentRV >= 10) {
      flags.push('new_verified_high_rv_item');
      break;
    }
  }

  // If 2+ flags triggered: mark flagged, skip RV update
  if (flags.length >= 2) {
    await supabase.from('trade_requests')
      .update({ is_flagged: true })
      .eq('id', trade_id);
    return res.status(200).json({ flagged: true, flag_count: flags.length });
  }

  // ── Determine effective RV of current item ────────────────────────────────
  // While unestablished, use manual_rv as base; fall back to rv, then null
  const baseRV = currentRow
    ? (currentRow.is_established ? currentRow.rv : (currentRow.manual_rv || currentRow.rv))
    : null;

  // ── Beli trade ────────────────────────────────────────────────────────────
  const beliAmount = offeredBeli > 0 ? offeredBeli
    : (listing.price_type === 'fixed' && listing.price ? Number(listing.price) : 0);

  if (beliAmount > 0 && (!offeredItem || offeredBeli > 0)) {
    const tradeRV = beliAmount / 10_000_000;

    // Sanity check: outside 50%–200% of current RV → skip
    if (baseRV && (tradeRV < baseRV * 0.5 || tradeRV > baseRV * 2.0)) {
      return res.status(200).json({ skipped: true, reason: 'outside_sanity_range' });
    }

    const newRV = baseRV
      ? (baseRV * 0.95) + (tradeRV * 0.05 * tradeWeight)
      : tradeRV;

    await writeRV(supabase, itemName, newRV);
    return res.status(200).json({ success: true, type: 'beli' });
  }

  // ── Item-for-item trade ───────────────────────────────────────────────────
  if (offeredItem) {
    const [{ data: rowA }, { data: rowB }] = await Promise.all([
      supabase.from('item_values').select('rv, manual_rv, is_established').eq('item_name', itemName).single(),
      supabase.from('item_values').select('rv, manual_rv, is_established').eq('item_name', offeredItem).single(),
    ]);

    const rvA = rowA ? (rowA.is_established ? rowA.rv : (rowA.manual_rv || rowA.rv)) : null;
    const rvB = rowB ? (rowB.is_established ? rowB.rv : (rowB.manual_rv || rowB.rv)) : null;

    if (!rvA || !rvB) return res.status(200).json({ skipped: true, reason: 'missing_rv_for_item' });

    const midpoint = (rvA + rvB) / 2;
    const newRvA = rvA + (midpoint - rvA) * 0.05 * tradeWeight;
    const newRvB = rvB + (midpoint - rvB) * 0.05 * tradeWeight;

    // Per-item sanity check
    if (newRvA >= rvA * 0.5 && newRvA <= rvA * 2.0) await writeRV(supabase, itemName, newRvA);
    if (newRvB >= rvB * 0.5 && newRvB <= rvB * 2.0) await writeRV(supabase, offeredItem, newRvB);

    return res.status(200).json({ success: true, type: 'item' });
  }

  return res.status(200).json({ skipped: true, reason: 'no_trade_value' });
};
