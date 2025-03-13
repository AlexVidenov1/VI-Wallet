import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return localStorage.getItem("token") ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
