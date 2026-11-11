import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard';
import Stations from './pages/driver/Stations';
import Vehicles from './pages/driver/Vehicles';
import BookCharging from './pages/driver/BookCharging';
import MyQueue from './pages/driver/MyQueue';
import LiveCharging from './pages/driver/LiveCharging';
import ChargingHistory from './pages/driver/ChargingHistory';

// Admin Pages
import AdminOverview from './pages/admin/Overview';
import SiteManagement from './pages/admin/SiteManagement';
import QueueManagement from './pages/admin/QueueManagement';

function RootRedirect() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return isAdmin ? <Navigate to="/admin/overview" replace /> : <Navigate to="/driver/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Driver Routes */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute requiredRole="DRIVER">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/driver/dashboard" replace />} />
            <Route path="dashboard" element={<DriverDashboard />} />
            <Route path="stations" element={<Stations />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="book" element={<BookCharging />} />
            <Route path="queue" element={<MyQueue />} />
            <Route path="charging" element={<LiveCharging />} />
            <Route path="history" element={<ChargingHistory />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="sites" element={<SiteManagement />} />
            <Route path="chargers" element={<Navigate to="/admin/sites" replace />} />
            <Route path="sessions" element={<Navigate to="/admin/sites" replace />} />
            <Route path="queue" element={<QueueManagement />} />
            <Route path="grid" element={<Navigate to="/admin/sites" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
