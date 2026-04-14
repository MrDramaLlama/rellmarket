const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.redirect('/login.html?error=no_code');

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect('/login.html?error=discord_failed');

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const discordUser = await userRes.json();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const token = req.cookies?.['sb-access-token'] || req.headers?.authorization?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      await supabase.from('profiles').update({
        discord_id: discordUser.id,
        discord_username: discordUser.username
      }).eq('id', user.id);
    }

    res.redirect('/my-listings.html?discord=connected');
  } catch (err) {
    console.error(err);
    res.redirect('/login.html?error=discord_error');
  }
}
