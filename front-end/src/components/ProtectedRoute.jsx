import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }
    
    if (requiredRole) {
        const userData = JSON.parse(user);
        if (userData.role !== requiredRole) {
            return <Navigate to="/login" replace />;
        }
    }
    
    return children;
};

export default ProtectedRoute;
