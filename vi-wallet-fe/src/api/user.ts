import api from "./axios";

export interface RoleResponse {
  role: string;   // "Regular", "ProViUser", "Admin", …
}

export const getUserRole = () =>
  api.get<RoleResponse>("/user/role").then(r => r.data.role);