import api from "./axios";

export const login = (data: { email: string; password: string }) =>
  api.post<{ token: string }>("/auth/login", data).then(r => r.data);

export const register = (data: {
  fullName: string;
  email: string;
  password: string;
}) => api.post("/auth/register", data);