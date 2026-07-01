import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // ተጠቃሚው በሚናቸው መሰረት ወደ ተገቢው ዳሽቦርድ ይወሰዱ
        const roleDashboardMap = {
            admin: '/dashboard/admin',
            teller: '/dashboard/teller',
            accountant: '/dashboard/accountant',
            customer: '/dashboard/customer'
        };
        
        return <Navigate to={roleDashboardMap[user.role] || '/login'} replace />;
    }

    return children;
};

export default ProtectedRoute;