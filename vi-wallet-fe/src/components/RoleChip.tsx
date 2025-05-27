import React from "react";
import { Chip, Tooltip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getUserRole } from "../api/user";

export default function RoleChip() {
  const { data: role } = useQuery({
    queryKey: ["user", "role"],
    queryFn: getUserRole,
    staleTime: 5 * 60 * 1000,
  });

  if (!role) return null;

  const color =
    role === "Admin"      ? "error" :
    role === "ProViUser"  ? "warning"  :
    "default";

  return (
    <Tooltip
      title={
        "За да повишите или понижите ролята си моля свържете се с нас чрез:\n" +
        "е-мейл: support@vi-wallet.eu\n" +
        "телефон: 088 888 8888"
      }
      arrow
    >
      <Chip label={role} size="small" color={color} sx={{ ml: 1 }} />
    </Tooltip>
  );
}