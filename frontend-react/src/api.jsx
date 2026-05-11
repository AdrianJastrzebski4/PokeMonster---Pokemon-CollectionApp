import { getToken } from "./auth";

const API = ""; 

export async function apiGet(path) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const r = await fetch(API + path, { headers });
  if (!r.ok) throw await safeJson(r);
  return r.json();
}

export async function apiSend(path, method, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const r = await fetch(API + path, {
    method,
    headers,
    body: JSON.stringify(body ?? {}),
  });

  const data = await safeJson(r);
  if (!r.ok) throw data;
  return data;
}

async function safeJson(r) {
  try {
    return await r.json();
  } catch {
    return {};
  }
}