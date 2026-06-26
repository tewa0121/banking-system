import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Transfer from './pages/Transfer';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import InterestCalculator from './pages/InterestCalculator';
import ExternalTransfer from './pages/ExternalTransfer';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserDetails from './pages/UserDetails'; // ⭐ አክል

function App() {
    return (
        <ThemeProvider>
            <Router
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <div className="App">
                    <ToastContainer position="top-right" autoClose={3000} />
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/deposit" element={<Deposit />} />
                        <Route path="/withdraw" element={<Withdraw />} />
                        <Route path="/transfer" element={<Transfer />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/users/:id" element={<UserDetails />} /> {/* ⭐ አክል */}
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/interest" element={<InterestCalculator />} />
                        <Route path="/external-transfer" element={<ExternalTransfer />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;