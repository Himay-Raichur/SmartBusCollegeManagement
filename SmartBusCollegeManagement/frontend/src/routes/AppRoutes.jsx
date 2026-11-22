import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import NotFound from "../pages/NotFound.jsx";
import AdminDashboard from "../pages/admin/Dashboard.jsx";
import Students from "../pages/admin/Students.jsx";
import Drivers from "../pages/admin/Drivers.jsx";
import Buses from "../pages/admin/Buses.jsx";
import AdminRoutes from "../pages/admin/Routes.jsx";
import Passes from "../pages/admin/Passes.jsx";
import AdminTracking from "../pages/admin/Tracking.jsx";
import Reports from "../pages/admin/Reports.jsx";
import Announcements from "../pages/admin/Announcements.jsx";
import StudentDashboard from "../pages/student/Dashboard.jsx";
import StudentRoutes from "../pages/student/Routes.jsx";
import StudentPass from "../pages/student/Pass.jsx";
import StudentTracking from "../pages/student/Tracking.jsx";
import DriverDashboard from "../pages/driver/Dashboard.jsx";
import Scanner from "../pages/driver/Scanner.jsx";
import Trips from "../pages/shared/Trips.jsx";
import Validations from "../pages/shared/Validations.jsx";
import Notifications from "../pages/shared/Notifications.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="buses" element={<Buses />} />
          <Route path="routes" element={<AdminRoutes />} />
          <Route path="passes" element={<Passes />} />
          <Route path="trips" element={<Trips />} />
          <Route path="tracking" element={<AdminTracking />} />
          <Route path="validations" element={<Validations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["student"]} />}>
        <Route path="/student" element={<DashboardLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="routes" element={<StudentRoutes />} />
          <Route path="pass" element={<StudentPass />} />
          <Route path="tracking" element={<StudentTracking />} />
          <Route path="history" element={<Validations />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["driver"]} />}>
        <Route path="/driver" element={<DashboardLayout />}>
          <Route index element={<DriverDashboard />} />
          <Route path="scan" element={<Scanner />} />
          <Route path="trips" element={<Trips />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}