import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthCtx {
  token: string | null;
  login:  (t: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const login  = (t: string) => { localStorage.setItem("token", t); setToken(t); };
  const logout = () =>        { localStorage.removeItem("token");  setToken(null); };

  return <Ctx.Provider value={{ token, login, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};