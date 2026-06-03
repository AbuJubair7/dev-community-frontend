// const BASE_URL = 'https://dev-community-amnn.onrender.com';
// const BASE_URL = 'https://dev-community-ten.vercel.app';
const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://dev-community-ten.vercel.app';
export async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}
