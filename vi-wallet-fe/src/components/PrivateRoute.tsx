import React, { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
    children: ReactElement;
}

const PrivateRoute = ({ children }: Props) => {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;