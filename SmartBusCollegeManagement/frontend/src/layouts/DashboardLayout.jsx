import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bus, LayoutDashboard, Users, UserCog, Route as RouteIcon, Ticket, MapPin, ClipboardCheck,
  BarChart3, Megaphone, Bell, LogOut, Menu, X, ScanLine, History, Navigation,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const NAV = {
  admin: [
    ["/admin", "Dashboard", LayoutDashboard, true],
    ["/admin/students", "Students", Users],
    ["/admin/drivers", "Drivers", UserCog],
    ["/admin/buses", "Buses", Bus],
    ["/admin/routes", "Routes & Stops", RouteIcon],
    ["/admin/passes", "Bus Passes", Ticket],
    ["/admin/trips", "Trips", Navigation],
    ["/admin/tracking", "Live Map", MapPin],
    ["/admin/validations", "Validations", ClipboardCheck],
    ["/admin/reports", "Reports", BarChart3],
    ["/admin/announcements", "Announcements", Megaphone],
    ["/admin/notifications", "Notifications", Bell],
  ],
  student: [
    ["/student", "Dashboard", LayoutDashboard, true],
    ["/student/routes", "Routes & Stops", RouteIcon],
    ["/student/pass", "My Bus Pass", Ticket],
    ["/student/tracking", "Track My Bus", MapPin],
    ["/student/history", "Scan History", History],
    ["/student/notifications", "Notifications", Bell],
  ],
  driver: [
    ["/driver", "Dashboard", LayoutDashboard, true],
    ["/driver/scan", "Scan Pass", ScanLine],
    ["/driver/trips", "Trip History", History],
    ["/driver/notifications", "Notifications", Bell],
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    const load = () =>
      api.get("/notifications", { params: { limit: 1 } })
        .then((r) => setUnread(r.data.unread))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:pl-64">
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-primary text-slate-200 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="flex items-center gap-2 font-semibold text-white"><Bus size={20} className="text-secondary" /> Smart Bus</span>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV[user.role].map(([to, label, Icon, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-white/15 text-white" : "hover:bg-white/10"}`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
        <span className="hidden text-sm capitalize text-slate-500 lg:block">{user.role} portal</span>
        <div className="flex items-center gap-4">
          <NavLink to={`/${user.role}/notifications`} className="relative text-slate-600 hover:text-primary" aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">{unread > 99 ? "99+" : unread}</span>
            )}
          </NavLink>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">{user.name}</span>
          <button onClick={logout} className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-600">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6"><Outlet /></main>
    </div>
  );
}