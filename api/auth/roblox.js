export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.ROBLOX_CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile',
    state: Math.random().toString(36).substring(7)
  });
  res.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params}`);
}
