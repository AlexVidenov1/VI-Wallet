import { useState } from "react";  
import { Box, TextField, Button, Paper, Typography } from "@mui/material";  
import { register } from "../../api/auth";  
import { useNavigate, Link } from "react-router-dom";  

export default function Register() {  
 const nav = useNavigate();  
 const [email, setE] = useState("");  
 const [pwd, setP] = useState("");  
 const [err, setErr] = useState("");  

 async function submit() {  
   try {  
     await register({ email, password: pwd });  
     nav("/login");  
   } catch {  
     setErr("Registration failed");  
   }  
 }  

 return (  
   <Paper sx={{ p: 4, maxWidth: 400, mx: "auto", mt: 8 }}>  
     <Typography variant="h5" mb={2}>Регистрация</Typography>  
     <Box sx={{ display: "grid", gap: 2 }}>  
       <TextField label="Email" value={email} onChange={e => setE(e.target.value)} />  
       <TextField label="Password" type="password" value={pwd} onChange={e => setP(e.target.value)} />  
       {err && <Typography color="error">{err}</Typography>}  
       <Button variant="contained" onClick={submit}>Регистрация</Button>  
       <Button component={Link} to="/login">Вече имате профил? Вход</Button>  
     </Box>  
   </Paper>  
 );  
}