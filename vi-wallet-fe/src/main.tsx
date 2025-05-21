import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "./router";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import { AuthProvider } from "./context/AuthContext";

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <CssBaseline />
                <QueryClientProvider client={qc}>
                    <BrowserRouter>
                        <Router />
                    </BrowserRouter>
                </QueryClientProvider>
            </AuthProvider>
       </ThemeProvider>
    </React.StrictMode>
);