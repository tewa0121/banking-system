import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TellerDashboard from './pages/TellerDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import AuditorDashboard from './pages/AuditorDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <BrowserRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/login" />} />
                
                {/* Dashboard Router */}
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Role-based Dashboards */}
                <Route 
                    path="/dashboard/admin" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/teller" 
                    element={
                        <ProtectedRoute allowedRoles={['teller', 'admin']}>
                            <TellerDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/accountant" 
                    element={
                        <ProtectedRoute allowedRoles={['accountant', 'admin']}>
                            <AccountantDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/auditor" 
                    element={
                        <ProtectedRoute allowedRoles={['auditor', 'admin']}>
                            <AuditorDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/customer" 
                    element={
                        <ProtectedRoute allowedRoles={['customer', 'admin']}>
                            <CustomerDashboard />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;