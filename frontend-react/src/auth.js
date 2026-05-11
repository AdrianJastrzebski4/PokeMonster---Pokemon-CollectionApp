export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(tok) {
  localStorage.setItem("token", tok);
}
export function clearToken() {
  localStorage.removeItem("token");
}