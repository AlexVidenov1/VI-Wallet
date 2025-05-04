import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary:  { main: "#009688" },   // teal
    secondary:{ main: "#ff9800" },   // orange
    error:    { main: "#e53935" }
  },
});