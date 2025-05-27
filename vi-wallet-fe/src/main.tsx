import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "./router";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from 'react-error-boundary';
import { SnackbarProvider, useSnackbar } from 'notistack';

function ErrorFallback({ error }: { error: Error }) {
    const { enqueueSnackbar } = useSnackbar();
    React.useEffect(() => {
        enqueueSnackbar(error.message, { variant: "error" });
    }, [error, enqueueSnackbar]);
    return null; // or a fallback UI
}

const qc = new QueryClient();

function App() {
    return (
        <SnackbarProvider maxSnack={3}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
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
            </ErrorBoundary>
        </SnackbarProvider>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
