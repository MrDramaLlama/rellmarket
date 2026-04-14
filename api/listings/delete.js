const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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
