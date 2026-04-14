module.exports = function handler(req, res) {
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
