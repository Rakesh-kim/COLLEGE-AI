import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  RiRobot2Line, RiUploadCloud2Line, RiUser3Line,
  RiBellLine, RiDashboard2Line, RiLogoutBoxLine, RiMenuLine, RiCloseLine
} from 'react-icons/ri';

const studentNav = [
  { to: '/chat',          icon: <RiRobot2Line />,       label: 'AI Chat' },
  { to: '/upload',        icon: <RiUploadCloud2Line />, label: 'Documents' },
  { to: '/profile',       icon: <RiUser3Line />,         label: 'Profile' },
  { to: '/notifications', icon: <RiBellLine />,          label: 'Alerts' },
];

const adminNav = [
  { to: '/admin',                icon: <RiDashboard2Line />, label: 'Dashboard' },
  { to: '/admin/notifications',  icon: <RiBellLine />,       label: 'Alerts' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = isAdmin ? adminNav : studentNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavItem = ({ to, icon, label }) => (
    <NavLink
      to={to}
      end={to === '/admin'}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-primary-600/30 text-primary-400 border border-primary-600/40'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'flex' : 'hidden md:flex'} flex-col h-full w-64 glass-card rounded-none md:rounded-2xl border-r md:border border-white/5 p-4 gap-2`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 py-4 mb-2">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white text-xl">🏠</div>
        <div>
          <p className="text-sm font-bold text-white">Hostel AI</p>
          <p className="text-xs text-slate-500 capitalize">{user?.role} portal</p>
        </div>
      </div>
      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {nav.map((item) => <NavItem key={item.to} {...item} />)}
      </nav>
      {/* User + Logout */}
      <div className="border-t border-white/5 pt-4 mt-2">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-colors">
          <RiLogoutBoxLine className="text-lg" /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 shrink-0 p-3">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 h-full"><Sidebar mobile /></div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 text-xl">
            <RiMenuLine />
          </button>
          <span className="font-bold text-white text-sm">Hostel AI</span>
        </div>

        <div className="flex-1 overflow-auto p-3 md:p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
