const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { user_id, type, title, message, link } = req.body;
  const { error } = await supabase.from('notifications').insert({ user_id, type, title, message, link });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
