import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.redirect('/login.html?error=no_code');

  try {
    // Exchange code for token
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

    // Get Roblox user info
    const userRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const robloxUser = await userRes.json();

    // Sign in or create user in Supabase
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('roblox_id', String(robloxUser.sub))
      .single();

    let userId;
    if (!existing) {
      // Create new user
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

    // Create a session token
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
