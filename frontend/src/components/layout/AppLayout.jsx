import { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const routeTitles = {
  '/driver/dashboard': 'Dashboard',
  '/driver/stations': 'Charging Stations',
  '/driver/vehicles': 'My Vehicles',
  '/driver/book': 'Book Charging',
  '/driver/queue': 'My Queue',
  '/driver/charging': 'Live Charging',
  '/driver/history': 'History',
  '/admin/overview': 'Overview',
  '/admin/sites': 'Site & Charger Management',
  '/admin/queue': 'Queue Management',
  '/admin/grid': 'Grid Monitoring',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const pageTitle = useMemo(() => {
    return routeTitles[location.pathname] || 'ChargeMate';
  }, [location.pathname]);

  const role = user?.role || 'DRIVER';
  const userName = user?.name || 'User';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          pageTitle={pageTitle}
          onToggleSidebar={() => setSidebarOpen(true)}
          userName={userName}
          userRole={role}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
