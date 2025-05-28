import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import RoleChip from "./RoleChip";
import { useAuth } from "../context/AuthContext";
import { getUserRole } from "../pages/auth/AuthContext"; // adjust path if needed

export default function Navbar() {
  const nav = useNavigate();
  const { token, logout } = useAuth();
  const userRole = getUserRole();
  const isAdmin = userRole === "Admin";

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            VI-Wallet
          </Link>
        </Typography>

        {token && (
          <>
            <Button color="inherit" component={Link} to="/wallets">
              Портфейли
            </Button>
            <Button color="inherit" component={Link} to="/transactions">
              Транзакции
            </Button>
            <Button color="inherit" component={Link} to="/cards">
              Карти
            </Button>
            {isAdmin && (
              <Button color="inherit" component={Link} to="/admin/transactions">
                Админ транзакции
              </Button>
            )}
            <RoleChip />
            <Button
              color="inherit"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              Изход
            </Button>
          </>
        )}

        {!token && (
          <Button color="inherit" component={Link} to="/login">
            Вход
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
