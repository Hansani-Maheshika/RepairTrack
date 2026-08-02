import {
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Receipt,
  Sun,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContextValue";
import { NotificationMenu } from "../components/NotificationMenu";

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("repairtrack-staff-theme");
    return saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const links = [
    {
      to: `/${user.role.toLowerCase()}/dashboard`,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
  ];
  if (user.role !== "TECHNICIAN") {
    links.push({ to: "/customers", label: "Customers", icon: Users });
    links.push({ to: "/devices", label: "Devices", icon: HardDrive });
  }
  links.push({
    to: "/repairs",
    label: user.role === "TECHNICIAN" ? "My repairs" : "Repairs",
    icon: Wrench,
  });
  links.push({ to: "/inventory", label: "Inventory", icon: Package });
  if (user.role !== "TECHNICIAN")
    links.push({ to: "/invoices", label: "Invoices", icon: Receipt });
  if (user.role === "ADMIN")
    links.push({ to: "/admin/staff", label: "Staff", icon: UserCog });

  async function signOut() {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  }
  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      localStorage.setItem("repairtrack-staff-theme", next ? "dark" : "light");
      return next;
    });
  }
  return (
    <div
      className={`min-h-screen bg-slate-100 transition-colors ${dark ? "staff-theme-dark" : ""}`}
    >
      <button
        className="fixed left-4 top-4 z-40 rounded-lg bg-slate-950 p-2 text-white lg:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <button
          className="fixed inset-0 z-20 bg-slate-950/50 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-950 p-6 text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 text-xl font-bold">
          <span className="rounded-xl bg-cyan-400 p-2 text-slate-950">
            <Wrench size={20} />
          </span>
          RepairTrack
        </div>
        <nav className="mt-10 space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 ${isActive ? "bg-cyan-400 font-semibold text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6 border-t border-slate-800 pt-5">
          <p className="font-medium">{user.fullName}</p>
          <p className="text-sm text-slate-400">
            {user.role.replace("_", " ")}
          </p>
          <button
            className="mt-4 flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            onClick={signOut}
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>
      <button
        type="button"
        className="fixed right-20 top-4 z-40 rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-lg transition hover:-translate-y-0.5 hover:text-cyan-700"
        onClick={toggleTheme}
        aria-label={dark ? "Use light mode" : "Use dark mode"}
        title={dark ? "Light mode" : "Dark mode"}
      >
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <NotificationMenu />
      <main className="min-h-screen p-6 pt-20 lg:ml-72 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
