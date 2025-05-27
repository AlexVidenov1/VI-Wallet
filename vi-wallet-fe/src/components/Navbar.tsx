import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import RoleChip from "./RoleChip";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const nav = useNavigate();
  const { token, logout } = useAuth();     // ← reactive

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2 }}>
        {/* Brand --------------------------------------------------- */}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            VI-Wallet
          </Link>
        </Typography>

        {/* Protected buttons -------------------------------------- */}
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

            <RoleChip />                                  {/* shows role */}

            <Button
              color="inherit"
              onClick={() => {
                logout();          // clears token + state
                nav("/login");     // redirect
              }}
            >
              Изход
            </Button>
          </>
        )}

        {/* Public button ------------------------------------------ */}
        {!token && (
          <Button color="inherit" component={Link} to="/login">
            Вход
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}