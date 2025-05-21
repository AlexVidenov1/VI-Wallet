import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
    const nav = useNavigate();
    const token = localStorage.getItem("token");

    function logout() {
        localStorage.removeItem("token");
        nav("/login");
    }

    return (
        <AppBar position="static">
            <Toolbar sx={{ gap: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
                        VI-Wallet
                    </Link>
                </Typography>
                {token && (
                    <Button color="inherit" component={Link} to="/wallets">
                        Wallets
                    </Button>
                )}
                {token && (
                    <Button color="inherit" component={Link} to="/transactions">
                        Transactions
                    </Button>
                )}

                {!token && (
                    <Button color="inherit" component={Link} to="/login">
                        Login
                    </Button>
                )}
                {token && (
                    <Button color="inherit" component={Link} to="/cards">
                        Cards
                    </Button> 
                )}
                {token && (
                    <Button color="inherit" onClick={logout}>
                        Logout
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
}