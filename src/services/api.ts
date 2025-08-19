const API_URL = process.env.REACT_APP_API_URL;
console.log("API_URL:", API_URL);


async function get<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

const api = { get };
export default api;
