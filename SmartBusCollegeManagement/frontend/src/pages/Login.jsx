import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bus } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Field, inputCls } from "../components/ui.jsx";
import { errMsg } from "../utils/format.js";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={`/${user.role}`} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(v.email)) er.email = "Enter a valid email";
    if (!v.password) er.password = "Password is required";
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try {
      const u = await login(v.email.trim(), v.password);
      toast.success(`Welcome, ${u.name}`);
      navigate(`/${u.role}`, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} noValidate className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 text-primary"><Bus /> <h1 className="text-lg font-semibold">Sign in</h1></div>
        <Field label="Email" error={errors.email}>
          <input className={inputCls} type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input className={inputCls} type="password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
        </Field>
        <Button type="submit" loading={loading} className="w-full">Login</Button>
        <p className="text-center text-sm text-slate-500">
          New student? <Link to="/register" className="text-secondary hover:underline">Register</Link>
        </p>
      </form>
    </main>
  );
}