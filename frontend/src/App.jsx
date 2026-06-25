import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import Reports from './pages/Reports'; // ⭐ አክል
import Settings from './pages/Settings'; // ⭐ አክል

function App() {
  return (
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/interest" element={<InterestCalculator />} />
          <Route path="/external-transfer" element={<ExternalTransfer />} />
          <Route path="/reports" element={<Reports />} /> {/* ⭐ አክል */}
          <Route path="/settings" element={<Settings />} /> {/* ⭐ አክል */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;