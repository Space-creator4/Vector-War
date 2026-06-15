const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function authUrl() {
  return `${API_URL}/auth/discord`;
}

export function wsUrl(token) {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}/?token=${encodeURIComponent(token)}`;
}

export async function api(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `Request failed: ${response.status}`);
  }
  return response.json();
}
