import { useState } from "react";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import { login as apiLogin } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();          

  const [email, setE] = useState("");
  const [pwd,   setP] = useState("");
  const [err,   setErr] = useState("");

  async function submit() {
    try {
      const { token } = await apiLogin({ email, password: pwd });
      login(token);                     
      nav("/");
    } catch {
      setErr("Невалидни данни за вход");
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: "auto", mt: 8 }}>
      <Typography variant="h5" mb={2}>Вход</Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField label="Email"     value={email} onChange={e => setE(e.target.value)} />
        <TextField label="Password"  type="password" value={pwd} onChange={e => setP(e.target.value)} />
        {err && <Typography color="error">{err}</Typography>}
        <Button variant="contained" onClick={submit}>Вход</Button>
        <Button component={Link} to="/register">Нямате профил? Регистрация</Button>
      </Box>
    </Paper>
  );
}