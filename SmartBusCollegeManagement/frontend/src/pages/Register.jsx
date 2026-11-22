import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { DynamicForm } from "../components/FormModal.jsx";

const FIELDS = [
  { name: "name", label: "Full name", required: true, half: true },
  { name: "email", label: "Email", type: "email", required: true, half: true },
  { name: "phone", label: "Phone", type: "tel", half: true },
  { name: "studentId", label: "Student ID", required: true, half: true },
  { name: "department", label: "Department", required: true, half: true },
  { name: "year", label: "Year", type: "select", required: true, half: true, options: [1, 2, 3, 4].map((y) => ({ value: y, label: `Year ${y}` })) },
  { name: "section", label: "Section", half: true },
  { name: "address", label: "Address", half: true },
  { name: "password", label: "Password", type: "password", required: true, minLength: 6, half: true },
  { name: "confirm", label: "Confirm password", type: "password", required: true, matches: "password", half: true },
];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  if (user) return <Navigate to={`/${user.role}`} replace />;

  const submit = async (v) => {
    const { confirm: _c, ...payload } = v;
    const u = await register({ ...payload, year: Number(payload.year) });
    toast.success("Account created");
    navigate(`/${u.role}`, { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-primary">Student registration</h1>
        <p className="mb-5 text-sm text-slate-500">Drivers and admins are created by the transport office.</p>
        <DynamicForm fields={FIELDS} initial={{}} onSubmit={submit} submitLabel="Create account" />
        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="text-secondary hover:underline">Login</Link>
        </p>
      </div>
    </main>
  );
}