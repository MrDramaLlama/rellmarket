const { createClient } = require('@supabase/supabase-js');

function robloxRedirect(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.ROBLOX_CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile',
    state: Math.random().toString(36).substring(7)
  });
  res.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params}`);
}

async function robloxCallback(req, res) {
  const { code } = req.query;
  if (!code) return res.redirect('/login.html?error=no_code');

  try {
    const tokenRes = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.ROBLOX_CLIENT_ID,
        client_secret: process.env.ROBLOX_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.REDIRECT_URI,
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect('/login.html?error=token_failed');

    const userRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const robloxUser = await userRes.json();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('roblox_id', String(robloxUser.sub))
      .single();

    let userId;
    if (!existing) {
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: `${robloxUser.sub}@roblox.rellmarket.app`,
        password: Math.random().toString(36),
        email_confirm: true
      });
      userId = authUser.user.id;
      await supabase.from('profiles').insert({
        id: userId,
        username: robloxUser.preferred_username || robloxUser.name,
        roblox_id: String(robloxUser.sub),
        roblox_username: robloxUser.preferred_username || robloxUser.name,
        avatar_url: robloxUser.picture || ''
      });
    } else {
      userId = existing.id;
    }

    const { data: session } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${robloxUser.sub}@roblox.rellmarket.app`
    });

    res.redirect(`/auth-success.html?token=${session?.properties?.hashed_token || ''}&username=${encodeURIComponent(robloxUser.preferred_username || robloxUser.name)}`);
  } catch (err) {
    console.error(err);
    res.redirect('/login.html?error=server_error');
  }
}

function discordRedirect(req, res) {
  const { token } = req.query;
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
    state: token || ''
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
}

async function discordCallback(req, res) {
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
    const token = req.query.state;
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

module.exports = async function handler(req, res) {
  const action = req.query.action;
  switch (action) {
    case 'roblox':            return robloxRedirect(req, res);
    case 'callback':          return robloxCallback(req, res);
    case 'discord':           return discordRedirect(req, res);
    case 'discord-callback':  return discordCallback(req, res);
    default:                  return res.status(404).json({ error: 'Unknown action' });
  }
};
