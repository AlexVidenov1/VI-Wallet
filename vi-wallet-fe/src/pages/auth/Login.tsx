import { useState } from "react";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import { login as apiLogin } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();          // NEW

  const [email, setE] = useState("");
  const [pwd,   setP] = useState("");
  const [err,   setErr] = useState("");

  async function submit() {
    try {
      const { token } = await apiLogin({ email, password: pwd });
      login(token);                     // updates context + localStorage
      nav("/");
    } catch {
      setErr("Invalid credentials");
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: "auto", mt: 8 }}>
      <Typography variant="h5" mb={2}>Login</Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField label="Email"     value={email} onChange={e => setE(e.target.value)} />
        <TextField label="Password"  type="password" value={pwd} onChange={e => setP(e.target.value)} />
        {err && <Typography color="error">{err}</Typography>}
        <Button variant="contained" onClick={submit}>Login</Button>
        <Button component={Link} to="/register">No account? Register</Button>
      </Box>
    </Paper>
  );
}