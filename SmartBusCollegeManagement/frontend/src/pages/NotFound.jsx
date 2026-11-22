import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3">
      <h1 className="text-5xl font-bold text-primary">404</h1>

      <p className="text-slate-600">
        This page does not exist.
      </p>

      <Link to="/" className="text-secondary hover:underline">
        Back to home
      </Link>
    </main>
  );
}