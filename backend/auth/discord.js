import axios from "axios";

const DISCORD_API = "https://discord.com/api";

export function discordConfigured() {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

export function discordLoginUrl() {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "identify"
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForUser(code) {
  const token = await axios.post(
    `${DISCORD_API}/oauth2/token`,
    new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri()
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const user = await axios.get(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${token.data.access_token}` }
  });

  return {
    discord_id: user.data.id,
    username: user.data.global_name || user.data.username
  };
}

function redirectUri() {
  return process.env.DISCORD_REDIRECT_URI || `${process.env.PUBLIC_API_URL || "http://localhost:4000"}/auth/callback`;
}
