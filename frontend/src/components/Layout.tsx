import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { logout as logoutAPI } from "../services/api";
import {
  LayoutDashboard,
  Trello,
  BarChart2,
  LogOut,
  Bot,
  User,
} from "lucide-react";

const navItems = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/kanban", icon: Trello, label: "Tasks" },
  { to: "/app/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/app/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const userInitial = user?.name?.[0]?.toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch {}

    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">IntellMeet</h1>
              <p className="text-xs text-slate-400">AI-Powered Meetings</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden ring-1 ring-slate-700">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user?.name || "User"} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Page Content */}
      <main className="flex-1 overflow-y-auto bg-slate-950 text-[15px] leading-6">
        <Outlet />
      </main>
    </div>
  );
}
