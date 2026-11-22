import { Link } from "react-router-dom";
import { Bus, QrCode, MapPin, Bell, ShieldCheck, BarChart3, Users, UserCog, Truck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  [QrCode, "Digital bus pass", "Apply online and get a QR pass once the transport office approves."],
  [ShieldCheck, "Server-side validation", "Every scan is checked against the database, not just the QR contents."],
  [MapPin, "Bus tracking", "Demo simulation or real driver GPS, always clearly labelled."],
  [Bell, "In-app notifications", "Approvals, route changes, delays and announcements."],
  [Users, "Route & stop management", "Routes, ordered stops, bus and driver assignment."],
  [BarChart3, "Reports", "Route load, bus utilisation, pass and trip statistics."],
];
const STEPS = ["Register as a student", "Apply for a pass on your route", "Admin approves and assigns a bus", "Show your QR pass and track the bus"];
const ROLES = [
  [Users, "Student", "Apply for passes, view the digital pass and QR, track the bus, get notifications."],
  [Truck, "Driver", "Start and end trips, share location, scan and validate student passes."],
  [UserCog, "Admin", "Manage buses, routes, drivers, students and approvals, and view reports."],
];

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between bg-primary px-6 py-4 text-white">
        <span className="flex items-center gap-2 font-semibold"><Bus className="text-secondary" /> Smart Bus College Management</span>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <Link to={`/${user.role}`} className="rounded-lg bg-accent px-4 py-2 font-medium">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="rounded-lg bg-accent px-4 py-2 font-medium">Register</Link>
            </>
          )}
        </div>
      </nav>

      <header className="bg-primary px-6 pb-20 pt-12 text-center text-white">
        <h1 className="mx-auto max-w-3xl text-3xl font-bold md:text-5xl">College transport, digitised end to end</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          One platform for students, drivers and transport administrators: routes, passes, QR validation and bus tracking.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register" className="rounded-lg bg-accent px-6 py-3 font-medium">Get started</Link>
          <Link to="/login" className="rounded-lg border border-white/40 px-6 py-3 font-medium">Login</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-primary">Features</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, t, d]) => (
            <div key={t} className="rounded-xl border border-slate-200 p-5">
              <Icon className="mb-3 text-accent" />
              <h3 className="font-semibold text-primary">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-primary">How it works</h2>
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s} className="rounded-xl bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-semibold text-white">{i + 1}</div>
              <p className="text-sm text-slate-700">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-primary">User roles</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {ROLES.map(([Icon, t, d]) => (
            <div key={t} className="rounded-xl border border-slate-200 p-6 text-center">
              <Icon className="mx-auto mb-3 text-secondary" size={30} />
              <h3 className="font-semibold text-primary">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-primary py-6 text-center text-sm text-slate-300">
        Smart Bus College Management System · Final-year B.Tech CSE project
      </footer>
    </div>
  );
}