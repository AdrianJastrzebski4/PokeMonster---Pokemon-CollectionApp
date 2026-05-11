import React, { createContext, useContext, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "../auth";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());

  const login = (tok) => {
    setToken(tok);
    setTokenState(tok);
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
  };

  const value = useMemo(() => ({ token, isAuthed: !!token, login, logout }), [token]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}