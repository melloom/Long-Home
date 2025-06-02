import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getCurrentUser } from './services/firebase/auth';
import Home from './components/Home';
import RebuttalLibrary from './components/RebuttalLibrary';
import LeadDisposition from './components/LeadDisposition';
import CustomerService from './components/CustomerService';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import AdminLogin from './components/admin/AdminLogin';
import AdminSetup from './components/admin/AdminSetup';
import RebuttalForm from './components/admin/RebuttalForm';
import CustomerServiceManager from './components/admin/CustomerServiceManager';
import './styles/App.css';

const PrivateRoute = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/admin/login" />;
};

// Wrapper component to provide navigation to components
const NavigationWrapper = ({ Component }) => {
  const navigate = useNavigate();
  const handleNavigate = (path) => {
    navigate(`/${path}`);
  };
  return <Component onNavigate={handleNavigate} />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/rebuttals/new"
          element={
            <PrivateRoute>
              <RebuttalForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/rebuttals/edit/:id"
          element={
            <PrivateRoute>
              <RebuttalForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/customer-service"
          element={
            <PrivateRoute>
              <CustomerServiceManager />
            </PrivateRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/rebuttals" element={<NavigationWrapper Component={RebuttalLibrary} />} />
        <Route path="/disposition" element={<NavigationWrapper Component={LeadDisposition} />} />
        <Route path="/customerService" element={<NavigationWrapper Component={CustomerService} />} />
        
        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;