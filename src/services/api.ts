const API_URL = process.env.REACT_APP_API_URL;
console.log("API_URL:", API_URL);

// GET genérico
async function get<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// POST genérico
async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

const api = { get, post }; // ahora api tiene ambos métodos
export default api;