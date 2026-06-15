import jwt from "jsonwebtoken";

const fallbackSecret = "dev-only-vector-war-secret";

export function signPlayer(player) {
  return jwt.sign(
    {
      discord_id: player.discord_id,
      username: player.username
    },
    process.env.JWT_SECRET || fallbackSecret,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || fallbackSecret);
}
