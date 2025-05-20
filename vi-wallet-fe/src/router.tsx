import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import TransactionsPage from "./pages/TransactionsPage";
import WalletsPage from "./pages/WalletsPage";

export default function AppRouter() {
    return (
        <>
            <Navbar />
            <Routes>
                {/* public */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* protected */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<TransactionsPage />} /> {/* ← add */}
                </Route>
                <Route element={<ProtectedRoute />}>
                    <Route path="/wallets" element={<WalletsPage />} />
                    <Route path="/wallets/:id" element={<WalletsPage />} />
                    <Route path="/wallets/:id/transactions" element={<TransactionsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </>
    );
}