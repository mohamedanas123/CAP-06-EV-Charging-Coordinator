import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  MapPin,
  Car,
  CalendarPlus,
  ListOrdered,
  BatteryCharging,
  History,
  Building2,
  Gauge,
  LogOut,
  X,
} from 'lucide-react';

const driverNavItems = [
  { label: 'Dashboard', path: '/driver/dashboard', icon: LayoutDashboard },
  { label: 'Charging Stations', path: '/driver/stations', icon: MapPin },
  { label: 'My Vehicles', path: '/driver/vehicles', icon: Car },
  { label: 'Book Charging', path: '/driver/book', icon: CalendarPlus },
  { label: 'My Queue', path: '/driver/queue', icon: ListOrdered },
  { label: 'Live Charging', path: '/driver/charging', icon: BatteryCharging },
  { label: 'History', path: '/driver/history', icon: History },
];

const adminNavItems = [
  { label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
  { label: 'Site Management', path: '/admin/sites', icon: Building2 },
  { label: 'Queue Management', path: '/admin/queue', icon: ListOrdered },
];

export default function Sidebar({ role, isOpen, onClose, userName, onLogout }) {
  const navItems = role === 'ADMIN' ? adminNavItems : driverNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          flex flex-col transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#245C45] rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-text-primary">ChargeMate</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-text-secondary hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-[#E8F0EB] text-[#245C45] font-semibold border-l-[3px] border-[#245C45]'
                        : 'text-[#747D77] hover:bg-gray-50 border-l-[3px] border-transparent'
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E8F0EB] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-[#245C45]">
                  {userName
                    ? userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-text-primary truncate">
                {userName || 'User'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
